# syntax=docker/dockerfile:1.6
#
# Builder image for the Daily Global Pulse pipeline.
#
# The container runs once per day (triggered by TrueNAS cron). It:
#   1. git pulls the project source into /workspace
#   2. npm install (cached via the workspace volume)
#   3. npx playwright install chromium (cached via /opt/playwright volume)
#   4. runs the full video pipeline (fetch-news → build → tts → render)
#   5. stamps the output, generates a thumbnail, updates the viewer index,
#      and prunes anything older than RETENTION_DAYS.
#
# Image size: ~600 MB. With persistent volumes for node_modules and
# playwright browsers, each subsequent run is fast (no re-downloads).

FROM node:22-bookworm-slim

# ─── System packages ────────────────────────────────────────────────────
# Run as one apt-get block so the layer is small and we don't ship stale
# package lists.
RUN apt-get update && apt-get install -y --no-install-recommends \
        # Core utilities
        ca-certificates \
        curl \
        git \
        # Audio/video
        ffmpeg \
        # Python for edge-tts
        python3 \
        python3-venv \
        python3-pip \
        # Playwright Chromium runtime deps. Without these, headless
        # Chromium fails to start on a slim Debian base.
        libnss3 \
        libnspr4 \
        libdbus-1-3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libpango-1.0-0 \
        libcairo2 \
        libasound2 \
        # Fonts so emoji flags + Inter/Playfair fall back nicely. The
        # Google Fonts CSS @import in video.html does NOT work inside
        # the container (no network at render time depending on policy),
        # but local fallbacks keep the text from going invisible.
        fonts-liberation \
        fonts-noto \
        fonts-noto-color-emoji \
        fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# ─── edge-tts in an isolated venv (PEP 668) ─────────────────────────────
RUN python3 -m venv /opt/edge-tts \
    && /opt/edge-tts/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/edge-tts/bin/pip install --no-cache-dir edge-tts \
    && ln -sf /opt/edge-tts/bin/edge-tts /usr/local/bin/edge-tts

# ─── Workspace + Playwright cache ───────────────────────────────────────
# These are mountable so the heavy bits persist across runs.
WORKDIR /workspace
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NODE_ENV=production \
    TZ=America/New_York

# ─── Entrypoint ─────────────────────────────────────────────────────────
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Mount points the entrypoint will write to. Declared so callers (or
# docker-compose) get a hint about what volumes are expected.
VOLUME ["/workspace", "/opt/playwright", "/output", "/content", "/logs"]

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
