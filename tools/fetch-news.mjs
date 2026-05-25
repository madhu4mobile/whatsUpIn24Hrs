#!/usr/bin/env node
/**
 * fetch-news.mjs
 *
 * Pulls RSS headlines from major international outlets, filters to items
 * published in the last 24 hours, and asks Claude (Anthropic API) to:
 *   1. Pick the 9 most globally impactful stories.
 *   2. Write an original 60-80 word neutral narration per story.
 *   3. Return city/country/coords for the video map.
 *
 * Output:
 *   src/data/newsContent.json   — overwritten with today's content.
 *
 * Environment:
 *   ANTHROPIC_API_KEY    REQUIRED (https://console.anthropic.com/)
 *   ANTHROPIC_MODEL      default "claude-haiku-4-5-20251001"
 *   SKIP_NEWS_FETCH      set to "1" to skip this step entirely (use the
 *                        existing newsContent.json instead). Useful when
 *                        offline or testing the video pipeline.
 *
 * Cost: roughly $0.02–0.05 per run with Haiku 4.5 (well under 10K input
 * tokens, ~2K output).
 */

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const CONTENT_FILE = path.join(projectRoot, "src", "data", "newsContent.json");

// ─── Config ────────────────────────────────────────────────────────────

// Free public RSS feeds. Keep this list diverse — different ideological
// leanings + regional coverage make the LLM's "pick top 9" choice better.
const FEEDS = [
  { name: "Reuters World",     url: "https://feeds.reuters.com/Reuters/worldNews" },
  { name: "Reuters Top News",  url: "https://feeds.reuters.com/reuters/topNews" },
  { name: "AP World",          url: "https://feeds.apnews.com/rss/apf-worldnews" },
  { name: "AP Top",            url: "https://feeds.apnews.com/rss/apf-topnews" },
  { name: "BBC World",         url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "BBC Top",           url: "https://feeds.bbci.co.uk/news/rss.xml" },
  { name: "Al Jazeera",        url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "NYT World",         url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { name: "Guardian World",    url: "https://www.theguardian.com/world/rss" },
  { name: "DW Top",            url: "https://rss.dw.com/rdf/rss-en-top" },
  { name: "France24 World",    url: "https://www.france24.com/en/rss" },
  { name: "NPR World",         url: "https://feeds.npr.org/1004/rss.xml" },
];

const HOURS_BACK = 24;
const MAX_ITEMS_TO_LLM = 80; // cap RSS items sent to model to control cost
const MAX_RETRIES = 2;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

// ─── Helpers ───────────────────────────────────────────────────────────

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent":
      "DailyGlobalPulse/0.1 (+local development; contact: madhu4mobile@gmail.com)",
  },
});

async function fetchFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).map((item) => ({
      source: feed.name,
      title: (item.title || "").trim(),
      link: item.link,
      summary: (item.contentSnippet || item.content || item.summary || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400),
      isoDate: item.isoDate || item.pubDate,
    }));
  } catch (err) {
    console.warn(`  [fetch-news] skip ${feed.name}: ${err.message}`);
    return [];
  }
}

async function fetchAllFeeds() {
  console.log(`[fetch-news] pulling ${FEEDS.length} RSS feeds…`);
  const results = await Promise.all(FEEDS.map(fetchFeed));
  let all = results.flat();
  console.log(`[fetch-news] got ${all.length} items total before filtering`);

  // Filter to last N hours
  const cutoff = Date.now() - HOURS_BACK * 3600 * 1000;
  all = all.filter((it) => {
    if (!it.isoDate) return false;
    const t = Date.parse(it.isoDate);
    return Number.isFinite(t) && t >= cutoff;
  });
  console.log(`[fetch-news] ${all.length} items in last ${HOURS_BACK}h`);

  // Dedupe near-identical headlines (lowercase + first 40 chars)
  const seen = new Map();
  for (const it of all) {
    const key = it.title.toLowerCase().slice(0, 40);
    if (!seen.has(key)) seen.set(key, it);
  }
  all = Array.from(seen.values());
  console.log(`[fetch-news] ${all.length} items after deduping headlines`);

  // Sort newest first, cap
  all.sort((a, b) => Date.parse(b.isoDate) - Date.parse(a.isoDate));
  return all.slice(0, MAX_ITEMS_TO_LLM);
}

