import { useState } from "react";
import { ChevronDown, ChevronUp, Mic, Volume2 } from "lucide-react";
import {
  hookNarration,
  closerNarration,
  voiceDirection,
  suggestedMusic,
  stories,
} from "../data/newsData";

export default function NarrationPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const fullScript = [
    { label: "🎬 HOOK (0:00 – 0:08)", text: hookNarration },
    ...stories.map((s, i) => ({
      label: `📰 STORY ${i + 1}: ${s.headline} (${s.timestamp})`,
      text: s.narration,
    })),
    { label: "🎬 CLOSER (6:00 – 6:20)", text: closerNarration },
  ];

  return (
    <section className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-6 py-5 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/20">
            <Mic className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">
              Full Narration Script
            </h3>
            <p className="text-gray-500 text-sm">
              Complete timestamped script for editing
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-6">
          {/* Voice & Music Direction */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-semibold text-sm">
                  Voice Direction
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                {voiceDirection}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400">🎵</span>
                <span className="text-green-400 font-semibold text-sm">
                  Suggested Music
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                {suggestedMusic}
              </p>
            </div>
          </div>

          {/* Full Script */}
          <div className="space-y-4">
            {fullScript.map((segment, i) => (
              <div key={i} className="border-l-2 border-blue-500/30 pl-4">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-wide mb-2">
                  {segment.label}
                </p>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                  "{segment.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
