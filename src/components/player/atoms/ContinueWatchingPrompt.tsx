import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/player/store";
import { useProgressStore } from "@/stores/progress";

interface ContinueWatchingPromptProps {
  onContinue: () => void;
  onStartOver: () => void;
}

export function ContinueWatchingPrompt({
  onContinue,
  onStartOver,
}: ContinueWatchingPromptProps) {
  const meta = usePlayerStore((s) => s.meta);
  const progressItems = useProgressStore((s) => s.items);
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!meta) {
      console.log("[ContinuePrompt] No meta yet");
      return;
    }

    // Get saved progress
    const item = progressItems[meta.tmdbId ?? ""];
    if (!item) {
      console.log("[ContinuePrompt] No progress item for:", meta.tmdbId);
      return;
    }

    let watched = 0;
    if (meta.type === "movie") {
      watched = item.progress?.watched || 0;
    } else {
      const ep = item.episodes?.[meta.episode?.tmdbId ?? ""];
      watched = ep?.progress?.watched || 0;
    }

    console.log("[ContinuePrompt] Progress:", watched, "%");

    // Show prompt if user has watched more than 5% but less than 95%
    if (watched > 5 && watched < 95) {
      setProgress(watched);
      setShow(true);
      console.log(
        "[ContinuePrompt] Showing prompt with",
        watched,
        "% progress",
      );
    } else {
      console.log(
        "[ContinuePrompt] Not showing - progress outside range (5-95%)",
      );
    }
  }, [meta, progressItems]);

  if (!show) return null;

  const handleContinue = () => {
    setShow(false);
    onContinue();
  };

  const handleStartOver = () => {
    setShow(false);
    onStartOver();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white text-center mb-2">
          Continue Watching?
        </h2>

        {/* Description */}
        <p className="text-zinc-400 text-center mb-6">
          You've watched {Math.round(progress)}% of this content. Would you like
          to continue where you left off?
        </p>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-zinc-700 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleStartOver}
            className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors font-medium"
          >
            Start Over
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-md transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
