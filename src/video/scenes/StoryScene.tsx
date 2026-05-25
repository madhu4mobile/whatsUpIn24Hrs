import type { NewsStory } from "../../data/newsData";
import { WorldMap } from "../components/WorldMap";

interface StorySceneProps {
  story: NewsStory;
  /** 0..1 progress through this scene's audio segment. */
  progress: number;
  /** Zero-based story index (0-8). */
  index: number;
  total: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function StoryScene({
  story,
  progress,
  index,
  total,
}: StorySceneProps) {
  // Fade in over first 0.4s of progress (≈10%), hold, fade out over last
  // 0.4s. With ~40s scenes this gives generous reading time.
  const fadeIn = Math.min(progress / 0.08, 1);
  const fadeOut = Math.max(0, (progress - 0.92) / 0.08);
  const opacity = easeOutCubic(fadeIn) * (1 - fadeOut);

  // Headline slides up slightly on entry
  const slideY = (1 - easeOutCubic(fadeIn)) * 40;

  // Key fact pops in at 25% of the scene
  const keyFactOpacity =
    progress < 0.18 ? 0 : Math.min((progress - 0.18) / 0.06, 1);

  return (
    <div
      className="absolute inset-0 flex flex-col bg-[#0a0e1a] text-white"
      style={{ opacity, fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top: category strip, region, story number */}
      <div className="px-16 pt-14">
        <div className="flex items-center justify-between">
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold tracking-[0.2em]"
            style={{
              backgroundColor: story.categoryColor + "26",
              color: story.categoryColor,
              border: `2px solid ${story.categoryColor}80`,
            }}
          >
            {story.category}
          </div>
          <div className="text-gray-500 font-mono text-base tracking-wider">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span style={{ fontSize: 56, lineHeight: 1 }}>{story.regionFlag}</span>
          <div>
            <div className="text-blue-300 text-2xl font-semibold tracking-wide">
              {story.cityName}
            </div>
            <div className="text-gray-500 text-lg">{story.region}</div>
          </div>
        </div>
      </div>

      {/* Middle: map */}
      <div className="flex-1 mx-12 my-6 relative overflow-hidden rounded-2xl border border-gray-800/50">
        {/* Subtle grid overlay so the map doesn't feel sterile */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            zIndex: 1,
          }}
        />
        <WorldMap
          highlightCountryId={story.countryId}
          cityCoords={story.cityCoords}
          width={1080}
          height={800}
          mode="country"
        />
      </div>

      {/* Bottom: headline + key fact + sources */}
      <div
        className="px-16 pb-16"
        style={{ transform: `translateY(${slideY}px)` }}
      >
        <h1
          className="text-white text-[56px] font-black leading-[1.05]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {story.headline}
        </h1>
        <div
          className="mt-6 px-6 py-5 rounded-2xl text-[28px] leading-snug font-medium"
          style={{
            backgroundColor: story.categoryColor + "1f",
            border: `2px solid ${story.categoryColor}80`,
            color: "#fff",
            opacity: keyFactOpacity,
          }}
        >
          <span style={{ color: story.categoryColor }}>⚡ </span>
          {story.keyFact}
        </div>
        <div className="mt-5 text-gray-500 text-base">
          Sources: {story.sources.slice(0, 3).join(" • ")}
          {story.sources.length > 3 ? ` +${story.sources.length - 3} more` : ""}
        </div>
      </div>
    </div>
  );
}
