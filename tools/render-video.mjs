#!/usr/bin/env node
/**
 * render-video.mjs
 *
 * Loads dist/video.html in headless Chromium at exactly 1080x1920, injects
 * the narration timing manifest via window.__VIDEO_MANIFEST__, lets the
 * scene player run, waits for body.dataset.videoComplete === "true", then
 * muxes the recorded webm with dist/narration.mp3 into a final MP4.
 *
 * Prerequisites:
 *   - dist/video.html  (run: npm run build)
 *   - dist/narration.mp3 + dist/narration.json  (run: npm run tts)
 *   - Playwright Chromium installed  (npx playwright install chromium)
 *   - ffmpeg on PATH
 *
 * Output:
 *   dist/daily-global-pulse.mp4   — 1080x1920 H.264 + AAC, faststart
 *
 * Environment overrides:
 *   VIDEO_FPS         default 30
 *   VIDEO_OUT         override output mp4 path
 *   VIDEO_KEEP_WEBM   set to "1" to keep the raw webm for debugging
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const DIST_DIR = path.join(projectRoot, "dist");
const BUILT_VIDEO_HTML = path.join(DIST_DIR, "video.html");
const NARRATION_MP3 = path.join(DIST_DIR, "narration.mp3");
const NARRATION_META = path.join(DIST_DIR, "narration.json");
const VIDEO_RAW_DIR = path.join(DIST_DIR, "video-raw");
const FINAL_MP4 =
  process.env.VIDEO_OUT || path.join(DIST_DIR, "daily-global-pulse.mp4");

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = Number(process.env.VIDEO_FPS || 30);
// Safety cap: how long we'll wait for the page to set videoComplete before
// giving up (in case the scene player crashes silently).
const MAX_WAIT_SEC = 60 * 15;

async function preflight() {
  const missing = [];
  if (!existsSync(BUILT_VIDEO_HTML))
    missing.push(`built video page (${BUILT_VIDEO_HTML})  — run \`npm run build\``);
  if (!existsSync(NARRATION_MP3))
    missing.push(`narration mp3 (${NARRATION_MP3})  — run \`npm run tts\``);
  if (!existsSync(NARRATION_META))
    missing.push(`narration manifest (${NARRATION_META})  — run \`npm run tts\``);
  if (missing.length) {
    throw new Error(
      "Missing prerequisites:\n  - " + missing.join("\n  - ") + "\n"
    );
  }
}

async function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))
    );
  });
}

async function main() {
  await preflight();

  const manifest = JSON.parse(await fs.readFile(NARRATION_META, "utf-8"));
  const totalAudioSec = Number(manifest.totalDurationSec);
  const holdEndSec = Number(manifest.holdEndSec ?? 1.5);
  if (!Number.isFinite(totalAudioSec) || totalAudioSec <= 0) {
    throw new Error(`Invalid narration duration: ${manifest.totalDurationSec}`);
  }
  console.log(
    `[render] manifest: ${manifest.segments.length} segments, ` +
      `audio=${totalAudioSec.toFixed(2)}s, hold=${holdEndSec.toFixed(2)}s ` +
      `→ video ≈ ${(totalAudioSec + holdEndSec).toFixed(2)}s`
  );

  await fs.rm(VIDEO_RAW_DIR, { recursive: true, force: true });
  await fs.mkdir(VIDEO_RAW_DIR, { recursive: true });

  const browser = await chromium.launch({
    args: [
      "--autoplay-policy=no-user-gesture-required",
      // Disable a couple of subsystems that can introduce frame-rate jitter
      // during long offscreen recordings.
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: VIDEO_RAW_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
    reducedMotion: "no-preference",
  });

  // Inject the timing manifest BEFORE any document scripts run, so VideoApp
  // sees window.__VIDEO_MANIFEST__ on first render.
  await context.addInitScript({
    content: `window.__VIDEO_MANIFEST__ = ${JSON.stringify(manifest)};`,
  });

  const page = await context.newPage();
  const fileUrl = url.pathToFileURL(BUILT_VIDEO_HTML).href;
  console.log(`[render] opening ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: "load" });

  // Wait for the scene player to finish. VideoApp sets
  // document.body.dataset.videoComplete = "true" when its internal clock
  // exceeds totalDurationSec + holdEndSec.
  console.log("[render] recording — waiting for videoComplete flag…");
  try {
    await page.waitForFunction(
      () => document.body.dataset.videoComplete === "true",
      undefined,
      { timeout: MAX_WAIT_SEC * 1000, polling: 200 }
    );
  } catch (err) {
    console.error(
      `[render] WARNING: never saw videoComplete flag within ${MAX_WAIT_SEC}s. ` +
        `Closing context anyway with whatever was recorded.`
    );
  }

  // Closing the context flushes the video file to disk.
  await context.close();
  await browser.close();

  const files = await fs.readdir(VIDEO_RAW_DIR);
  const webm = files.find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("Playwright did not produce a recorded video");
  const webmPath = path.join(VIDEO_RAW_DIR, webm);
  console.log(`[render] recorded ${path.relative(projectRoot, webmPath)}`);

  console.log("[render] muxing video + audio via ffmpeg…");
  await runFfmpeg([
    "-y",
    "-i",
    webmPath,
    "-i",
    NARRATION_MP3,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    FINAL_MP4,
  ]);

  if (process.env.VIDEO_KEEP_WEBM !== "1") {
    await fs.rm(VIDEO_RAW_DIR, { recursive: true, force: true });
  }

  const stat = await fs.stat(FINAL_MP4);
  console.log(
    `[render] ✓ ${path.relative(projectRoot, FINAL_MP4)} ` +
      `(${(stat.size / 1024 / 1024).toFixed(1)} MB)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
