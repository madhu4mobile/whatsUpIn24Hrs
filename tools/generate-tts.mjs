#!/usr/bin/env node
/**
 * generate-tts.mjs
 *
 * Synthesises one MP3 per narration segment (hook + 9 stories + closer) via
 * edge-tts, measures each duration, concatenates them with a brief silence
 * gap between segments, and writes a manifest the video renderer uses to
 * time each scene to its audio.
 *
 * Outputs (into dist/):
 *   narration.txt      — full joined script (for debugging)
 *   narration.mp3      — concatenated final audio
 *   narration.json     — timing manifest:
 *     {
 *       voice, rate, totalDurationSec, holdEndSec,
 *       segments: [
 *         { type: "hook"|"story"|"closer", index?: number,
 *           startSec, durationSec, text }
 *       ]
 *     }
 *   segments/*.mp3     — individual segment files (kept for debugging)
 *
 * Requirements:
 *   - Python 3 with edge-tts installed:  pip install edge-tts
 *   - ffmpeg on PATH (ffprobe is preferred but not required)
 *
 * Environment overrides:
 *   TTS_VOICE   default "en-US-AndrewNeural"
 *   TTS_RATE    default "-5%"
 *   TTS_CMD     default "edge-tts"
 *   TTS_GAP_SEC default 0.4   — silence between segments
 */

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const DIST_DIR = path.join(projectRoot, "dist");
const SEGMENTS_DIR = path.join(DIST_DIR, "segments");
const NEWS_CONTENT_FILE = path.join(
  projectRoot,
  "src",
  "data",
  "newsContent.json"
);
const NARRATION_TXT = path.join(DIST_DIR, "narration.txt");
const NARRATION_MP3 = path.join(DIST_DIR, "narration.mp3");
const NARRATION_META = path.join(DIST_DIR, "narration.json");
const SILENCE_MP3 = path.join(SEGMENTS_DIR, "_silence.mp3");
const CONCAT_LIST = path.join(SEGMENTS_DIR, "_concat.txt");

const VOICE = process.env.TTS_VOICE || "en-US-AndrewNeural";
const RATE = process.env.TTS_RATE || "-5%";
const EDGE_TTS_CMD = process.env.TTS_CMD || "edge-tts";
const GAP_SEC = Number(process.env.TTS_GAP_SEC || 0.4);
const HOLD_END_SEC = 1.5;

/** Read narration strings from newsContent.json. */
async function readNarrations() {
  const raw = await fs.readFile(NEWS_CONTENT_FILE, "utf-8");
  const content = JSON.parse(raw);
  if (
    typeof content.hookNarration !== "string" ||
    typeof content.closerNarration !== "string" ||
    !Array.isArray(content.stories)
  ) {
    throw new Error(
      "newsContent.json is missing required fields (hookNarration, closerNarration, stories[])"
    );
  }
  const stories = content.stories.map((s) => {
    if (typeof s.narration !== "string") {
      throw new Error(`Story id=${s.id} missing narration string`);
    }
    return s.narration;
  });
  return {
    hook: content.hookNarration,
    stories,
    closer: content.closerNarration,
  };
}

/** Run edge-tts to render one text segment to an mp3 file. */
async function ttsOne(text, outFile) {
  // Write text to a temp file so edge-tts gets it via --file rather than
  // command-line escaping (matters for newlines, quotes, em-dashes).
  const tmpText = outFile + ".txt";
  await fs.writeFile(tmpText, text, "utf-8");
  try {
    // IMPORTANT: --rate must use `--rate=<value>` form. Negative rates start
    // with a dash and edge-tts argparse would otherwise treat them as flags.
    await execFileAsync(
      EDGE_TTS_CMD,
      [
        `--file=${tmpText}`,
        `--voice=${VOICE}`,
        `--rate=${RATE}`,
        `--write-media=${outFile}`,
      ],
      { maxBuffer: 1024 * 1024 * 64 }
    );
  } finally {
    await fs.rm(tmpText, { force: true });
  }
}

/**
 * Probe an audio file's duration in seconds.
 * Prefers ffprobe (clean stdout). Falls back to parsing `ffmpeg -i` stderr
 * because some Windows ffmpeg builds ship without ffprobe.exe.
 */
async function probeDuration(filePath) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const d = parseFloat(stdout.trim());
    if (Number.isFinite(d) && d > 0) return d;
  } catch (err) {
    if (err && err.code !== "ENOENT") throw err;
  }
  return await new Promise((resolve, reject) => {
    let stderr = "";
    const proc = spawn("ffmpeg", ["-hide_banner", "-i", filePath]);
    proc.stderr.on("data", (c) => {
      stderr += c.toString();
    });
    proc.on("error", (e) =>
      reject(
        new Error(
          `Could not run ffmpeg to probe duration: ${e.message}. Install ffmpeg and ensure it's on PATH.`
        )
      )
    );
    proc.on("close", () => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!m) return reject(new Error("Could not parse duration from ffmpeg"));
      resolve(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
    });
  });
}

