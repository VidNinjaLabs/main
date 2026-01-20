import { ClosedCaptionIcon } from "@hugeicons/react";
import { useState } from "react";
import { Check, Settings, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "../base/Popover";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { usePlayerStore } from "@/stores/player/store";
import { useCaptions } from "@/components/player/hooks/useCaptions";
import { getLanguageName } from "@/utils/languageNames";
import { useSubtitleStore } from "@/stores/subtitles";

function SubtitleSettingsModal({ onClose }: { onClose: () => void }) {
  const styling = useSubtitleStore((s) => s.styling);
  const delay = useSubtitleStore((s) => s.delay);
  const overrideCasing = useSubtitleStore((s) => s.overrideCasing);
  const updateStyling = useSubtitleStore((s) => s.updateStyling);
  const setDelay = useSubtitleStore((s) => s.setDelay);
  const setOverrideCasing = useSubtitleStore((s) => s.setOverrideCasing);

  const colors = ["#ffffff", "#80b1fa", "#e2e535", "#10B239FF"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="bg-zinc-800 rounded-lg w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 sticky top-0 bg-zinc-800 z-10">
          <h2 className="text-white font-semibold text-lg">
            Subtitles Settings
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Delay */}
          <div>
            <div className="text-white font-medium mb-3">Subtitle Delay</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDelay(delay - 0.1)}
                className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Late</span>
              </button>
              <div className="w-24 text-center py-2 bg-zinc-900 rounded text-white font-mono">
                {delay.toFixed(1)}s
              </div>
              <button
                onClick={() => setDelay(delay + 0.1)}
                className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-sm">Early</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fix Capitals */}
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">Fix Capitals</div>
            <button
              onClick={() => setOverrideCasing(!overrideCasing)}
              className={`w-12 h-6 rounded-full transition-colors ${
                overrideCasing ? "bg-blue-500" : "bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  overrideCasing ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="border-t border-zinc-700 pt-6" />

          {/* Background Opacity */}
          <div>
            <div className="text-white font-medium mb-3">
              Background Opacity
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
              className="w-full"
            />
            <div className="text-gray-400 text-sm text-center mt-1">
              {Math.round(styling.backgroundOpacity * 100)}%
            </div>
          </div>

          {/* Background Blur */}
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">Background Blur</div>
            <button
              onClick={() =>
                updateStyling({
                  ...styling,
                  backgroundBlurEnabled: !styling.backgroundBlurEnabled,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                styling.backgroundBlurEnabled ? "bg-blue-500" : "bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  styling.backgroundBlurEnabled
                    ? "translate-x-6"
                    : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {styling.backgroundBlurEnabled && (
            <div>
              <input
                type="range"
                min="0"
                max="100"
                value={styling.backgroundBlur * 100}
                onChange={(e) =>
                  updateStyling({
                    ...styling,
                    backgroundBlur: parseInt(e.target.value) / 100,
                  })
                }
                className="w-full"
              />
              <div className="text-gray-400 text-sm text-center mt-1">
                {Math.round(styling.backgroundBlur * 100)}%
              </div>
            </div>
          )}

          {/* Text Size */}
          <div>
            <div className="text-white font-medium mb-3">Text Size</div>
            <input
              type="range"
              min="1"
              max="200"
              value={styling.size * 100}
              onChange={(e) =>
                updateStyling({
                  ...styling,
                  size: parseInt(e.target.value) / 100,
                })
              }
              className="w-full"
            />
            <div className="text-gray-400 text-sm text-center mt-1">
              {Math.round(styling.size * 100)}%
            </div>
          </div>

          {/* Font Style */}
          <div>
            <div className="text-white font-medium mb-3">Font Style</div>
            <select
              value={styling.fontStyle}
              onChange={(e) =>
                updateStyling({ ...styling, fontStyle: e.target.value })
              }
              className="w-full bg-zinc-700 text-white rounded px-3 py-2"
            >
              <option value="default">Default</option>
              <option value="raised">Raised</option>
              <option value="depressed">Depressed</option>
              <option value="Border">Border</option>
              <option value="dropShadow">Drop Shadow</option>
            </select>
          </div>

          {/* Border Thickness (only if Border style) */}
          {styling.fontStyle === "Border" && (
            <div>
              <div className="text-white font-medium mb-3">
                Border Thickness
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={styling.borderThickness}
                onChange={(e) =>
                  updateStyling({
                    ...styling,
                    borderThickness: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="text-gray-400 text-sm text-center mt-1">
                {styling.borderThickness.toFixed(1)}px
              </div>
            </div>
          )}

          {/* Bold */}
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">Bold</div>
            <button
              onClick={() => updateStyling({ ...styling, bold: !styling.bold })}
              className={`w-12 h-6 rounded-full transition-colors ${
                styling.bold ? "bg-blue-500" : "bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  styling.bold ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Color */}
          <div>
            <div className="text-white font-medium mb-3">Color</div>
            <div className="flex items-center gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyling({ ...styling, color })}
                  className={`w-10 h-10 rounded-full transition-all ${
                    styling.color === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-800"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {styling.color === color && (
                    <Check className="w-5 h-5 text-black mx-auto" />
                  )}
                </button>
              ))}
              <input
                type="color"
                value={styling.color}
                onChange={(e) =>
                  updateStyling({ ...styling, color: e.target.value })
                }
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            </div>
          </div>

          {/* Vertical Position */}
          <div>
            <div className="text-white font-medium mb-3">Vertical Position</div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  updateStyling({ ...styling, verticalPosition: 1 })
                }
                className={`flex-1 py-2 rounded transition-colors ${
                  styling.verticalPosition === 1
                    ? "bg-white text-black"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
              >
                Low
              </button>
              <button
                onClick={() =>
                  updateStyling({ ...styling, verticalPosition: 3 })
                }
                className={`flex-1 py-2 rounded transition-colors ${
                  styling.verticalPosition === 3
                    ? "bg-white text-black"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
              >
                High
              </button>
            </div>
          </div>
        </div>

        {/* Example Preview */}
        <div className="p-6 pt-0">
          <div className="bg-black/30 rounded p-4 text-center">
            <div
              className="inline-block px-4 py-2 rounded"
              style={{
                backgroundColor: `rgba(0,0,0,${styling.backgroundOpacity})`,
                backdropFilter: styling.backgroundBlurEnabled
                  ? `blur(${Math.floor(styling.backgroundBlur * 64)}px)`
                  : "none",
                color: styling.color,
                fontSize: `${styling.size}rem`,
                fontWeight: styling.bold ? "bold" : "normal",
              }}
            >
              This is a subtitles example.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CaptionsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const captionList = usePlayerStore((s) => s.captionList);
  const selectedCaption = usePlayerStore((s) => s.caption.selected);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const { selectCaptionById } = useCaptions();

  const handleCaptionSelect = async (captionId: string | null) => {
    if (!captionId) {
      // Turn off captions
      setCaption(null);
      setIsOpen(false);
      return;
    }

    // Select caption by ID
    try {
      await selectCaptionById(captionId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to load caption:", error);
    }
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    setShowSettings(true);
  };

  return (
    <>
      <Popover
        trigger={
          <button
            className="p-2 md:p-2.5 transition-colors group"
            title="Captions & Audio"
            onClick={() => setIsOpen(!isOpen)}
          >
            <HugeiconsIcon
              icon={ClosedCaptionIcon}
              size="md"
              className="text-white/70 group-hover:text-white transition-colors"
              strokeWidth={2}
            />
          </button>
        }
        content={
          <div className="w-[600px] flex">
            {/* Subtitles Column */}
            <div className="flex-1 border-r border-zinc-700">
              <div className="p-4 border-b border-zinc-700">
                <h3 className="text-white font-semibold text-base">
                  Subtitles
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {/* Off Option */}
                <button
                  onClick={() => handleCaptionSelect(null)}
                  className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center gap-4"
                >
                  {!selectedCaption && (
                    <Check className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                  {!selectedCaption || (
                    <div className="w-6 h-6 flex-shrink-0" />
                  )}
                  <span className="text-white text-lg">Off</span>
                </button>

                {/* Caption List */}
                {captionList.length === 0 ? (
                  <div className="px-5 py-3.5 text-gray-400 text-base">
                    No subtitles available
                  </div>
                ) : (
                  captionList.map((caption, index) => {
                    // Use display name if available, otherwise use getLanguageName
                    let displayName =
                      caption.display || getLanguageName(caption.language);

                    // If language is unknown or just "EN", show subtitle number
                    if (
                      !caption.display &&
                      (!caption.language || caption.language === "en")
                    ) {
                      displayName = `Subtitle #${index + 1}`;
                    }

                    return (
                      <button
                        key={caption.id}
                        onClick={() => handleCaptionSelect(caption.id)}
                        className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center gap-4"
                      >
                        {selectedCaption?.id === caption.id && (
                          <Check className="w-6 h-6 text-white flex-shrink-0" />
                        )}
                        {selectedCaption?.id !== caption.id && (
                          <div className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-gray-300 text-lg">
                          {displayName}
                          {caption.isHearingImpaired && " (CC)"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Subtitles Settings Link */}
              <div className="p-4 border-t border-zinc-700">
                <button
                  onClick={handleSettingsClick}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Subtitles Settings
                </button>
              </div>
            </div>

            {/* Audio Column */}
            <div className="flex-1">
              <div className="p-4 border-b border-zinc-700">
                <h3 className="text-white font-semibold text-base">Audio</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="px-5 py-3.5 text-gray-400 text-base">
                  No audio tracks available
                </div>
              </div>
            </div>
          </div>
        }
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="bottom"
        align="center"
      />

      {/* Settings Modal */}
      {showSettings && (
        <SubtitleSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
