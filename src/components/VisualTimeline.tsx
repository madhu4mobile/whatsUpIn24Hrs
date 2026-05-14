import { stories } from "../data/newsData";
import { Film, Music, Eye } from "lucide-react";

export default function VisualTimeline() {
  const scenes = [
    {
      time: "0:00 – 0:08",
      label: "HOOK",
      visual:
        "Fast montage: flames in Kut, Ukraine parliament, Trump at podium, Fed building. Bold text: 'DAILY GLOBAL PULSE' with date. Quick-cut transitions with camera shake effect.",
      music: "Dramatic news stinger — builds to logo reveal",
    },
    ...stories.map((s) => ({
      time: s.timestamp,
      label: `STORY ${s.id}: ${s.headline}`,
      visual: s.visualDescription,
      music: s.musicMood,
    })),
    {
      time: "6:00 – 6:20",
      label: "CLOSER",
      visual:
        "Slow zoom out on globe graphic. Text: 'Stay Informed. Stay Curious.' Branding card with social handles. Subscribe/follow CTA animation.",
      music:
        "Warm, reflective piano fading to silence — resolving underscore",
    },
  ];

  return (
    <section className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">
            Visual Instructions (Scene-by-Scene)
          </h2>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Synced to narration • 9:16 vertical format • Mobile-optimized
        </p>
      </div>

      <div className="px-6 py-4 space-y-0">
        {scenes.map((scene, i) => (
          <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline line */}
            {i < scenes.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-800" />
            )}

            {/* Timeline dot */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center z-10 mt-0.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  i === 0 || i === scenes.length - 1
                    ? "bg-blue-500"
                    : "bg-gray-500"
                }`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-blue-400 text-xs font-mono font-bold">
                  {scene.time}
                </span>
                <span className="text-gray-600 text-xs">|</span>
                <span className="text-gray-300 text-xs font-bold uppercase tracking-wide">
                  {scene.label}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Eye className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {scene.visual}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Music className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {scene.music}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
