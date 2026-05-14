import { useState, useEffect } from "react";
import { Play, Globe, Calendar } from "lucide-react";
import { todayDate, videoTitle, videoSubtitle } from "../data/newsData";

export default function HeroSection({ onStart }: { onStart: () => void }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0e1a]">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-globe.jpg"
          alt="Global news network"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/70 via-[#0a0e1a]/50 to-[#0a0e1a]" />
      </div>

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 font-semibold tracking-[0.25em] text-xs uppercase">
            Daily Global Pulse
          </span>
          <Globe className="w-5 h-5 text-blue-400" />
        </div>

        {/* Date */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm font-medium">{todayDate}</span>
        </div>

        {/* Title */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {videoTitle}
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-300 mb-10 font-light">
          {videoSubtitle}
        </p>

        {/* Play button */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
        >
          <div
            className={`relative flex items-center justify-center w-10 h-10 bg-white/20 rounded-full transition-transform ${
              pulse ? "scale-110" : "scale-100"
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <div
              className={`absolute inset-0 rounded-full border-2 border-white/30 ${
                pulse ? "scale-150 opacity-0" : "scale-100 opacity-100"
              } transition-all duration-1000`}
            />
          </div>
          <span className="text-lg">Watch Today's Reel</span>
        </button>

        {/* Story count */}
        <p className="mt-6 text-gray-500 text-sm">
          9 stories • 5–6 min • Verified sources
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-500 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-gray-400 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
