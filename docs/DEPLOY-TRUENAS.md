# Deploying Daily Global Pulse on TrueNAS Scale Goldeye (25.10+)

This guide walks through running the daily MP4 build on a TrueNAS Scale
home server. By the end you'll have:

- A nightly cron job (5:00 AM America/New_York) that **automatically
  generates `dist/daily-global-pulse.mp4`** with fresh news.
- The MP4 + thumbnail dropped into an SMB-shared dataset so you can
  open it from your **Android Files app**, **Finder**, or **Explorer**.
- A tiny always-on **web viewer** at `http://<nas>:8088/` that lists
  the last 30 days of reels with thumbnails and a built-in player.
- A drop-in folder layout that **Jellyfin / Plex / Emby** can pick up
  as a Movies library.

> Target: TrueNAS Scale Goldeye 25.10.1 (your reported version). The
> instructions below use the new native Docker-based Apps system. They
> may need small adjustments on Dragonfish (k3s-era) — see
> *Differences on older Scale* near the bottom.

---

## Architecture

```
TrueNAS host (Goldeye)
├── /mnt/<pool>/apps/dailypulse/
│   ├── output/        ← MP4s + JPGs + index.json (SMB-shared, Jellyfin-scanned)
│   │   └── Daily Global Pulse/
│   │       ├── Daily Global Pulse - 2026-05-14 - Three-Word-Title.mp4
│   │       ├── Daily Global Pulse - 2026-05-14 - Three-Word-Title.jpg
│   │       └── …last 30 days…
│   ├── content/       ← per-day newsContent.json snapshots
│   ├── logs/          ← per-day pipeline logs
│   ├── workspace/     ← cached git checkout + node_modules
│   └── playwright/    ← cached Chromium binary (~150 MB)
│
└── App "dailypulse" (Custom App, docker-compose backed)
    ├── service: builder   — one-shot, run on demand by cron
    └── service: viewer    — always-on nginx serving the archive UI
```

---

## Step 1 — Create the storage layout

In **Storage → Datasets**, create a child dataset for the pipeline. Any
pool works; the example below uses `tank`.

```
tank/apps/dailypulse                (parent, child datasets below)
tank/apps/dailypulse/output         ← will be SMB-shared
tank/apps/dailypulse/content
tank/apps/dailypulse/logs
tank/apps/dailypulse/workspace
tank/apps/dailypulse/playwright
```

You can create them all under one parent or as separate datasets — both
work. Datasets give you per-folder snapshots; plain directories don't.

**Permissions:** TrueNAS apps run as UID 568 (`apps`) by default in
Goldeye. Make sure the datasets are owned by `apps:apps` (or have group
read/write for `apps`). You can set this from **Datasets → ⋮ → Edit
Permissions** on each child dataset.

---

## Step 2 — Share `output` over SMB

**Shares → Windows (SMB) Shares → Add**

| Field | Value |
|-------|-------|
| Path | `/mnt/tank/apps/dailypulse/output` |
| Name | `dailypulse` |
| Purpose | Default |
| Enabled | ✓ |

Now from your phone you can install any SMB browser app (CX File
Explorer on Android, the built-in Files app on iOS 13+) and point it at
`smb://<nas-ip>/dailypulse`. New MP4s appear here automatically each day.

---

## Step 3 — Get the code into a Git repo

The container clones a Git repo on every run, so you need a public (or
deploy-token-accessible) clone URL.

```bash
# On your PC
cd D:\PlayGround\09_repos\whatsUpIn24Hrs
git remote add origin https://github.com/<you>/whatsUpIn24Hrs.git
git add -A
git commit -m "Initial deploy"
git push -u origin main
```

If you'd rather keep it private, use a [GitHub deploy
token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
and embed it in the URL:
`https://<token>@github.com/<you>/whatsUpIn24Hrs.git`.

---

## Step 4 — Create the TrueNAS Custom App

Goldeye's **Apps → Discover → Custom App** accepts a `docker-compose.yml`
directly. Two options:

### Option A — point it at the repo

When prompted for a config source, paste the **raw GitHub URL** for
`docker-compose.yml`:

```
https://raw.githubusercontent.com/<you>/whatsUpIn24Hrs/main/docker-compose.yml
```

### Option B — paste the compose file inline

Copy the contents of `docker-compose.yml` from this repo into the
TrueNAS Custom App YAML editor. Same effect.

### Environment variables

