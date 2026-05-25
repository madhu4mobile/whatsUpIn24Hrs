import { stories, todayDate, videoTitle } from "../../data/newsData";
import { WorldMapMulti } from "../components/WorldMap";

interface HookSceneProps {
  progress: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function HookScene({ progress }: HookSceneProps) {
  // Title fades in fast and stays. Subtitle pops in halfway through.
  const titleOpacity = Math.min(progress / 0.15, 1);
  const subtitleOpacity =
    progress < 0.3 ? 0 : Math.min((progress - 0.3) / 0.15, 1);
  const dateOpacity =
    progress < 0.45 ? 0 : Math.min((progress - 0.45) / 0.15, 1);
  const fadeOut = Math.max(0, (progress - 0.9) / 0.1);
  const opacity = 1 - fadeOut;

  // Story-region markers reveal staggered across the hook
  const markers = stories.map((s) => ({
    id: s.countryId,
    coords: s.cityCoords,
    highlight: true,
  }));

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a] text-white"
      style={{ opacity, fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background map of all 9 regions */}
      <div className="absolute inset-0 opacity-50">
        <WorldMapMulti markers={markers} width={1080} height={1920} />
      </div>

      {/* Dark vignette so foreground text reads */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,14,26,0.4) 0%, rgba(10,14,26,0.9) 70%, #0a0e1a 100%)",
        }}
      />

      {/* Foreground stack */}
      <div className="relative z-10 text-center px-12">
        <div
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-600/20 border-2 border-blue-500/40 text-blue-300 tracking-[0.3em] text-xl font-semibold mb-10"
          style={{
            opacity: titleOpacity,
            transform: `translateY(${(1 - easeOutCubic(titleOpacity)) * -20}px)`,
          }}
        >
          DAILY GLOBAL PULSE
        </div>
        <h1
          className="text-[88px] font-black text-white leading-[1] mb-6"
          style={{
            fontFamily: "'Playfair Display', serif",
            opacity: subtitleOpacity,
            transform: `translateY(${(1 - easeOutCubic(subtitleOpacity)) * 30}px)`,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          {videoTitle}
        </h1>
        <p
          className="text-3xl text-gray-300 font-light tracking-wide"
          style={{ opacity: dateOpacity }}
        >
          {todayDate}
        </p>
        <div
          className="mt-12 inline-flex items-center gap-4 text-xl text-gray-400"
          style={{ opacity: dateOpacity }}
        >
          <span>📰 9 stories</span>
          <span>•</span>
          <span>🌍 5 continents</span>
          <span>•</span>
          <span>~5 min</span>
        </div>
      </div>

      {/* Bottom pulse indicator */}
      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2"
        style={{ opacity: dateOpacity }}
      >
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-red-400 font-mono text-sm tracking-widest">
          LIVE
        </span>
      </div>
    </div>
  );
}