function buildPrompt(items, todayString) {
  const itemList = items
    .map(
      (it, i) =>
        `${i + 1}. [${it.source}] (${new Date(it.isoDate).toISOString()}) ` +
        `${it.title}\n   ${it.summary || "(no summary)"}\n   url: ${it.link || ""}`
    )
    .join("\n\n");

  return `You are the senior editor for "Daily Global Pulse", a 5–6 minute daily global-news briefing optimised for 9:16 mobile reels (YouTube Shorts, Instagram Reels, TikTok).

INPUT: ${items.length} news items from the last ${HOURS_BACK} hours.

YOUR JOB: select the 9 most globally impactful stories from this list and produce the JSON described below.

SELECTION RULES:
- Diversify across regions. Don't put more than 3 stories from any single country.
- Prefer hard news: politics, conflict, economy, diplomacy, disasters, science breakthroughs, major policy.
- Skip celebrity gossip, sports recaps, lifestyle, opinion columns.
- Prefer stories that lend themselves to a map (a place is involved).
- If two outlets cover the same event, treat as one story — combine the sources.

NARRATION RULES (very important):
- Each story's "narration" field must be your ORIGINAL writing — do NOT copy phrases from the input. Synthesise the facts and write a fresh 60-80 word script in the voice of a calm, BBC-World-style news anchor.
- Spell out numbers in narrations ("twenty-one", not "21"; "nine billion", not "$9B").
- Use natural pauses ("—") and varied sentence length.
- End the hook with "This is your Daily Global Pulse." End the closer with "I'm your Daily Global Pulse."

OUTPUT: a single valid JSON object — no markdown fences, no commentary before or after. Match this shape exactly:

{
  "videoTitle": "3–6 word evocative title that pulls 2–3 story themes together",
  "stories": [
    {
      "id": 1,
      "headline": "8–12 word original headline, NOT copied from sources",
      "summary": "2–3 sentence factual summary, your own words",
      "region": "Middle East | Europe | North America | Asia-Pacific | Africa | South America | Global",
      "regionFlag": "🇮🇶",
      "category": "DISASTER | CONFLICT | POLITICS | ECONOMY | DIPLOMACY | TRADE | POLICY | TECH | CULTURE",
      "categoryColor": "#hex",
      "keyFact": "one-line punchy stat",
      "narration": "60–80 word original neutral narration. MUST be your own writing.",
      "timestamp": "based on story position (story 1 ≈ '0:08 – 0:50', each ~40s)",
      "visualDescription": "one-sentence scene direction for the video",
      "musicMood": "one-line tone description",
      "sources": ["array of source names from the input that covered this"],
      "countryId": "ISO 3166-1 numeric as string (e.g. '368' for Iraq, '840' for USA)",
      "cityName": "City, Country",
      "cityCoords": [longitude, latitude]
    }
    // …8 more
  ],
  "hookNarration": "≈45–55 word teaser hitting 3 top stories. End with 'This is your Daily Global Pulse.'",
  "closerNarration": "≈70–85 word wrap-up tying themes together. End with 'I'm your Daily Global Pulse.'",
  "socialDescription": "One-sentence summary suitable for an Instagram/YouTube caption. Start with 🌍 ${todayString}",
  "hashtags": ["#DailyGlobalPulse", "#WorldNews", "#BreakingNews", "...10 more story-specific hashtags"]
}

categoryColor mapping (use exactly these):
  DISASTER  #ef4444
  CONFLICT  #dc2626
  POLITICS  #3b82f6
  ECONOMY   #f59e0b
  DIPLOMACY #8b5cf6
  TRADE     #10b981
  POLICY    #6366f1
  TECH      #06b6d4
  CULTURE   #ec4899

INPUT ITEMS:
${itemList}

Return ONLY the JSON object.`;
}

