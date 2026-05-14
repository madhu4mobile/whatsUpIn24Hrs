import { Copy, Check, Hash, Share2, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { hashtags, socialDescription, publishingChannels } from "../data/newsData";

export default function SocialSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Share2 className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-bold text-white">
          Auto-Publish & Distribution
        </h2>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {publishingChannels.map((channel) => (
          <div
            key={channel.id}
            className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors"
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${channel.color} mb-3 text-xl`}
            >
              {channel.icon}
            </div>
            <p className="text-white font-semibold text-sm">{channel.name}</p>
            <p className="text-gray-500 text-xs mt-1">{channel.specs}</p>
            <div className="mt-3 flex items-center justify-center gap-1">
              {channel.status === "published" ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs font-medium">
                    Published {channel.publishedAt}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400 text-xs font-medium">
                    Scheduled
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Social Description */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">
            📝 Social Description
          </h3>
          <button
            onClick={() => copyToClipboard(socialDescription, "desc")}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {copied === "desc" ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          {socialDescription}
        </p>
      </div>

      {/* Hashtags */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-400" />
            <h3 className="text-white font-semibold text-sm">Hashtags</h3>
          </div>
          <button
            onClick={() => copyToClipboard(hashtags.join(" "), "hash")}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {copied === "hash" ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy All
              </>
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-blue-900/30 text-blue-300 px-2.5 py-1 rounded-full border border-blue-800/30 hover:bg-blue-800/40 cursor-default transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
