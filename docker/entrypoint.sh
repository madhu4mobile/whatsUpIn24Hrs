#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# entrypoint.sh — Daily Global Pulse pipeline orchestrator
#
# Runs once per invocation. Designed to be called by:
#   - TrueNAS Cron Job: `docker compose run --rm builder`
#   - Or directly:      `docker run --rm pulse-builder`
#
# Required env:
#   ANTHROPIC_API_KEY   API key for news fetch (omit to fall back to
#                       the last newsContent.json)
#   GIT_REPO_URL        e.g. https://github.com/<you>/whatsUpIn24Hrs.git
#
# Optional env:
#   GIT_BRANCH          default "main"
#   OUTPUT_DIR          default /output     — where MP4s + JPGs are written
#   CONTENT_DIR         default /content    — newsContent.json archive
#   LOGS_DIR            default /logs       — per-run logs
#   REPO_DIR            default /workspace  — git checkout + node_modules cache
#   RETENTION_DAYS      default 30
#   SHOW_NAME           default "Daily Global Pulse"
#   TTS_VOICE / TTS_RATE / VIDEO_FPS  — forwarded to the pipeline
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

GIT_BRANCH="${GIT_BRANCH:-main}"
OUTPUT_DIR="${OUTPUT_DIR:-/output}"
CONTENT_DIR="${CONTENT_DIR:-/content}"
LOGS_DIR="${LOGS_DIR:-/logs}"
REPO_DIR="${REPO_DIR:-/workspace}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
SHOW_NAME="${SHOW_NAME:-Daily Global Pulse}"

# Date stamp uses the timezone the container was launched with
# (Dockerfile sets TZ=America/New_York). This means "today" is always
# the NY-local day, which is what we want for a 5 AM EST cadence.
DATESTAMP=$(date +%Y-%m-%d)
LOG_FILE="$LOGS_DIR/$DATESTAMP.log"

mkdir -p "$LOGS_DIR" "$OUTPUT_DIR" "$CONTENT_DIR" "$REPO_DIR"

# Mirror stdout+stderr to both terminal and the dated log file.
exec > >(tee -a "$LOG_FILE") 2>&1