function extractJson(text) {
  // Strip ```json fences if present
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return JSON.parse(fence[1]);
  // Otherwise grab the first {...} block
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1)
    throw new Error("No JSON object found in model response");
  return JSON.parse(text.slice(first, last + 1));
}

function validateContent(content) {
  if (!content || typeof content !== "object")
    throw new Error("Content is not an object");
  if (!Array.isArray(content.stories) || content.stories.length !== 9)
    throw new Error(
      `Expected 9 stories, got ${content.stories?.length ?? "none"}`
    );
  if (typeof content.hookNarration !== "string" || !content.hookNarration)
    throw new Error("Missing hookNarration");
  if (typeof content.closerNarration !== "string" || !content.closerNarration)
    throw new Error("Missing closerNarration");
  for (const [i, s] of content.stories.entries()) {
    const required = [
      "headline",
      "summary",
      "region",
      "regionFlag",
      "category",
      "categoryColor",
      "keyFact",
      "narration",
      "timestamp",
      "visualDescription",
      "musicMood",
      "sources",
      "countryId",
      "cityName",
      "cityCoords",
    ];
    for (const k of required) {
      if (s[k] === undefined || s[k] === null) {
        throw new Error(`Story ${i + 1}: missing field "${k}"`);
      }
    }
    if (
      !Array.isArray(s.cityCoords) ||
      s.cityCoords.length !== 2 ||
      typeof s.cityCoords[0] !== "number" ||
      typeof s.cityCoords[1] !== "number"
    ) {
      throw new Error(`Story ${i + 1}: cityCoords must be [lon, lat] numbers`);
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  if (process.env.SKIP_NEWS_FETCH === "1") {
    console.log(
      "[fetch-news] SKIP_NEWS_FETCH=1 — leaving newsContent.json untouched."
    );
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(
      "[fetch-news] ANTHROPIC_API_KEY is not set — skipping fetch and using\n" +
        "             the existing src/data/newsContent.json.\n" +
        "             Get a key at https://console.anthropic.com/ and set:\n" +
        "             Windows PowerShell:   $env:ANTHROPIC_API_KEY=\"sk-ant-…\"\n" +
        "             cmd.exe:              set ANTHROPIC_API_KEY=sk-ant-…\n" +
        "             macOS/Linux:          export ANTHROPIC_API_KEY=sk-ant-…\n" +
        "             To suppress this warning explicitly, set SKIP_NEWS_FETCH=1."
    );
    return;
  }

  const items = await fetchAllFeeds();
  if (items.length === 0) {
    throw new Error(
      "No news items found in the last 24h from any feed. Check internet connectivity."
    );
  }

  const todayString = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const client = new Anthropic({ apiKey });

  console.log(
    `[fetch-news] asking ${MODEL} to pick top 9 + write narrations (${items.length} candidates)…`
  );

  let content;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: buildPrompt(items, todayString),
          },
        ],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock) throw new Error("Model returned no text block");
      const parsed = extractJson(textBlock.text);
      validateContent(parsed);
      content = parsed;
      break;
    } catch (err) {
      lastErr = err;
      console.warn(
        `[fetch-news] attempt ${attempt} failed: ${err.message}` +
          (attempt <= MAX_RETRIES ? " — retrying" : "")
      );
    }
  }
  if (!content) {
    console.error("[fetch-news] giving up after retries:", lastErr);
    throw lastErr;
  }

  // Add the fields the LLM doesn't need to generate (date, subtitle)
  content.todayDate = todayString;
  content.videoSubtitle = "Your Daily Global Pulse in 5 Minutes";

  // Re-number story ids 1..9 to keep them deterministic regardless of order
  content.stories.forEach((s, i) => {
    s.id = i + 1;
  });

  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2));
  console.log(
    `[fetch-news] ✓ wrote ${path.relative(projectRoot, CONTENT_FILE)} ` +
      `(${content.stories.length} stories, title: "${content.videoTitle}")`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
