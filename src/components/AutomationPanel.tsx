import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  RefreshCw,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  Radio,
} from "lucide-react";
import {
  scheduleInfo,
  publishingChannels,
  automationWorkflow,
  previewMode,
  getNextUpdateString,
} from "../data/newsData";

export default function AutomationPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format EST time
  const estTime = currentTime.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const estDate = currentTime.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Calculate hours/minutes until the next 5:00 AM in America/New_York.
  // Uses Intl.DateTimeFormat to read the *actual* NY wall-clock time, then
  // works in "seconds since NY midnight" — this avoids the
  // `new Date(toLocaleString(...))` trap, which silently reinterprets the
  // formatted string in the caller's local timezone and produces the wrong
  // diff for any non-EST device.
  const getHoursUntilNextUpdate = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(currentTime);
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);
    // Intl returns "24" for midnight in some runtimes; normalize to 0.
    const nyHour = get("hour") % 24;
    const nyMin = get("minute");
    const nySec = get("second");

    const secondsSinceMidnightNY = nyHour * 3600 + nyMin * 60 + nySec;
    const targetSeconds = 5 * 3600; // 5:00 AM
    const diffSeconds =
      secondsSinceMidnightNY < targetSeconds
        ? targetSeconds - secondsSinceMidnightNY
        : 86400 - secondsSinceMidnightNY + targetSeconds;

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <section className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-6 py-5 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`relative flex items-center justify-center w-12 h-12 rounded-full border ${
              previewMode
                ? "bg-amber-600/20 border-amber-500/30"
                : "bg-green-600/20 border-green-500/30"
            }`}
          >
            <RefreshCw
              className={`w-5 h-5 ${
                previewMode ? "text-amber-400" : "text-green-400"
              }`}
            />
            <span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 animate-pulse ${
                previewMode ? "bg-amber-500" : "bg-green-500"
              }`}
            />
          </div>
          <div className="text-left">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              Automated Daily Schedule
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  previewMode
                    ? "bg-amber-600/20 text-amber-400 border-amber-500/30"
                    : "bg-green-600/20 text-green-400 border-green-500/30"
                }`}
              >
                {previewMode ? "PREVIEW" : "ACTIVE"}
              </span>
            </h2>
            <p className="text-gray-400 text-sm">
              {previewMode
                ? "Auto-publish pipeline not wired up yet — local preview only."
                : `Next update in ${getHoursUntilNextUpdate()} • ${scheduleInfo.updateTime} ${scheduleInfo.timezone}`}
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
          {/* Live Clock */}
          <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">
                    Current Time (EST)
                  </p>
                  <p className="text-white font-mono text-xl font-bold">
                    {estTime}
                  </p>
                  <p className="text-gray-500 text-xs">{estDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs uppercase tracking-wide">
                  Daily Update
                </p>
                <p className="text-green-400 font-bold text-lg">5:00 AM EST</p>
                <p className="text-gray-500 text-xs">Every day, automatically</p>
              </div>
            </div>
          </div>

          {/* Workflow Timeline */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Daily Automation Workflow
            </h3>
            <div className="space-y-0">
              {automationWorkflow.map((step, i) => (
                <div key={step.step} className="relative flex gap-4 pb-4 last:pb-0">
                  {i < automationWorkflow.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-700" />
                  )}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center z-10">
                    <span className="text-blue-400 text-xs font-bold">
                      {step.step}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-blue-400 text-xs font-mono font-bold">
                        {step.time}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-white text-sm font-semibold">
                        {step.action}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">{step.description}</p>
                  </div>
                  {previewMode ? (
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Publishing Status */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" />
              {previewMode
                ? "Target Channels (not yet published)"
                : "Today's Publishing Status"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {publishingChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center hover:border-gray-600 transition-colors"
                >
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${channel.color} mb-2 text-lg`}
                  >
                    {channel.icon}
                  </div>
                  <p className="text-white font-medium text-xs mb-0.5">
                    {channel.name}
                  </p>
                  <p className="text-gray-500 text-[10px]">{channel.specs}</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {channel.status === "published" ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-[10px] font-medium">
                          {channel.publishedAt}
                        </span>
                      </>
                    ) : channel.status === "preview" ? (
                      <>
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400 text-[10px] font-medium">
                          Preview
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400 text-[10px] font-medium">
                          Scheduled
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Info */}
          <div className="flex items-center justify-between bg-blue-900/20 border border-blue-800/30 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm">Next edition:</span>
            </div>
            <span className="text-white font-semibold text-sm">
              {getNextUpdateString(currentTime)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
