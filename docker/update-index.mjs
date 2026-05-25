#!/usr/bin/env node
/**
 * update-index.mjs
 *
 * Scans the show output directory for *.mp4 files, pairs each with its
 * sidecar .jpg thumbnail, looks up the corresponding newsContent
 * snapshot (per-day), and writes a single index.json that the web
 * viewer consumes.
 *
 * Usage:
 *   node update-index.mjs \
 *     --show-dir "/output/Daily Global Pulse" \
 *     --out      "/output/index.json" \
 *     --show-name "Daily Global Pulse" \
 *     --content-dir "/content"
 *
 * Output shape (consumed by docker/web-viewer/index.html):
 *   {
 *     "generatedAt": "2026-05-14T09:01:34.123Z",
 *     "showName": "Daily Global Pulse",
 *     "entries": [
 *       {
 *         "date": "2026-05-14",
 *         "title": "Three Word Title",
 *         "mp4": "Daily Global Pulse/Daily Global Pulse - 2026-05-14 - Three-Word-Title.mp4",
 *         "thumb": "Daily Global Pulse/Daily Global Pulse - 2026-05-14 - Three-Word-Title.jpg",
 *         "sizeBytes": 14392041,
 *         "mtime": 1747200094321,
 *         "hookNarration": "…",
 *         "storyCount": 9
 *       },
 *       …
 *     ]
 *   }
 */

import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 2) {
    const k = argv[i].replace(/^--/, "");
    out[k] = argv[i + 1];
  }
  return out;
}

const args = parseArgs(process.argv);
const SHOW_DIR = args["show-dir"];
const OUT_FILE = args["out"];
const SHOW_NAME = args["show-name"] || "Daily Global Pulse";
const CONTENT_DIR = args["content-dir"];

if (!SHOW_DIR || !OUT_FILE) {
  console.error(
    "usage: update-index.mjs --show-dir <dir> --out <file> [--show-name <name>] [--content-dir <dir>]"
  );
  process.exit(1);
}

// Filename pattern produced by entrypoint.sh:
//   "<show> - YYYY-MM-DD - <slug>.mp4"
// We capture the date and title slug.
const FILE_RE = new RegExp(
  "^" +
    SHOW_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
    " - (\\d{4}-\\d{2}-\\d{2}) - (.+)\\.mp4$"
);

async function main() {
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });

  let files = [];
  try {
    files = await fs.readdir(SHOW_DIR);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    // Show dir doesn't exist yet — write an empty index
  }

  const mp4s = files
    .filter((f) => f.endsWith(".mp4"))
    .map((f) => ({ name: f, match: f.match(FILE_RE) }))
    .filter((x) => x.match);

  const entries = [];
  for (const { name, match } of mp4s) {
    const date = match[1];
    const titleSlug = match[2];
    const fullMp4 = path.join(SHOW_DIR, name);
    const fullJpg = fullMp4.replace(/\.mp4$/, ".jpg");

    let stat;
    try {
      stat = await fs.stat(fullMp4);
    } catch {
      continue;
    }
    const hasThumb = await fs
      .stat(fullJpg)
      .then(() => true)
      .catch(() => false);

    // Look up sidecar content snapshot for richer metadata
    let title = titleSlug.replace(/-/g, " ");
    let hookNarration = null;
    let storyCount = null;
    if (CONTENT_DIR) {
      try {
        const snap = JSON.parse(
          await fs.readFile(path.join(CONTENT_DIR, `${date}.json`), "utf-8")
        );
        if (typeof snap.videoTitle === "string" && snap.videoTitle.trim()) {
          title = snap.videoTitle;
        }
        if (typeof snap.hookNarration === "string") {
          hookNarration = snap.hookNarration;
        }
        if (Array.isArray(snap.stories)) storyCount = snap.stories.length;
      } catch {
        // No sidecar — fall back to slug-derived title
      }
    }

    // Paths in index are relative to the dir containing index.json so
    // the static web viewer can dereference them with a plain href.
    const indexDir = path.dirname(OUT_FILE);
    const relMp4 = path.relative(indexDir, fullMp4).replace(/\\/g, "/");
    const relThumb = hasThumb
      ? path.relative(indexDir, fullJpg).replace(/\\/g, "/")
      : null;

    entries.push({
      date,
      title,
      mp4: relMp4,
      thumb: relThumb,
      sizeBytes: stat.size,
      mtime: stat.mtimeMs,
      hookNarration,
      storyCount,
    });
  }

  // Newest first
  entries.sort((a, b) => b.date.localeCompare(a.date));

  const index = {
    generatedAt: new Date().toISOString(),
    showName: SHOW_NAME,
    entries,
  };
  await fs.writeFile(OUT_FILE, JSON.stringify(index, null, 2));
  console.log(
    `[update-index] wrote ${path.basename(OUT_FILE)} (${entries.length} entries)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
