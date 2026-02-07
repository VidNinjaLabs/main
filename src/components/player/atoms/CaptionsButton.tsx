import { ClosedCaptionIcon } from "@hugeicons/react";
import { useState } from "react";
import { Check, Settings, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
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
                <span className="text-xs">Late</span>
              </button>
              <div className="w-24 text-center py-2 bg-zinc-900 rounded text-white font-mono">
                {delay.toFixed(1)}s
              </div>
              <button
                onClick={() => setDelay(delay + 0.1)}
                className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xs">Early</span>
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
            <div className="text-gray-400 text-xs text-center mt-1">
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
              <div className="text-gray-400 text-xs text-center mt-1">
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
            <div className="text-gray-400 text-xs text-center mt-1">
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
              <div className="text-gray-400 text-xs text-center mt-1">
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
  const [view, setView] = useState<"main" | "settings">("main");

  const captionList = usePlayerStore((s) => s.captionList);
  const selectedCaption = usePlayerStore((s) => s.caption.selected);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const { selectCaptionById } = useCaptions();

  // Audio tracks
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const display = usePlayerStore((s) => s.display);

  // Subtitle settings
  const styling = useSubtitleStore((s) => s.styling);
  const delay = useSubtitleStore((s) => s.delay);
  const updateStyling = useSubtitleStore((s) => s.updateStyling);
  const setDelay = useSubtitleStore((s) => s.setDelay);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setHasOpenOverlay(open);
    if (!open) setView("main");
  };

  const handleCaptionSelect = async (captionId: string | null) => {
    if (!captionId) {
      setCaption(null);
      return;
    }
    try {
      await selectCaptionById(captionId);
    } catch (error) {
      console.error("Failed to load caption:", error);
    }
  };

  const handleAudioSelect = (trackId: string) => {
    if (display) {
      display.setAudioTrack(trackId);
    }
  };

  const colors = ["#ffffff", "#80b1fa", "#e2e535", "#10B239"];

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <Popover.Trigger asChild>
        <button
          className="p-1 md:p-2 transition-colors group outline-none rounded-md focus-visible:ring-2 focus-visible:ring-white/20"
          title="Captions & Audio"
        >
          <HugeiconsIcon
            icon={ClosedCaptionIcon}
            size="md"
            className="w-5 h-5 md:w-[25px] md:h-[25px] text-white transition-colors"
          />
        </button>
      </Popover.Trigger>
      <Popover.Content
        className="w-[420px] p-0"
        align="center"
        side="top"
        sideOffset={10}
        showArrow={true}
      >
        {view === "main" ? (
          <div className="flex">
            {/* Subtitles Column */}
            <div className="flex-1 border-r border-white/10">
              <div className="px-4 py-2.5 border-b border-white/10">
                <h3 className="text-white/70 font-medium text-xs uppercase tracking-wider">
                  Subtitles
                </h3>
              </div>
              <div className="py-1.5">
                {/* Off Option */}
                <button
                  onClick={() => handleCaptionSelect(null)}
                  className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  {!selectedCaption ? (
                    <Check className="w-4 h-4 text-white flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="text-white text-sm">Off</span>
                </button>

                {captionList.length === 0 ? (
                  <div className="px-4 py-2 text-white/40 text-sm pl-11">
                    No subtitles
                  </div>
                ) : (
                  captionList.slice(0, 5).map((caption, index) => {
                    let displayName =
                      caption.display || getLanguageName(caption.language);
                    if (
                      !caption.display &&
                      (!caption.language || caption.language === "en")
                    ) {
                      displayName = `Subtitle ${index + 1}`;
                    }
                    return (
                      <button
                        key={caption.id}
                        onClick={() => handleCaptionSelect(caption.id)}
                        className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                      >
                        {selectedCaption?.id === caption.id ? (
                          <Check className="w-4 h-4 text-white flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="text-white/90 text-sm truncate">
                          {displayName}
                          {caption.isHearingImpaired && " (CC)"}
                        </span>
                      </button>
                    );
                  })
                )}
                {captionList.length > 5 && (
                  <div className="px-4 py-1.5 text-white/40 text-sm pl-11">
                    +{captionList.length - 5} more
                  </div>
                )}
              </div>

              {/* Settings Link */}
              <div className="px-4 py-2.5 border-t border-white/10">
                <button
                  onClick={() => setView("settings")}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>

            {/* Audio Column */}
            <div className="flex-1">
              <div className="px-4 py-2.5 border-b border-white/10">
                <h3 className="text-white/70 font-medium text-xs uppercase tracking-wider">
                  Audio
                </h3>
              </div>
              <div className="py-1.5">
                {audioTracks.length === 0 ? (
                  <div className="px-4 py-2 text-white/40 text-sm">
                    No audio tracks
                  </div>
                ) : (
                  audioTracks.slice(0, 5).map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleAudioSelect(track.id)}
                      className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                      {currentAudioTrack?.id === track.id ? (
                        <Check className="w-4 h-4 text-white flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="text-white/90 text-sm truncate">
                        {track.label ||
                          getLanguageName(track.language) ||
                          `Track ${track.id}`}
                      </span>
                    </button>
                  ))
                )}
                {audioTracks.length > 5 && (
                  <div className="px-4 py-1.5 text-white/40 text-sm pl-11">
                    +{audioTracks.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Settings View */}
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
              <button
                onClick={() => setView("main")}
                className="text-white/70 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-white/70 font-medium text-xs uppercase tracking-wider">
                Settings
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Delay */}
              <div>
                <div className="text-white/70 text-sm mb-2">Delay</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDelay(delay - 0.1)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
                  >
                    -0.1s
                  </button>
                  <div className="flex-1 text-center text-white text-sm font-mono">
                    {delay.toFixed(1)}s
                  </div>
                  <button
                    onClick={() => setDelay(delay + 0.1)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
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
                  className="w-full h-1.5 bg-white/20 rounded appearance-none cursor-pointer"
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
                  className="w-full h-1.5 bg-white/20 rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Color */}
              <div>
                <div className="text-white/70 text-sm mb-2">Color</div>
                <div className="flex items-center gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateStyling({ ...styling, color })}
                      className={`w-6 h-6 rounded-full transition-all ${
                        styling.color === color
                          ? "ring-2 ring-white ring-offset-2 ring-offset-black"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Bold Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Bold</span>
                <button
                  onClick={() =>
                    updateStyling({ ...styling, bold: !styling.bold })
                  }
                  className={`w-9 h-5 rounded-full transition-colors ${styling.bold ? "bg-blue-500" : "bg-white/20"}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${styling.bold ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