/** Render a silent mp3 of the given length using ffmpeg. */
async function renderSilence(seconds, outFile) {
  await new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=24000:cl=mono",
      "-t",
      String(seconds),
      "-q:a",
      "9",
      "-acodec",
      "libmp3lame",
      outFile,
    ];
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg silence exit ${code}`))
    );
  });
}

/** Concatenate mp3 files (in the listed order) into one mp3. */
async function concatMp3(filePaths, outFile) {
  // Use the concat demuxer; it requires a list file with `file '<path>'` lines.
  const listBody = filePaths
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(CONCAT_LIST, listBody, "utf-8");
  await new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      CONCAT_LIST,
      "-c",
      "copy",
      outFile,
    ];
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (c) => (stderr += c.toString()));
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`ffmpeg concat exit ${code}\n${stderr}`))
    );
  });
}

async function main() {
  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.rm(SEGMENTS_DIR, { recursive: true, force: true });
  await fs.mkdir(SEGMENTS_DIR, { recursive: true });

  const { hook, stories, closer } = await readNarrations();

  const segmentSpecs = [
    { type: "hook", text: hook, file: "hook.mp3" },
    ...stories.map((text, i) => ({
      type: "story",
      index: i,
      text,
      file: `story-${i}.mp3`,
    })),
    { type: "closer", text: closer, file: "closer.mp3" },
  ];

  // Write the joined script for debugging
  await fs.writeFile(
    NARRATION_TXT,
    segmentSpecs.map((s) => s.text).join("\n\n"),
    "utf-8"
  );

  console.log(
    `[tts] synthesising ${segmentSpecs.length} segments via edge-tts ` +
      `(voice=${VOICE}, rate=${RATE})…`
  );

  // 1) Render each segment to its own mp3 (serial — edge-tts is rate-limited).
  for (const seg of segmentSpecs) {
    const out = path.join(SEGMENTS_DIR, seg.file);
    process.stdout.write(`  [tts]  ${seg.file} … `);
    try {
      await ttsOne(seg.text, out);
    } catch (err) {
      console.error(
        `\n[tts] ERROR: '${EDGE_TTS_CMD}' failed for segment ${seg.file}.` +
          ` Make sure edge-tts is installed:  pip install edge-tts`
      );
      throw err;
    }
    const dur = await probeDuration(out);
    seg.durationSec = dur;
    console.log(`${dur.toFixed(2)}s`);
  }

  // 2) Render a silence file to use between segments
  console.log(`[tts] rendering ${GAP_SEC}s silence pad…`);
  await renderSilence(GAP_SEC, SILENCE_MP3);
  const silenceDur = await probeDuration(SILENCE_MP3);

  // 3) Build concat order (segment, silence, segment, silence, ..., segment)
  const concatFiles = [];
  segmentSpecs.forEach((seg, i) => {
    concatFiles.push(path.join(SEGMENTS_DIR, seg.file));
    if (i < segmentSpecs.length - 1) concatFiles.push(SILENCE_MP3);
  });

  console.log(`[tts] concatenating to ${path.basename(NARRATION_MP3)}…`);
  await concatMp3(concatFiles, NARRATION_MP3);
  const totalDur = await probeDuration(NARRATION_MP3);

  // 4) Build the timing manifest
  let cursor = 0;
  const segments = segmentSpecs.map((seg, i) => {
    const entry = {
      type: seg.type,
      startSec: Number(cursor.toFixed(3)),
      durationSec: Number(seg.durationSec.toFixed(3)),
      text: seg.text,
    };
    if (seg.type === "story") entry.index = seg.index;
    cursor += seg.durationSec;
    if (i < segmentSpecs.length - 1) cursor += silenceDur;
    return entry;
  });

  const manifest = {
    voice: VOICE,
    rate: RATE,
    gapSec: silenceDur,
    holdEndSec: HOLD_END_SEC,
    totalDurationSec: Number(totalDur.toFixed(3)),
    segments,
  };
  await fs.writeFile(NARRATION_META, JSON.stringify(manifest, null, 2));

  console.log(
    `[tts] ✓ ${path.relative(projectRoot, NARRATION_MP3)} ` +
      `(${totalDur.toFixed(2)}s, ${segments.length} segments)`
  );
  console.log(`[tts] ✓ ${path.relative(projectRoot, NARRATION_META)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
