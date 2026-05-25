# Daily Global Pulse — `whatsUpIn24Hrs`

A 9:16 vertical daily-news-briefing pipeline that produces a narrated,
scene-based **MP4** ready for upload to YouTube Shorts / Instagram Reels /
Facebook Reels / TikTok / X.

The pipeline is end-to-end local:

```
RSS feeds (last 24h)  →  Claude API rewrites top 9 stories
        →  edge-tts narrates each segment
        →  React scene player draws maps + headlines + animations
        →  Playwright records page  →  ffmpeg muxes audio
        →  dist/daily-global-pulse.mp4
```

There's also a companion React **browser app** (`index.html`) that shows
the same news edition as a scrollable page for desktop/mobile viewing.

> **Status: preview.** The on-page "Auto-publish" panels are clearly
> marked as preview — the actual upload step is not yet wired up. Build
> the MP4 locally, review it on your phone, then plan upload separately.

---

## TL;DR — quick start

```bash
# one-time
npm install
npx playwright install chromium
pip install edge-tts
winget install Gyan.FFmpeg          # Windows only, reopen terminal after

# set your API key once per shell (see "Setting the Anthropic API key" below)
$env:ANTHROPIC_API_KEY = "sk-ant-…" # PowerShell

# every time you want a fresh daily MP4
npm run video                        # ≈3 min — produces dist/daily-global-pulse.mp4
npm run preview                      # serves dist/ on LAN

# then on your Android (same Wi-Fi): http://<your-pc-ip>:4173/preview.html
```

---

## How the pipeline is structured

There are two Vite HTML entries plus four tool scripts:

| File | Role |
|------|------|
| `index.html` → `dist/index.html` | Browser-facing news page (scrollable, the dashboard you see in dev) |
| `video.html` → `dist/video.html` | Render-only scene player — full-screen 1080×1920 stage, NOT meant for humans to visit directly. Playwright loads this. |
| `tools/fetch-news.mjs` | Pulls RSS, asks Claude to pick top 9 + write narrations |
| `tools/build.mjs` | Two-pass Vite build (`vite-plugin-singlefile` requires single input per pass, so we build `index.html` and `video.html` separately) |
| `tools/generate-tts.mjs` | Renders 11 narration MP3s (hook + 9 stories + closer) via edge-tts, concatenates them, writes a timing manifest |
| `tools/render-video.mjs` | Headless Chromium records `dist/video.html` synced to the manifest, ffmpeg muxes the narration in |

The **scene player** walks through:

```
HOOK (8s)  — montage of all 9 regions + brand title card
  → STORY 1 (~40s) — map with country highlighted + pulsing city marker +
                     headline + key-fact callout + sources
  → STORY 2
  → …
  → STORY 9
  → CLOSER (~20s) — slow zoom on a global map with all 9 markers + outro
```

Each scene's duration matches its actual narration audio duration. Timing
is driven by the manifest the TTS step emits.

---

## Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Node.js | 20 or 22 LTS | Vite + the `tools/` scripts |
| Python 3 | 3.9+ | Hosts `edge-tts` |
| `edge-tts` | latest | Free Microsoft Edge voice synthesis (`pip install edge-tts`) |
| `ffmpeg` | recent | Audio concat + final MP4 mux. `ffprobe` preferred; the scripts fall back to `ffmpeg -i` parsing when ffprobe is missing |
| Playwright Chromium | installed via npm | Headless browser used by `tools/render-video.mjs` |
| Anthropic API key | n/a | Daily news fetch + narration rewrite. **Optional** — pipeline can run with a frozen `newsContent.json` if absent |

Quick check (in one terminal session, after a fresh login so PATH is current):

```bash
node --version
python --version
edge-tts --list-voices | head -5
ffmpeg -version | head -1
```

If you're on Windows and `ffmpeg` isn't recognised:

```powershell
winget install Gyan.FFmpeg
```

Then **close and reopen the terminal** so PATH refreshes.

---

## Install

```bash
npm install
npx playwright install chromium
pip install edge-tts
```

