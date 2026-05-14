import { useState } from "react";
import {
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Music,
  Camera,
} from "lucide-react";
import type { NewsStory } from "../data/newsData";

interface StoryCardProps {
  story: NewsStory;
  index: number;
  isActive: boolean;
}

export default function StoryCard({ story, index, isActive }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showVisuals, setShowVisuals] = useState(false);

  return (
    <article
      className={`relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden transition-all duration-500 ${
        isActive ? "ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10" : ""
      }`}
    >
      {/* Category & Number Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-400 font-bold text-sm border border-gray-700">
            {index + 1}
          </span>
          <span
            className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: story.categoryColor + "20",
              color: story.categoryColor,
            }}
          >
            {story.category}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <MapPin className="w-3 h-3" />
          <span>
            {story.regionFlag} {story.region}
          </span>
        </div>
      </div>

      {/* Headline */}
      <div className="px-5 pb-3">
        <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
          {story.headline}
        </h3>
      </div>

      {/* Key Fact Banner */}
      <div className="mx-5 mb-3 bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-800/30 rounded-lg px-4 py-2.5">
        <p className="text-blue-300 text-sm font-medium">
          ⚡ {story.keyFact}
        </p>
      </div>

      {/* Summary */}
      <div className="px-5 pb-3">
        <p className="text-gray-400 text-sm leading-relaxed">
          {story.summary}
        </p>
      </div>

      {/* Timestamp */}
      <div className="px-5 pb-3 flex items-center gap-1.5 text-gray-600 text-xs">
        <Clock className="w-3 h-3" />
        <span>{story.timestamp}</span>
      </div>

      {/* Expand Narration */}
      <div className="border-t border-gray-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full px-5 py-3 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            🎤 <span className="font-medium">Narration Script</span>
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {expanded && (
          <div className="px-5 pb-4">
            <blockquote className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-blue-500/50 pl-4">
              "{story.narration}"
            </blockquote>
          </div>
        )}
      </div>

      {/* Visual Instructions */}
      <div className="border-t border-gray-800">
        <button
          onClick={() => setShowVisuals(!showVisuals)}
          className="flex items-center justify-between w-full px-5 py-3 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span className="font-medium">Visual & Music Direction</span>
          </span>
          {showVisuals ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {showVisuals && (
          <div className="px-5 pb-4 space-y-3">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-400 text-xs leading-relaxed">
                {story.visualDescription}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Music className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-400 text-xs leading-relaxed">
                {story.musicMood}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sources */}
      <div className="border-t border-gray-800 px-5 py-3">
        <p className="text-gray-600 text-xs mb-1.5">Sources:</p>
        <div className="flex flex-wrap gap-1">
          {story.sources.map((source) => (
            <span
              key={source}
              className="text-[10px] bg-gray-800/80 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700/50"
            >
              {source}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
