import { useState, useRef, useEffect } from "react";
import {
  Globe,
  ArrowUp,
  Calendar,
  Clock,
  Newspaper,
  Zap,
  Shield,
} from "lucide-react";
import HeroSection from "./components/HeroSection";
import StoryCard from "./components/StoryCard";
import NarrationPanel from "./components/NarrationPanel";
import StoryList from "./components/StoryList";
import SocialSection from "./components/SocialSection";
import VisualTimeline from "./components/VisualTimeline";
import AutomationPanel from "./components/AutomationPanel";
import OriginalitySection from "./components/OriginalitySection";
import { stories, todayDate, videoTitle, scheduleInfo } from "./data/newsData";

export default function App() {
  const [started, setStarted] = useState(false);
  const [activeStory, setActiveStory] = useState(-1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const storyRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);

      // Update active story based on scroll position
      storyRefs.current.forEach((ref, i) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.5 && rect.bottom > 100) {
            setActiveStory(i);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Count words in all narrations for time estimate
  const totalWords = stories.reduce(
    (acc, s) => acc + s.narration.split(" ").length,
    0
  );
  const estimatedMinutes = Math.round(totalWords / 150);

  return (
    <div
      className="min-h-screen bg-[#0a0e1a] text-white font-sans"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Sticky Nav */}
      {started && (
        <nav className="sticky top-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-gray-800/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-bold text-sm tracking-wider">
                DAILY GLOBAL PULSE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-xs hidden sm:inline">
                {todayDate}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero */}
      <HeroSection onStart={handleStart} />

      {/* Main Content */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-4 py-12">
        {/* Date Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">
              📅 {todayDate}
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-black text-white mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {videoTitle}
          </h2>
          <div className="flex items-center justify-center gap-4 text-gray-500 text-sm mt-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> ~{estimatedMinutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Newspaper className="w-4 h-4" /> {stories.length} stories
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Verified sources
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> 100% Original
            </span>
          </div>
        </div>

        {/* Automation Panel */}
        <div className="mb-8">
          <AutomationPanel />
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs">Story Progress</span>
            <span className="text-gray-500 text-xs">
              {activeStory >= 0 ? activeStory + 1 : 0} / {stories.length}
            </span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
              style={{
                width: `${
                  activeStory >= 0
                    ? ((activeStory + 1) / stories.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Story Quick Reference */}
        <StoryList />

        {/* Stories Grid */}
        <div className="mt-10 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-0.5 bg-blue-500 rounded-full" />
            Headlines & Narration Scripts
          </h2>
          {stories.map((story, i) => (
            <div
              key={story.id}
              ref={(el) => {
                storyRefs.current[i] = el;
              }}
            >
              <StoryCard
                story={story}
                index={i}
                isActive={activeStory === i}
              />
            </div>
          ))}
        </div>

        {/* Hook & Closer Scripts */}
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-800/30 rounded-xl p-5">
            <h3 className="text-blue-400 font-bold text-sm mb-3">
              🎬 HOOK (0:00 – 0:08)
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed italic">
              "A deadly mall fire in Iraq. Ukraine gets a new prime minister for
              the first time since the invasion. And did the President of the
              United States just draft a letter to fire the head of the Federal
              Reserve? This is your Daily Global Pulse."
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-800/30 rounded-xl p-5">
            <h3 className="text-purple-400 font-bold text-sm mb-3">
              🎬 CLOSER (6:00 – 6:20)
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed italic">
              "That's your world in five minutes. From a grieving city in Iraq
              to coalition fractures in Jerusalem — the thread connecting
              today's stories is clear: the systems we build only work when
              accountability follows. Stay informed. Stay curious. I'm your
              Daily Global Pulse."
            </p>
          </div>
        </div>

        {/* Full Narration Panel */}
        <div className="mt-10">
          <NarrationPanel />
        </div>

        {/* Visual Timeline */}
        <div className="mt-10">
          <VisualTimeline />
        </div>

        {/* Originality Section */}
        <div className="mt-10">
          <OriginalitySection />
        </div>

        {/* Social Section */}
        <div className="mt-10">
          <SocialSection />
        </div>

        {/* Schedule Info Banner */}
        <div className="mt-10 bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-blue-900/30 border border-blue-800/30 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Daily Auto-Update Schedule
                </h3>
                <p className="text-gray-400 text-sm">
                  New edition published every day at{" "}
                  <span className="text-blue-400 font-semibold">
                    {scheduleInfo.updateTime} {scheduleInfo.timezone}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Next Update
              </p>
              <p className="text-white font-semibold">
                {scheduleInfo.nextUpdate}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-bold tracking-widest text-sm">
                DAILY GLOBAL PULSE
              </span>
            </div>
            <p className="text-gray-600 text-xs max-w-lg mx-auto leading-relaxed">
              AI-curated • 100% original content • Verified from Reuters, AP,
              BBC, Al Jazeera, NYT, and 20+ international sources • Neutral and
              fact-based • Mobile-first 9:16 format • Auto-published daily at
              5:00 AM EST
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-700 text-xs">
              <Shield className="w-3 h-3" />
              <span>No plagiarism • All sources cited • Original narration</span>
            </div>
            <p className="text-gray-700 text-xs">
              © {new Date().getFullYear()} Daily Global Pulse • All rights
              reserved
            </p>
          </div>
        </footer>
      </div>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