log() { printf '[%s] %s\n' "$(date -Is)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

log "==================================================================="
log "Daily Global Pulse builder — run for $DATESTAMP"
log "==================================================================="

# ─── 1. Source code: git pull (or clone) ───────────────────────────────
if [[ -z "${GIT_REPO_URL:-}" ]]; then
  die "GIT_REPO_URL is not set. Point it at your GitHub clone of the repo."
fi

cd "$REPO_DIR"
if [[ -d "$REPO_DIR/.git" ]]; then
  log "git fetch / reset to origin/$GIT_BRANCH"
  git fetch --quiet origin "$GIT_BRANCH"
  git reset --hard "origin/$GIT_BRANCH"
  git clean -fd
else
  log "git clone $GIT_REPO_URL (branch=$GIT_BRANCH)"
  # Empty dir might already exist (the volume) — clone into it.
  git clone --branch "$GIT_BRANCH" "$GIT_REPO_URL" .
fi
GIT_SHA=$(git rev-parse --short HEAD)
log "checked out $GIT_SHA"

# ─── 2. Restore last good newsContent.json ─────────────────────────────
# If a previous run produced a newsContent snapshot, restore it so:
#   - if the LLM call fails today, we still ship yesterday's content
#   - the fetch script has prior state for any diffing logic later
if [[ -f "$CONTENT_DIR/latest.json" ]]; then
  log "restoring previous newsContent.json from $CONTENT_DIR/latest.json"
  cp "$CONTENT_DIR/latest.json" "$REPO_DIR/src/data/newsContent.json"
fi

# ─── 3. Dependencies (cached) ──────────────────────────────────────────
log "npm install (cached via /workspace volume)…"
npm install --no-fund --no-audit --silent

# Playwright browsers go to PLAYWRIGHT_BROWSERS_PATH (=/opt/playwright,
# also a mounted volume) so the ~150MB Chromium download persists.
log "ensuring Playwright Chromium is installed…"
npx playwright install chromium

# ─── 4. Run the video pipeline ─────────────────────────────────────────
log "running pipeline: fetch-news → build → tts → render"
npm run video

[[ -f "$REPO_DIR/dist/daily-global-pulse.mp4" ]] || \
  die "pipeline finished but dist/daily-global-pulse.mp4 was not produced"

# ─── 5. Archive output with date+title-stamped filenames ───────────────
# Pull the videoTitle out of the JSON so the filename is human-readable
# AND machine-sortable by date.
TITLE_RAW=$(node -e '
  try {
    const c = JSON.parse(require("fs").readFileSync("src/data/newsContent.json","utf-8"));
    process.stdout.write(c.videoTitle || "Untitled");
  } catch (e) {
    process.stdout.write("Untitled");
  }
')
# Sanitize for filesystem use: ASCII-ish, no slashes/colons.
TITLE_SLUG=$(echo "$TITLE_RAW" \
  | iconv -f utf-8 -t ascii//TRANSLIT 2>/dev/null \
  | tr -cd '[:alnum:][:space:]-_' \
  | tr -s '[:space:]' '-' \
  | sed 's/^-\+//;s/-\+$//' \
  | cut -c1-60)
[[ -z "$TITLE_SLUG" ]] && TITLE_SLUG="Untitled"

SHOW_DIR="$OUTPUT_DIR/$SHOW_NAME"
mkdir -p "$SHOW_DIR"

OUT_BASENAME="$SHOW_NAME - $DATESTAMP - $TITLE_SLUG"
OUT_MP4="$SHOW_DIR/$OUT_BASENAME.mp4"
OUT_JPG="$SHOW_DIR/$OUT_BASENAME.jpg"

log "publishing → $OUT_MP4"
cp "$REPO_DIR/dist/daily-global-pulse.mp4" "$OUT_MP4"

# Generate a poster JPG ~3 seconds into the video (past the hook fade-in)
log "generating thumbnail → $OUT_JPG"
ffmpeg -y -loglevel error -ss 00:00:03 -i "$OUT_MP4" -vframes 1 -q:v 2 "$OUT_JPG" \
  || log "WARN: thumbnail generation failed (non-fatal)"

# Snapshot today's content next to the archive
cp "$REPO_DIR/src/data/newsContent.json" "$CONTENT_DIR/$DATESTAMP.json"
cp "$REPO_DIR/src/data/newsContent.json" "$CONTENT_DIR/latest.json"

# ─── 6. Update the web viewer index ────────────────────────────────────
log "rebuilding viewer index.json"
node "$REPO_DIR/docker/update-index.mjs" \
  --show-dir "$SHOW_DIR" \
  --out "$OUTPUT_DIR/index.json" \
  --show-name "$SHOW_NAME" \
  --content-dir "$CONTENT_DIR"

# ─── 7. Retention prune ────────────────────────────────────────────────
log "pruning files older than $RETENTION_DAYS days in $SHOW_DIR"
find "$SHOW_DIR" -type f \( -name "*.mp4" -o -name "*.jpg" \) \
  -mtime "+$RETENTION_DAYS" -print -delete || true
find "$CONTENT_DIR" -type f -name "????-??-??.json" \
  -mtime "+$RETENTION_DAYS" -print -delete || true
find "$LOGS_DIR" -type f -name "????-??-??.log" \
  -mtime "+$RETENTION_DAYS" -print -delete || true

# Rebuild index AFTER prune so deleted entries vanish from the viewer
node "$REPO_DIR/docker/update-index.mjs" \
  --show-dir "$SHOW_DIR" \
  --out "$OUTPUT_DIR/index.json" \
  --show-name "$SHOW_NAME" \
  --content-dir "$CONTENT_DIR"

log "==================================================================="
log "✓ done for $DATESTAMP — $(basename "$OUT_MP4")"
log "==================================================================="
