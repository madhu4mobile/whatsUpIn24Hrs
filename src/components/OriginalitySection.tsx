import { useState } from "react";
import {
  Shield,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { stories, originalityStatement } from "../data/newsData";

export default function OriginalitySection() {
  const [isOpen, setIsOpen] = useState(false);

  // Get unique sources from all stories
  const allSources = stories.flatMap((s) => s.sources);
  const uniqueSources = [...new Set(allSources)];

  // Group sources by type
  const wireServices = uniqueSources.filter((s) =>
    ["Associated Press", "Reuters", "UPI"].includes(s)
  );
  const majorOutlets = uniqueSources.filter((s) =>
    [
      "The New York Times",
      "The Washington Post",
      "The Guardian",
      "BBC News",
      "NPR",
      "CBS News",
    ].includes(s)
  );
  const regionalOutlets = uniqueSources.filter((s) =>
    [
      "Al Jazeera",
      "Al-Monitor",
      "Al Arabiya",
      "Middle East Eye",
      "El País",
      "Euronews",
      "Times of Israel",
      "The Hindu",
      "Livemint",
      "The National",
      "Washington Times",
      "The Spokesman-Review",
      "Vatican News",
      "Democracy Now",
      "Bloomberg",
    ].includes(s)
  );
  const officialSources = uniqueSources.filter(
    (s) =>
      s.includes("Statement") ||
      s.includes("Ministry") ||
      s.includes("Official") ||
      s.includes("Government") ||
      s.includes("Record") ||
      s.includes("Media")
  );

  return (
    <section className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-800/30 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-6 py-5 hover:bg-emerald-900/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-500/30">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              100% Original Content
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-gray-400 text-sm">
              No plagiarism • All sources cited • AI-synthesized narration
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
          {/* Originality Guarantee */}
          <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-800">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-400 font-semibold text-sm mb-2">
                  Originality Guarantee
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {originalityStatement}
                </p>
              </div>
            </div>
          </div>

          {/* Source Attribution */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Source Attribution ({uniqueSources.length} sources verified)
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Wire Services */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wide mb-2">
                  Wire Services
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {wireServices.map((source) => (
                    <span
                      key={source}
                      className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800/30"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>

              {/* Major Outlets */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <h4 className="text-purple-400 text-xs font-bold uppercase tracking-wide mb-2">
                  Major Outlets
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {majorOutlets.map((source) => (
                    <span
                      key={source}
                      className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-800/30"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>

              {/* Regional & Specialist */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <h4 className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-2">
                  Regional & Specialist
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {regionalOutlets.map((source) => (
                    <span
                      key={source}
                      className="text-xs bg-amber-900/30 text-amber-300 px-2 py-1 rounded border border-amber-800/30"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>

              {/* Official Sources */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <h4 className="text-green-400 text-xs font-bold uppercase tracking-wide mb-2">
                  Official Sources
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {officialSources.map((source) => (
                    <span
                      key={source}
                      className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded border border-green-800/30"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Per-Story Sources */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Sources by Story
            </h3>
            <div className="space-y-3">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-gray-800/30 rounded-lg px-4 py-3 border border-gray-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-500 text-xs font-mono">
                        #{story.id}
                      </span>
                      <span className="text-gray-300 text-sm truncate">
                        {story.regionFlag} {story.headline}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {story.sources.map((source) => (
                      <span
                        key={source}
                        className="text-[10px] bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-700/50">
            <p className="text-gray-500 text-xs leading-relaxed">
              <strong className="text-gray-400">Disclaimer:</strong> Daily
              Global Pulse is an AI-curated news briefing service. All content
              is original, synthesized from publicly reported facts. We do not
              reproduce copyrighted material. Facts are attributed to their
              original reporting sources. This service is intended for
              informational purposes and does not constitute journalism or
              replace primary source reporting.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