If `npm install` complains about lockfile mismatches (the lockfile can
drift after dep changes), delete it and reinstall:

```bash
# PowerShell:
del package-lock.json
npm install

# macOS / Linux:
rm package-lock.json
npm install
```

### Setting the Anthropic API key (for live news)

Sign up at <https://console.anthropic.com/> and create a key. Then set it
in your shell **before** running `npm run video`:

```bash
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-…"

# Windows cmd
set ANTHROPIC_API_KEY=sk-ant-…

# macOS / Linux
export ANTHROPIC_API_KEY=sk-ant-…
```

A run costs ≈ **$0.02–0.05** with `claude-haiku-4-5-20251001` (the
default model).

If the key isn't set, `npm run fetch-news` prints a warning and exits 0,
so the rest of the pipeline runs using whatever's already in
`src/data/newsContent.json`. Useful for testing the video pipeline
offline.

To skip fetching explicitly: `SKIP_NEWS_FETCH=1 npm run video`.

---

## The daily pipeline

`npm run video` is the one-shot. It runs four steps; you can also run
each one individually for debugging:

```bash
npm run fetch-news   # 1. RSS + Claude → src/data/newsContent.json
npm run build        # 2. dist/index.html + dist/video.html
npm run tts          # 3. per-segment mp3s + dist/narration.mp3 + dist/narration.json
npm run render       # 4. dist/daily-global-pulse.mp4
```

Final output: **`dist/daily-global-pulse.mp4`** at 1080×1920, H.264 +
AAC, faststart-flagged.

### What each step does

**1. fetch-news (≈10–20s)**
- Pulls RSS from 12 outlets — Reuters World/Top, AP World/Top, BBC
  World/Top, Al Jazeera, NYT, The Guardian, DW, France24, NPR.
- Filters to items published in the last 24 hours.
- Dedupes near-identical headlines across outlets.
- Sends up to 80 candidate items to Claude with a structured prompt that
  enforces: 9 stories, diversified regions, **original** narrations
  (explicitly "do not copy phrases from input"), ISO numeric country
  codes, `[longitude, latitude]` for the map.
- Validates the JSON shape, retries up to 2× on parse failure.
- Writes `src/data/newsContent.json`.

**2. build (≈10s)**
- Two passes of `vite build`. First produces `dist/index.html` (browser
  app), second produces `dist/video.html` (render-only scene player).
  Both are single-file bundles (Vite plugin: `vite-plugin-singlefile`).

**3. tts (≈30–90s)**
- Renders 11 narration MP3s into `dist/segments/` via edge-tts (one per
  scene), with the rate set to `-5%` (slightly slower than default for a
  calm anchor cadence).
- Probes each MP3's duration.
- Renders a brief silence pad (0.4s) and concatenates all segments + pads
  via ffmpeg's concat demuxer → `dist/narration.mp3`.
- Writes `dist/narration.json` with per-segment timing.

**4. render (≈60–180s)**
- Playwright launches headless Chromium at 1080×1920.
- Injects the manifest as `window.__VIDEO_MANIFEST__`.
- Loads `dist/video.html`. `VideoApp.tsx` reads the manifest, runs a
  rAF timer, and advances scenes at the right offsets.
- When `VideoApp` finishes it sets `document.body.dataset.videoComplete
  = "true"`. Playwright waits for that, then closes the recording.
- ffmpeg muxes the recorded webm + `narration.mp3` into the final MP4.

---

## Viewing the MP4 on your phone (or any device on the same Wi-Fi)

After `npm run video` finishes, start the LAN preview server:

```bash
npm run preview
```

Vite prints:

```
➜  Local:   http://localhost:4173/
➜  Network: http://192.168.x.x:4173/
```

On your **Android Chrome** (or any phone on the same Wi-Fi), open:

```
http://192.168.x.x:4173/preview.html
```

You'll get a phone-shaped 9:16 video player with controls. Tap to play.
The video includes audio because it's the actual rendered MP4.

There's also a **Download MP4** button on that page if you want to save
the file locally to your phone gallery, plus a link to the browser app
(`index.html`).

