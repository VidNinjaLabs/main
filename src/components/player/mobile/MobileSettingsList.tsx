import { ChevronRight, X } from "lucide-react";
import React, { useState } from "react";
import { usePlayerStore } from "@/stores/player/store";
import { useSubtitleStore } from "@/stores/subtitles";
import { MobileOverlay } from "./MobileOverlay";

interface MobileSettingsListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSettingsList({
  isOpen,
  onClose,
}: MobileSettingsListProps) {
  const styling = useSubtitleStore((s) => s.styling);
  const delay = useSubtitleStore((s) => s.delay);
  const updateStyling = useSubtitleStore((s) => s.updateStyling);
  const setDelay = useSubtitleStore((s) => s.setDelay);

  // Qualities
  const qualities = usePlayerStore((s) => s.qualities);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const switchQuality = usePlayerStore((s) => s.switchQuality);
  const playbackRate = usePlayerStore((s) => s.mediaPlaying.playbackRate);
  const display = usePlayerStore((s) => s.display);

  const setPlaybackRate = (rate: number) => {
    if (display) display.setPlaybackRate(rate);
  };

  const getQualityLabel = (quality: string) => {
    if (quality === "unknown") return "Auto";
    return quality.toUpperCase();
  };

  // Sub-menus state
  const [activeSubMenu, setActiveSubMenu] = useState<
    "none" | "quality" | "speed" | "subtitle_style"
  >("none");

  const colors = ["#ffffff", "#80b1fa", "#e2e535", "#10B239"];

  // Helper for sub-menu rendering
  const renderSubMenu = () => {
    if (activeSubMenu === "quality") {
      return (
        <div className="space-y-1">
          {qualities.map((quality) => (
            <button
              key={quality}
              onClick={() => {
                switchQuality(quality as any);
                setActiveSubMenu("none");
              }}
              className={`w-full px-3 py-3 rounded-lg flex items-center justify-between bg-white/5 hover:bg-white/10 ${
                currentQuality === quality
                  ? "bg-white/10 border border-white/20"
                  : ""
              }`}
            >
              <span className="text-white text-base">
                {getQualityLabel(quality)}
              </span>
              {currentQuality === quality && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      );
    }

    if (activeSubMenu === "speed") {
      const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
      return (
        <div className="space-y-1">
          {speeds.map((speed) => (
            <button
              key={speed}
              onClick={() => {
                setPlaybackRate(speed);
                setActiveSubMenu("none");
              }}
              className={`w-full px-3 py-3 rounded-lg flex items-center justify-between bg-white/5 hover:bg-white/10 ${
                playbackRate === speed
                  ? "bg-white/10 border border-white/20"
                  : ""
              }`}
            >
              <span className="text-white text-base">
                {speed === 1 ? "Normal" : `${speed}x`}
              </span>
              {playbackRate === speed && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      );
    }

    if (activeSubMenu === "subtitle_style") {
      return (
        <div className="space-y-4">
          {/* Delay */}
          <div>
            <div className="text-white/70 text-sm mb-2">Delay</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDelay(delay - 0.1)}
                className="flex-1 py-2 bg-white/10 rounded text-white"
              >
                -0.1s
              </button>
              <span className="font-mono text-white w-16 text-center">
                {delay.toFixed(1)}s
              </span>
              <button
                onClick={() => setDelay(delay + 0.1)}
                className="flex-1 py-2 bg-white/10 rounded text-white"
              >
                +0.1s
              </button>
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="text-white/70 text-sm mb-2">
              Size: {Math.round(styling.size * 100)}%
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={styling.size * 100}
              onChange={(e) =>
                updateStyling({
                  ...styling,
                  size: parseInt(e.target.value) / 100,
                })
              }
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Background */}
          <div>
            <div className="text-white/70 text-sm mb-2">
              Background: {Math.round(styling.backgroundOpacity * 100)}%
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={styling.backgroundOpacity * 100}
              onChange={(e) =>
                updateStyling({
                  ...styling,
                  backgroundOpacity: parseInt(e.target.value) / 100,
                })
              }
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Color */}
          <div>
            <div className="text-white/70 text-sm mb-2">Color</div>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyling({ ...styling, color })}
                  className={`w-8 h-8 rounded-full ${
                    styling.color === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const title =
    activeSubMenu === "none"
      ? "Settings"
      : activeSubMenu === "quality"
        ? "Quality"
        : activeSubMenu === "speed"
          ? "Playback Speed"
          : "Subtitle Style";

  const handleBack = () => {
    if (activeSubMenu !== "none") {
      setActiveSubMenu("none");
    } else {
      onClose();
    }
  };

  return (
    <MobileOverlay isOpen={isOpen} onClose={onClose} title={title}>
      {activeSubMenu !== "none" && (
        <button
          onClick={handleBack}
          className="mb-4 text-white/70 hover:text-white flex items-center gap-1 text-sm"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Back
        </button>
      )}

      {activeSubMenu === "none" ? (
        <div className="space-y-1">
          <button
            onClick={() => setActiveSubMenu("quality")}
            className="w-full px-3 py-3 rounded-lg flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-white text-base">Quality</span>
            <div className="flex items-center gap-2 text-white/50">
              <span className="text-sm">
                {currentQuality ? getQualityLabel(currentQuality) : "Auto"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setActiveSubMenu("speed")}
            className="w-full px-3 py-3 rounded-lg flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-white text-base">Playback Speed</span>
            <div className="flex items-center gap-2 text-white/50">
              <span className="text-sm">
                {playbackRate === 1 ? "Normal" : `${playbackRate}x`}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setActiveSubMenu("subtitle_style")}
            className="w-full px-3 py-3 rounded-lg flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-white text-base">Subtitle Style</span>
            <div className="flex items-center gap-2 text-white/50">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      ) : (
        renderSubMenu()
      )}
    </MobileOverlay>
  );
}