In the Custom App config UI, set these:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | your `sk-ant-…` key |
| `GIT_REPO_URL` | `https://github.com/<you>/whatsUpIn24Hrs.git` |
| `OUTPUT_PATH` | `/mnt/tank/apps/dailypulse/output` |
| `CONTENT_PATH` | `/mnt/tank/apps/dailypulse/content` |
| `LOGS_PATH` | `/mnt/tank/apps/dailypulse/logs` |
| `WORKSPACE_PATH` | `/mnt/tank/apps/dailypulse/workspace` |
| `PLAYWRIGHT_PATH` | `/mnt/tank/apps/dailypulse/playwright` |

Optional tuning (defaults shown):

| Variable | Default | What it does |
|----------|---------|--------------|
| `GIT_BRANCH` | `main` | Branch to pull |
| `RETENTION_DAYS` | `30` | Auto-prune MP4s/logs/snapshots older than this |
| `SHOW_NAME` | `Daily Global Pulse` | Folder + filename prefix |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5-20251001` | Override to e.g. `claude-sonnet-4-6` |
| `TTS_VOICE` | `en-US-AndrewNeural` | Any edge-tts voice |
| `TTS_RATE` | `-5%` | Speech rate offset |
| `VIDEO_FPS` | `30` | Output frame rate |
| `VIEWER_PORT` | `8088` | Host port the web viewer binds to |
| `BUILDER_CPUS` | `2.0` | CPU ceiling for the builder |
| `BUILDER_MEMORY` | `2g` | RAM ceiling for the builder |

### Build the image on the NAS

The Custom App's `build: { context: . }` directive will tell TrueNAS's
Docker to build the image from the repo. First build takes ~3 minutes
(downloads Node 22, ffmpeg, Playwright system libs, edge-tts). After
that, the image is cached.

Alternative: build on your PC and `docker save` → `scp` → `docker load`
on the NAS. Same end result, slower to iterate.

---

## Step 5 — Verify a manual run

Before scheduling, make sure one run end-to-end works. From the NAS
shell (TrueNAS UI → System → Shell), or SSH:

```bash
cd /<wherever the compose file lives>
docker compose run --rm builder
```

You should see, roughly:

```
[2026-05-14T05:00:01-04:00] Daily Global Pulse builder — run for 2026-05-14
[2026-05-14T05:00:02-04:00] git clone https://github.com/…
[2026-05-14T05:00:05-04:00] npm install (cached via /workspace volume)…
[2026-05-14T05:00:38-04:00] ensuring Playwright Chromium is installed…
[2026-05-14T05:01:12-04:00] running pipeline: fetch-news → build → tts → render
[fetch-news] pulling 12 RSS feeds…
[fetch-news] asking claude-haiku-4-5-20251001 to pick top 9 …
[tts] synthesising 11 segments via edge-tts…
[render] recording — waiting for videoComplete flag…
[render] ✓ dist/daily-global-pulse.mp4 (12.4 MB)
[2026-05-14T05:04:31-04:00] publishing → /output/Daily Global Pulse/Daily Global Pulse - 2026-05-14 - …mp4
[2026-05-14T05:04:32-04:00] ✓ done for 2026-05-14
```

Then check the dataset:

```bash
ls -la /mnt/tank/apps/dailypulse/output/"Daily Global Pulse"/
```

Should show the MP4 + JPG + an `index.json` one level up.

---

## Step 6 — Open the web viewer

The `viewer` service is always running. Browse to:

```
http://<nas-ip>:8088/
```

You'll see a grid of recent reels with poster thumbnails. Click any
card → 9:16 player opens. Works equally well on phone (same Wi-Fi).

---

## Step 7 — Schedule the daily run

**System → Advanced Settings → Cron Jobs → Add**

| Field | Value |
|-------|-------|
| Description | `Daily Global Pulse build` |
| Command | `docker compose -f /<path to>/docker-compose.yml run --rm builder` |
| Run As User | `root` (or a non-root user that can run docker) |
| Schedule | `0 5 * * *` (Custom: `Minute=0  Hour=5  Day=*  Month=*  Day of Week=*`) |
| Timezone | `America/New_York` |
| Hide stdout | unchecked |
| Hide stderr | unchecked |
| Enabled | ✓ |

The cron job will email you stdout/stderr on each run if you've
configured the system mail (System → General → Email). Otherwise check
`/mnt/tank/apps/dailypulse/logs/YYYY-MM-DD.log`.

> **DST note:** Setting Timezone = America/New_York means the cron job
> fires at 5:00 AM **local New York time** year-round — DST is handled
> for you. If your TrueNAS clock is UTC and you'd rather not change
> the cron's timezone, the equivalent UTC schedules are `0 9 * * *`
> (winter, EST = UTC-5) and `0 9 * * *` won't match in summer. Use the
> timezone field; don't try to compensate manually.

---

## Step 8 — Point Jellyfin at the same folder

If you already run Jellyfin (or Plex / Emby) on the NAS:

1. **Dashboard → Libraries → Add Media Library**
2. Type: **Movies** (or **Shows** if you prefer episode-style metadata)
3. Folder: `/mnt/tank/apps/dailypulse/output/Daily Global Pulse`
4. Display name: `Daily Global Pulse`
5. Save. Scan library.

Jellyfin will pick up each `Daily Global Pulse - YYYY-MM-DD - Title.mp4`
as a separate entry. The sidecar JPG is used as the poster
automatically.

If you want strict episode-style numbering, rename the files to match
`Daily Global Pulse - sNNeMMM - Title.mp4`. The container's filenames
are deliberately neutral so you can re-shape to your preferred
convention without it.

---

## Troubleshooting

### `ANTHROPIC_API_KEY must be set` on container start
You didn't set the env var in the Custom App. Apps → dailypulse →
Edit → set the variable, save, restart.

### First run: `git clone` fails
- Verify the repo URL is reachable from the NAS:
  `docker run --rm alpine/git ls-remote ${GIT_REPO_URL}`
- For private repos, embed a deploy token in the URL or use SSH and
  mount your `~/.ssh` into the container (out of scope for this doc).

### First run: `npx playwright install chromium` very slow / fails
Chromium is ~150 MB. First-time download depends on your link speed
and whether GitHub's package mirror is healthy. Subsequent runs reuse
the `playwright` volume, so this only happens once.

### Build runs but produces no MP4
Look at the log file for the day:
```
cat /mnt/tank/apps/dailypulse/logs/$(date +%Y-%m-%d).log
```
The most common cause is `ffmpeg` failing because the Playwright recording
isn't finished. The entrypoint waits for `document.body.dataset.videoComplete`
— if a JS error inside `VideoApp` prevents that, the recording times out.

### Cron didn't fire
Check **System → Audit → Cron Job runs**. Also:
```bash
grep CRON /var/log/syslog
```
Common issues: cron timezone wasn't set; user lacks docker permissions;
the path to `docker-compose.yml` is wrong.

### MP4s on phone won't play over SMB
Some Android SMB apps don't handle range requests well. The web viewer
on port 8088 (HTTP) is more reliable for phone playback — and you can
add it to your home screen for one-tap access.

### Viewer page loads but shows "Couldn't load index.json"
The first build hasn't completed yet, or the `output` volume mount in
the viewer service doesn't match the `OUTPUT_PATH` of the builder.
Confirm both bind-mount the same dataset path.

---

## Differences on older Scale (Dragonfish / Cobia / k3s era)

If you're not on Goldeye 25.10+, the **Apps** system is k3s-based and
doesn't take a raw `docker-compose.yml`. Two paths:

1. **Repackage as a Helm chart** (the TrueCharts community has
   templates). Not recommended unless you already deploy other apps
   this way.
2. **Skip the Apps system entirely.** SSH into the NAS, install
   Docker manually (`apt install docker.io docker-compose-plugin`),
   put the repo in `/mnt/tank/apps/dailypulse/repo`, run
   `docker compose up -d` from there, and schedule the cron the
   same way as Step 7.

Goldeye fixes this story — if you can update, do.

---

## Updating the code

The container `git pull`s every run, so most changes ship by just
pushing to `main`:

```bash
git push origin main
# next 5 AM run will pick it up
```

If you change `Dockerfile` (system deps, base image), rebuild the
image:

```bash
# On the NAS shell
docker compose build builder
```

Or trigger a rebuild from the Custom App UI.

---

## Estimated cost & runtime per day

| Step | Time | Cost |
|------|------|------|
| `git pull` + dependency cache check | ~3 s | $0 |
| RSS pull (12 feeds in parallel) | ~5 s | $0 |
| Claude Haiku 4.5 — pick 9 + write narrations | ~5 s | ~$0.02–0.05 |
| Two Vite builds | ~10 s | $0 |
| edge-tts × 11 segments | ~30 s | $0 |
| Playwright record + ffmpeg mux | ~120 s | $0 |
| **Total** | **~3 min** | **~$0.02–0.05** |

Disk usage with 30-day retention: roughly 300–600 MB for archive +
~250 MB for the workspace + playwright caches.

CPU peak is during Playwright recording (one core saturated for ~2
min). Network egress is tiny (~30 KB to RSS + Claude, a few MB to
Microsoft's TTS endpoint).