If Windows Firewall prompts the first time, click **Allow access** for
Private (and Public if your home Wi-Fi shows as Public).

If the URL doesn't load, check:
- The PC IP shown by `ipconfig` matches the Network URL Vite printed.
- Phone and PC are on the same Wi-Fi SSID (not a guest network).
- Router doesn't have AP/client isolation turned on.

---

## Iterating on the look (no full render needed)

Re-rendering the MP4 every time you tweak a colour or layout would be
painful. The dev server + `/video.html` route gives you a fast loop:

```bash
npm run dev
```

Then open in your browser:

```
http://localhost:5173/         ← browser app (index.html)
http://localhost:5173/video.html  ← the scene player, with placeholder timings
```

The scene player in dev mode uses a fallback manifest (≈8s hook + 9 × 40s
stories + 20s closer), so you see the flow immediately without
waiting on TTS.

> Dev-mode `/video.html` has **no audio** — the narration MP3 only exists
> after `npm run tts`. This is deliberate; the audio is muxed by ffmpeg
> in the render step, not played by the page.

The dev server also binds to LAN (per `vite.config.ts: server.host: true`),
so phones on the same Wi-Fi can hit `http://<pc-ip>:5173/video.html` to
preview the visuals on a real phone screen.

---

## Hand-editing the news content

The typical flow is *don't* — `npm run fetch-news` overwrites
`src/data/newsContent.json` each run. But if you want to lock content
(e.g. to render the same edition repeatedly while testing), edit
`src/data/newsContent.json` directly:

```json
{
  "todayDate": "May 14, 2026",
  "videoTitle": "Three-word evocative title",
  "videoSubtitle": "Your Daily Global Pulse in 5 Minutes",
  "hookNarration": "…45–55 word teaser. Ends with 'This is your Daily Global Pulse.'",
  "closerNarration": "…70–85 word wrap-up. Ends with 'I'm your Daily Global Pulse.'",
  "socialDescription": "🌍 May 14, 2026 — one-line caption…",
  "hashtags": ["#DailyGlobalPulse", "#WorldNews", "…"],
  "stories": [
    {
      "id": 1,
      "headline": "8–12 word original headline",
      "summary": "Factual summary 2–3 sentences.",
      "region": "Middle East | Europe | North America | Asia-Pacific | Africa | South America | Global",
      "regionFlag": "🇮🇶",
      "category": "DISASTER | CONFLICT | POLITICS | ECONOMY | DIPLOMACY | TRADE | POLICY | TECH | CULTURE",
      "categoryColor": "#ef4444",
      "keyFact": "one-line punchy stat",
      "narration": "60–80 word original narration, spell out numbers.",
      "timestamp": "0:08 – 0:50",
      "visualDescription": "scene direction",
      "musicMood": "tone description",
      "sources": ["AP", "Reuters", "…"],
      "countryId": "368",
      "cityName": "Kut, Iraq",
      "cityCoords": [45.82, 32.51]
    }
    // …8 more, exactly 9 total
  ]
}
```

Then render without re-fetching:

```bash
# PowerShell
$env:SKIP_NEWS_FETCH = "1"; npm run video

# cmd
set SKIP_NEWS_FETCH=1 && npm run video

# macOS / Linux
SKIP_NEWS_FETCH=1 npm run video
```

### Finding country numeric codes

ISO 3166-1 numeric codes: <https://en.wikipedia.org/wiki/ISO_3166-1_numeric>.
Examples: `"368"` = Iraq, `"840"` = USA, `"804"` = Ukraine, `"276"` =
Germany. The renderer uses `world-atlas/countries-110m` (Natural Earth's
110m simplified outlines). A few small territories (Vatican, Palestine
at this resolution) may not be present — the map then falls back to a
world view centred on the city with the marker still showing.

### Coordinate order

`cityCoords` is **`[longitude, latitude]`** — d3-geo's order. NOT lat-lng.
Example: New York is `[-74.00, 40.71]`, not `[40.71, -74.00]`.

