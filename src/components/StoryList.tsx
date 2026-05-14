import { stories } from "../data/newsData";

export default function StoryList() {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
        📋 Story List (Quick Reference)
      </h3>
      <div className="space-y-2.5">
        {stories.map((story, i) => (
          <div
            key={story.id}
            className="flex items-start gap-3 text-sm group"
          >
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-gray-500 font-bold text-xs border border-gray-700 group-hover:bg-blue-600/20 group-hover:text-blue-400 group-hover:border-blue-600/30 transition-colors">
              {i + 1}
            </span>
            <div>
              <span className="text-gray-300 font-medium">
                {story.regionFlag} {story.headline}
              </span>
              <span className="text-gray-600 mx-1.5">→</span>
              <span className="text-gray-500">{story.keyFact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
