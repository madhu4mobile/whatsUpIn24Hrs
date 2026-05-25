// ───────────────────────────────────────────────────────────────────────
// newsData.ts
//
// This file exports STATIC config (interfaces, brand strings, schedule
// helpers, publishing channels, automation workflow). The DAILY-CHANGING
// content (today's stories, headlines, narrations, hashtags) lives in
// `newsContent.json`, which is overwritten by `tools/fetch-news.mjs`
// every time `npm run video` is run.
//
// Components should keep importing from this file — the dynamic re-exports
// at the bottom preserve the existing API.
// ───────────────────────────────────────────────────────────────────────

import newsContent from "./newsContent.json";

// ─── Types ─────────────────────────────────────────────────────────────

export interface NewsStory {
  id: number;
  headline: string;
  summary: string;
  region: string;
  regionFlag: string;
  category: string;
  categoryColor: string;
  keyFact: string;
  narration: string;
  timestamp: string;
  visualDescription: string;
  musicMood: string;
  sources: string[];
  /**
   * Geographic anchor for the video map.
   * countryId is the ISO 3166-1 numeric code as a string — matches the `id`
   * field used by world-atlas/countries-110m.json. cityCoords are
   * [longitude, latitude] (d3-geo's expected order, NOT lat-lng).
   */
  countryId: string;
  cityName: string;
  cityCoords: [number, number];
}

export interface ScheduleInfo {
  timezone: string;
  updateTime: string;
  nextUpdate: string;
  lastUpdate: string;
  status: "live" | "scheduled" | "processing" | "preview";
}

export interface PublishingChannel {
  id: string;
  name: string;
  icon: string;
  status: "published" | "scheduled" | "pending" | "failed" | "preview";
  publishedAt?: string;
  scheduledFor?: string;
  url?: string;
  specs: string;
  color: string;
}

// ─── Preview mode flag ─────────────────────────────────────────────────

// While automated uploads aren't wired up yet, the app runs in "preview"
// mode. Flip this to false (and populate real publishedAt timestamps on the
// channels below) once the upload pipeline is real.
export const previewMode: boolean = true;

// ─── Live schedule helpers ─────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function getNextUpdateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";

  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const nyHour = parseInt(get("hour"), 10) % 24;

  let target = new Date(Date.UTC(year, month - 1, day));
  if (nyHour >= 5) target = new Date(target.getTime() + 86400000);

  const m = MONTH_NAMES[target.getUTCMonth()];
  const d = target.getUTCDate();
  const y = target.getUTCFullYear();
  return `${m} ${d}, ${y} at 5:00 AM EST`;
}

export function getLastUpdateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";

  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const nyHour = parseInt(get("hour"), 10) % 24;

  let target = new Date(Date.UTC(year, month - 1, day));
  if (nyHour < 5) target = new Date(target.getTime() - 86400000);

  const m = MONTH_NAMES[target.getUTCMonth()];
  const d = target.getUTCDate();
  const y = target.getUTCFullYear();
  return `${m} ${d}, ${y} at 5:00 AM EST`;
}

export const scheduleInfo: ScheduleInfo = {
  timezone: "EST (UTC-5)",
  updateTime: "5:00 AM",
  nextUpdate: getNextUpdateString(),
  lastUpdate: getLastUpdateString(),
  status: previewMode ? "preview" : "live",
};

// ─── Publishing channels (static brand config) ────────────────────────

export const publishingChannels: PublishingChannel[] = [
  {
    id: "youtube",
    name: "YouTube Shorts",
    icon: "▶️",
    status: "preview",
    url: "https://youtube.com/shorts/",
    specs: "9:16 • ~5:47 target",
    color: "from-red-600 to-red-500",
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    icon: "📸",
    status: "preview",
    url: "https://instagram.com/reel/",
    specs: "9:16 • ~5:47 target",
    color: "from-purple-600 to-pink-500",
  },
  {
    id: "facebook",
    name: "Facebook Reels",
    icon: "👤",
    status: "preview",
    url: "https://facebook.com/reel/",
    specs: "9:16 • ~5:47 target",
    color: "from-blue-600 to-blue-500",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: "𝕏",
    status: "preview",
    url: "https://x.com/",
    specs: "9:16 • ~2:20 (Part 1/3)",
    color: "from-gray-700 to-gray-600",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    status: "preview",
    url: "https://tiktok.com/",
    specs: "9:16 • ~5:47 target",
    color: "from-gray-900 to-gray-800",
  },
];

// ─── Dynamic content (sourced from newsContent.json) ──────────────────

export const todayDate: string = newsContent.todayDate;
export const videoTitle: string = newsContent.videoTitle;
export const videoSubtitle: string = newsContent.videoSubtitle;
export const stories: NewsStory[] = newsContent.stories as NewsStory[];
export const hookNarration: string = newsContent.hookNarration;
export const closerNarration: string = newsContent.closerNarration;
export const socialDescription: string = newsContent.socialDescription;
export const hashtags: string[] = newsContent.hashtags;

// ─── Editorial direction (static — describes the brand voice) ─────────

export const voiceDirection =
  "Calm and authoritative with a measured, warm pace. American accent — think BBC World meets modern podcast. Natural pauses for emphasis between stories. Slightly more somber tone for stories 1 and 4. Energized but neutral for trade and politics segments.";

export const suggestedMusic =
  "Primary: Cinematic news underscore — clean, modern, minimal. Shifts to somber strings for disaster/conflict stories, light electronic pulse for trade/politics. No lyrics. Subtle tempo build from hook to closer.";

export const originalityStatement = `
All content in this Daily Global Pulse edition is 100% original.

• Narration scripts are written by AI from scratch based on verified facts
• No text is copied from source articles — all information is synthesized and rewritten
• Headlines are original creations summarizing the news
• Visual and music direction are original creative suggestions
• Sources are cited for fact verification, not content reproduction

This briefing aggregates publicly reported facts from multiple international news sources,
synthesizes them into original narration, and attributes all factual claims to their sources.
No copyrighted content is reproduced.
`;

export const automationWorkflow = [
  {
    step: 1,
    time: "4:00 AM EST",
    action: "News Gathering",
    description: "AI crawls Reuters, AP, BBC, Al Jazeera, NYT, and 15+ verified sources for last 24h headlines",
  },
  {
    step: 2,
    time: "4:15 AM EST",
    action: "Story Selection",
    description: "AI selects 7-10 highest-impact global stories based on significance, reach, and diversity",
  },
  {
    step: 3,
    time: "4:25 AM EST",
    action: "Script Generation",
    description: "Original narration scripts written from scratch — no plagiarism, all facts verified",
  },
  {
    step: 4,
    time: "4:40 AM EST",
    action: "Visual Direction",
    description: "Scene-by-scene visual instructions and music cues generated for video production",
  },
  {
    step: 5,
    time: "4:50 AM EST",
    action: "Video Rendering",
    description: "5-7 minute vertical video rendered with AI voiceover, graphics, and transitions",
  },
  {
    step: 6,
    time: "5:00 AM EST",
    action: "Multi-Platform Publish",
    description: "Auto-publish to YouTube Shorts, Instagram Reels, Facebook Reels, X, and TikTok",
  },
];
