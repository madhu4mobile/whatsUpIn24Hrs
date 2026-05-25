import { stories } from "../../data/newsData";
import { WorldMapMulti } from "../components/WorldMap";

interface CloserSceneProps {
  progress: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function CloserScene({ progress }: CloserSceneProps) {
  const fadeIn = Math.min(progress / 0.1, 1);
  const tagOpacity =
    progress < 0.25 ? 0 : Math.min((progress - 0.25) / 0.15, 1);
  const ctaOpacity =
    progress < 0.55 ? 0 : Math.min((progress - 0.55) / 0.15, 1);
  // Final hold doesn't fade out — we want the closer card to be the last
  // frame the viewer sees.
  const opacity = easeOutCubic(fadeIn);

  // Slow zoom on the globe over the closer's duration
  const zoomScale = 1 + progress * 0.08;

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
      {/* Slowly zooming globe of all story locations */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "center",
          transition: "transform 0.05s linear",
        }}
      >
        <WorldMapMulti markers={markers} width={1080} height={1920} />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,14,26,0.5) 0%, rgba(10,14,26,0.95) 70%, #0a0e1a 100%)",
        }}
      />

      <div className="relative z-10 text-center px-12">
        <div
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-600/20 border-2 border-blue-500/40 text-blue-300 tracking-[0.3em] text-xl font-semibold mb-12"
          style={{ opacity: easeOutCubic(fadeIn) }}
        >
          DAILY GLOBAL PULSE
        </div>
        <h1
          className="text-[96px] font-black text-white leading-[1] mb-4"
          style={{
            fontFamily: "'Playfair Display', serif",
            opacity: tagOpacity,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Stay Informed.
        </h1>
        <h1
          className="text-[96px] font-black leading-[1] mb-12"
          style={{
            fontFamily: "'Playfair Display', serif",
            opacity: tagOpacity,
            color: "#60a5fa",
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Stay Curious.
        </h1>
        <div
          className="mt-8 inline-flex items-center gap-4 text-2xl text-gray-300 font-light"
          style={{ opacity: ctaOpacity }}
        >
          Same time tomorrow • 5:00 AM EST
        </div>
        <div
          className="mt-6 text-gray-500 text-lg"
          style={{ opacity: ctaOpacity }}
        >
          Follow for daily briefings
        </div>
      </div>
    </div>
  );
}
