import { useEffect, useState, useRef } from "react";
import { stories } from "../data/newsData";
import HookScene from "./scenes/HookScene";
import StoryScene from "./scenes/StoryScene";
import CloserScene from "./scenes/CloserScene";

/**
 * Timing manifest produced by tools/generate-tts.mjs.
 * Each segment has a wall-clock start time (relative to the start of the
 * video) and a duration that matches its audio segment.
 */
export interface SegmentTiming {
  type: "hook" | "story" | "closer";
  /** Only set when type === "story" (0-based). */
  index?: number;
  startSec: number;
  durationSec: number;
}

export interface VideoManifest {
  totalDurationSec: number;
  segments: SegmentTiming[];
  /** Extra hold on the final frame, after audio ends. */
  holdEndSec?: number;
}

declare global {
  interface Window {
    __VIDEO_MANIFEST__?: VideoManifest;
  }
}

/**
 * Fallback manifest used when video.html is opened directly in the browser
 * (e.g. for design iteration) without Playwright injecting a real one.
 * Picks plausible per-segment durations so designers can see the flow.
 */
function buildFallbackManifest(): VideoManifest {
  const HOOK_DUR = 8;
  const CLOSER_DUR = 20;
  const STORY_DUR = 40;
  const GAP = 0.5;
  const segments: SegmentTiming[] = [];
  let cursor = 0;
  segments.push({ type: "hook", startSec: cursor, durationSec: HOOK_DUR });
  cursor += HOOK_DUR + GAP;
  stories.forEach((_, i) => {
    segments.push({
      type: "story",
      index: i,
      startSec: cursor,
      durationSec: STORY_DUR,
    });
    cursor += STORY_DUR + GAP;
  });
  segments.push({ type: "closer", startSec: cursor, durationSec: CLOSER_DUR });
  cursor += CLOSER_DUR;
  return { totalDurationSec: cursor, segments, holdEndSec: 1.5 };
}

export default function VideoApp() {
  const manifest: VideoManifest =
    typeof window !== "undefined" && window.__VIDEO_MANIFEST__
      ? window.__VIDEO_MANIFEST__
      : buildFallbackManifest();

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let rafId = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const t = (now - startRef.current) / 1000;
      setElapsed(t);
      const end = manifest.totalDurationSec + (manifest.holdEndSec ?? 1);
      if (t >= end) {
        // Signal completion so Playwright can stop recording.
        document.body.dataset.videoComplete = "true";
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [manifest.totalDurationSec, manifest.holdEndSec]);

  // Find the currently active segment. If we're in a gap between segments,
  // show the *previous* segment's last frame (rather than blanking) so
  // transitions feel less abrupt.
  let active: SegmentTiming | undefined;
  let progress = 0;
  for (let i = 0; i < manifest.segments.length; i++) {
    const s = manifest.segments[i];
    const nextStart =
      i + 1 < manifest.segments.length
        ? manifest.segments[i + 1].startSec
        : s.startSec + s.durationSec + 999;
    if (elapsed >= s.startSec && elapsed < nextStart) {
      active = s;
      // Cap progress at 1 during the gap to hold the exit state.
      progress = Math.min((elapsed - s.startSec) / s.durationSec, 1);
      break;
    }
  }

  if (!active) {
    // Before first segment or after the last — show closer end-frame.
    if (elapsed < manifest.segments[0].startSec) {
      return <div className="absolute inset-0 bg-[#0a0e1a]" />;
    }
    return <CloserScene progress={1} />;
  }

  if (active.type === "hook") {
    return <HookScene progress={progress} />;
  }
  if (active.type === "closer") {
    return <CloserScene progress={progress} />;
  }
  if (active.type === "story" && typeof active.index === "number") {
    const story = stories[active.index];
    if (!story) return <div className="absolute inset-0 bg-[#0a0e1a]" />;
    return (
      <StoryScene
        story={story}
        progress={progress}
        index={active.index}
        total={stories.length}
      />
    );
  }

  return <div className="absolute inset-0 bg-[#0a0e1a]" />;
}