---

## Environment variables reference

### fetch-news

| Var | Default | Notes |
|-----|---------|-------|
| `ANTHROPIC_API_KEY` | (none) | Required for live news. If absent, fetch is skipped. |
| `ANTHROPIC_MODEL`   | `claude-haiku-4-5-20251001` | Override to a different Claude model. |
| `SKIP_NEWS_FETCH`   | unset | `1` skips the fetch step entirely. |

### tts

| Var | Default | Notes |
|-----|---------|-------|
| `TTS_VOICE` | `en-US-AndrewNeural` | Any [edge-tts voice](https://github.com/rany2/edge-tts) — try `en-US-AriaNeural`, `en-GB-RyanNeural`. |
| `TTS_RATE`  | `-5%` | Speech-rate offset, e.g. `+0%`, `-10%`. |
| `TTS_CMD`   | `edge-tts` | Override if the binary lives elsewhere. |
| `TTS_GAP_SEC` | `0.4` | Silence inserted between segments. |

### render

| Var | Default | Notes |
|-----|---------|-------|
| `VIDEO_FPS` | `30` | Output frame rate. |
| `VIDEO_OUT` | `dist/daily-global-pulse.mp4` | Override output path. |
| `VIDEO_KEEP_WEBM` | unset | `1` keeps the raw Playwright webm in `dist/video-raw/` for debugging. |

---

## Project layout

```
.
├── index.html              # Vite entry — browser app
├── video.html              # Vite entry — render-only scene player
├── package.json
├── vite.config.ts          # BUILD_TARGET-driven config (one HTML entry per pass)
├── public/
│   └── preview.html        # Phone-viewable MP4 player, served by `npm run preview`
├── src/
│   ├── App.tsx             # Browser app root
│   ├── main.tsx            # Browser app entrypoint
│   ├── index.css
│   ├── components/         # HeroSection, StoryCard, AutomationPanel, etc.
│   ├── data/
│   │   ├── newsData.ts     # Static interfaces, schedule functions, brand config
│   │   └── newsContent.json # DAILY CONTENT — overwritten by fetch-news
│   ├── utils/cn.ts
│   └── video/              # Render-only React tree (loaded by video.html)
│       ├── main.tsx        # video.html entrypoint
│       ├── VideoApp.tsx    # Scene orchestrator + manifest-driven rAF timer
│       ├── components/
│       │   └── WorldMap.tsx  # d3-geo + topojson + world-atlas → SVG maps
│       └── scenes/
│           ├── HookScene.tsx
│           ├── StoryScene.tsx
│           └── CloserScene.tsx
└── tools/
    ├── fetch-news.mjs      # RSS + Claude → newsContent.json
    ├── build.mjs           # Two-pass Vite build (app + video entries)
    ├── generate-tts.mjs    # newsContent.json → per-segment mp3s + manifest
    └── render-video.mjs    # dist/video.html + narration → dist/daily-global-pulse.mp4
```

---

## Architecture deep-dive

### Why two-pass build

`vite-plugin-singlefile` inlines all JS/CSS/assets into each HTML output
to make them loadable via `file://`. To do that, it forces
`output.inlineDynamicImports = true`. Rollup rejects that when there's
more than one Rollup input — so we can't put `index.html` and
`video.html` in the same `rollupOptions.input`. `tools/build.mjs` calls
`vite build` twice with `BUILD_TARGET=app` then `BUILD_TARGET=video`,
each pass producing a single self-contained HTML.

### The timing manifest

`generate-tts.mjs` writes `dist/narration.json` like:

```json
{
  "voice": "en-US-AndrewNeural",
  "rate": "-5%",
  "gapSec": 0.4,
  "holdEndSec": 1.5,
  "totalDurationSec": 287.4,
  "segments": [
    { "type": "hook",   "startSec": 0,    "durationSec": 8.1,  "text": "…" },
    { "type": "story",  "index": 0, "startSec": 8.5, "durationSec": 39.2, "text": "…" },
    …
    { "type": "closer", "startSec": 268.9, "durationSec": 18.5, "text": "…" }
  ]
}
```

### The handshake with Playwright

`tools/render-video.mjs`:

1. Launches Chromium at 1080×1920 with audio/timer-throttling disabled.
2. Injects the manifest before page scripts run, via
   `context.addInitScript({ content: "window.__VIDEO_MANIFEST__ = {...}" })`.
3. Loads `file:///…/dist/video.html`.
4. `VideoApp` mounts, reads `window.__VIDEO_MANIFEST__`, runs a
   `requestAnimationFrame` loop, and renders the right scene per
   elapsed time.
5. When elapsed ≥ totalDurationSec + holdEndSec, `VideoApp` sets
   `document.body.dataset.videoComplete = "true"`.
6. Playwright was polling for that attribute via `page.waitForFunction`;
   sees it, closes the recording context.
7. ffmpeg muxes the webm + `narration.mp3` → final MP4 with H.264 +
   AAC, +faststart for streaming.

### Map rendering

`src/video/components/WorldMap.tsx` uses `d3-geo` + `topojson-client` +
the pre-bundled `world-atlas/countries-110m.json` (~100 KB, inlined into
the bundle at build time).

For each story:
- Finds the country feature whose `id` matches `countryId`.
- Uses `geoMercator().fitExtent([[pad, pad], [W-pad, H-pad]], feature)`
  to auto-zoom to that country.
- Draws all other countries in `#1e293b`; the highlighted country in
  `#1e3a8a` with a `#60a5fa` stroke + a blurred glow underlay.
- Draws an animated pulsing dot at the projected city coordinates.

The Hook and Closer scenes use a multi-marker variant
(`WorldMapMulti`) with `geoNaturalEarth1` for a full-world overview.

---

## Troubleshooting

### `Build failed: Invalid value for option "output.inlineDynamicImports"`
You're running `vite build` directly with multiple inputs. Use
`npm run build` (which calls `tools/build.mjs` — the two-pass builder).

### `[tts] ERROR: 'edge-tts' failed`
- Install: `pip install edge-tts`
- Verify on PATH: `edge-tts --list-voices | head -5`
- If you renamed it: `set TTS_CMD=path\to\edge-tts`

### `Error: spawn ffmpeg ENOENT` / `Error: spawn ffprobe ENOENT`
You need ffmpeg + (preferably) ffprobe on PATH.

- Windows: `winget install Gyan.FFmpeg`, then reopen terminal
- macOS: `brew install ffmpeg`
- Linux: `apt install ffmpeg` (or your distro's equivalent)

The TTS script will fall back to `ffmpeg -i` parsing if ffprobe is
missing — but the render step still requires ffmpeg for muxing.

### `edge-tts: error: argument --rate: expected one argument`
Already fixed in `tools/generate-tts.mjs` by using `--rate=<val>` form
(rather than `--rate <val>`) because argparse misreads negative percents
like `-5%` as a flag. If you've patched it differently, this is the
gotcha.

### `npm install` fails with lockfile errors
Delete the lockfile and reinstall:
- Windows: `del package-lock.json && npm install`
- Others: `rm package-lock.json && npm install`

### Phone can't reach `http://192.168.x.x:5173/` or `:4173/`
- Phone and PC must be on the **same Wi-Fi SSID**.
- Allow Windows Defender Firewall when prompted (Node.exe inbound).
- Check router settings for **AP/Client Isolation** — disable it.
- Verify IP with `ipconfig` (IPv4 Address under your Wi-Fi adapter)
  matches what Vite printed.

### `[fetch-news] No news items found in the last 24h from any feed`
All RSS endpoints failed. Causes:
- No internet connectivity on the PC.
- Reuters/AP have migrated their feed URLs (it's happened before). Pop
  open `tools/fetch-news.mjs` and update the URLs in `FEEDS` — the
  script will keep working as long as a few feeds respond.

### Claude returns invalid JSON
The script retries twice automatically. If it still fails, the prompt in
`tools/fetch-news.mjs` is the place to adjust — add or tighten
constraints, or try `ANTHROPIC_MODEL=claude-sonnet-4-6` for stronger
JSON adherence (more expensive per run).

### `/video.html` plays but no audio
Expected. The dev preview is silent because the narration audio is
generated by the TTS pipeline (which writes `dist/narration.mp3`) and
only gets attached to the final MP4 during ffmpeg muxing. To verify the
finished thing with audio, use `npm run video` then open
`/preview.html` via `npm run preview`.

---

## Bugs fixed historically (changelog)

These are the meaningful fixes since the project's first commit:

- **`lucide-react`** was pinned to the abandoned v1.x line, which doesn't
  contain most of the icons the code imports (`Shield`, `Newspaper`,
  `Zap`, `Camera`, etc.). Bumped to `^0.469.0`.
- **Hero image 404.** `HeroSection` referenced `/images/hero-globe.jpg`
  which didn't exist. Replaced with an inline animated SVG globe.
- **Broken EST countdown.** `AutomationPanel`'s `getHoursUntilNextUpdate`
  used `new Date(date.toLocaleString("…", { timeZone: "America/New_York" }))`,
  which silently mis-interprets the formatted string in the caller's
  local timezone (off by hours on any non-EST device). Rewritten against
  `Intl.DateTimeFormat` operating in seconds-since-NY-midnight.
- **Scroll tracker stuck on stale story.** `App.tsx`'s scroll handler set
  `activeStory` to the last match in iteration order and never reset
  when no story was in viewport. Rewritten to pick the topmost match
  and clear to `-1` when nothing matches.
- **Misleading "Published" badges.** `AutomationPanel`/`SocialSection`
  hardcoded "Published 5:02 AM EST" on YouTube/IG/etc. before any
  upload pipeline existed. Replaced with `previewMode` flag in
  `newsContent.json` driving amber "Preview" labels everywhere.
- **Stale "next update" date.** The displayed date was the hardcoded
  string "July 18, 2025". Now computed live via `getNextUpdateString`,
  which returns the next 5 AM EST regardless of when the page was loaded.
- **edge-tts negative rate parsed as flag.** Switched the script to use
  `--rate=<val>` form so `-5%` is read as a value, not a new flag.
- **`ffprobe` missing on some Windows ffmpeg builds.** TTS script now
  falls back to parsing `ffmpeg -i` stderr when ffprobe isn't on PATH.

---

## Deploying to a home server (TrueNAS Scale)

For automated daily rendering on a NAS, see
[`docs/DEPLOY-TRUENAS.md`](docs/DEPLOY-TRUENAS.md). It covers building
the Docker image, configuring the Custom App in Goldeye 25.10+,
scheduling the 5:00 AM EST cron, SMB sharing the output dataset, and
optional Jellyfin integration.

TL;DR — `Dockerfile`, `docker-compose.yml`, and the
`docker/entrypoint.sh` orchestrator are all in the repo. The container
git-pulls this repo at the start of every run, so deployment updates
are just `git push origin main`.

---

## Not yet built (deliberately deferred)

- **Upload connectors** for YouTube Shorts, Instagram, Facebook, X,
  TikTok. Each platform's Graph / OAuth flow is separate work. Recommend
  starting with YouTube Shorts — most permissive API.
- **Daily scheduler.** Once upload works, a cron job (Windows Task
  Scheduler, GitHub Actions, or a cloud cron) can run `npm run video`
  + the uploader at 5:00 AM EST.
- **Stock photos / video clips** per story. Currently maps-only. Could
  add via Pexels' free API (needs a free API key) for richer backdrops.
- **Background music beds.** The `musicMood` field on each story exists
  but isn't used yet. Would need royalty-free tracks and a per-segment
  ffmpeg mix.
- **Per-segment camera animation** on maps. Right now each story scene
  is statically zoomed to fit the country. Adding a pan/zoom keyframe
  per scene would feel more cinematic.

Flip `previewMode` in `src/data/newsData.ts` to `false` only after
the upload connectors exist — the on-page badges depend on it.
