import { Settings02Icon } from "@hugeicons/react";
import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { Popover } from "../base/Popover";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const qualities = usePlayerStore((s) => s.qualities);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const switchQuality = usePlayerStore((s) => s.switchQuality);

  // Map quality strings to display labels
  const getQualityLabel = (quality: string) => {
    if (quality === "unknown") return "Auto";
    return quality.toUpperCase();
  };

  const getQualityDescription = (quality: string) => {
    const descriptions: Record<string, string> = {
      "1080p": "Full HD",
      "720p": "HD",
      "480p": "SD",
      "360p": "Low",
      unknown: "Adjusts automatically",
    };
    return descriptions[quality] || "";
  };

  return (
    <Popover
      trigger={
        <button
          className="p-2 md:p-2.5 transition-colors group"
          title="Settings"
          onClick={() => setIsOpen(!isOpen)}
        >
          <HugeiconsIcon
            icon={Settings02Icon}
            size="md"
            className="text-white/70 group-hover:text-white transition-colors"
            strokeWidth={2}
          />
        </button>
      }
      content={
        <div className="w-72">
          <div className="p-4 border-b border-zinc-700">
            <h3 className="text-white font-semibold text-base">Settings</h3>
          </div>

          {/* Quality Section - Only show if qualities available */}
          {qualities.length > 0 && (
            <div className="py-2">
              <div className="px-5 py-2 text-gray-400 text-sm font-medium">
                Quality
              </div>
              {qualities.map((quality) => (
                <button
                  key={quality}
                  onClick={() => {
                    switchQuality(quality as any);
                    setIsOpen(false);
                  }}
                  className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="text-white text-lg">
                      {getQualityLabel(quality)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {getQualityDescription(quality)}
                    </div>
                  </div>
                  {currentQuality === quality && (
                    <Check className="w-6 h-6 text-white ml-3" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Playback Speed */}
          <div className="border-t border-zinc-700 py-2">
            <button className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center justify-between">
              <span className="text-white text-lg">Playback Speed</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      }
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      position="bottom"
      align="center"
    />
  );
}
