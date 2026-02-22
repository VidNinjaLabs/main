/* eslint-disable react/button-has-type */
import { ClosedCaptionIcon } from "@hugeicons/react";
import classNames from "classnames";
import { Check, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { useCaptions } from "@/components/player/hooks/useCaptions";
import { usePlayerStore } from "@/stores/player/store";
import { useSubtitleStore } from "@/stores/subtitles";
import { getLanguageName } from "@/utils/languageNames";

import { usePopupPosition } from "./usePopupPosition";

function getPlayerPortalElement(): HTMLElement {
  return (
    document.getElementById("vidninja-portal-mount") ||
    document.getElementById("vidninja-player-container") ||
    document.body
  );
}

let _captionsSetOpen: ((v: boolean) => void) | null = null;
let _captionsCloseTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCloseCaptions(delayMs = 300) {
  if (_captionsCloseTimer) clearTimeout(_captionsCloseTimer);
  _captionsCloseTimer = setTimeout(() => {
    _captionsSetOpen?.(false);
    _captionsCloseTimer = null;
  }, delayMs);
}
function cancelCloseCaptions() {
  if (_captionsCloseTimer) {
    clearTimeout(_captionsCloseTimer);
    _captionsCloseTimer = null;
  }
}

// ─── Settings sub-view ────────────────────────────────────────────────────────

function SubtitleSettingsView({ onBack }: { onBack: () => void }) {
  const styling = useSubtitleStore((s) => s.styling);
  const delay = useSubtitleStore((s) => s.delay);
  const updateStyling = useSubtitleStore((s) => s.updateStyling);
  const setDelay = useSubtitleStore((s) => s.setDelay);

  const colors = ["#ffffff", "#80b1fa", "#e2e535", "#10B239"];

  return (
    <>
      {/* Settings header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-white font-bold text-lg">Subtitle Settings</h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-5 pb-5 space-y-5">
        {/* Delay */}
        <div>
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            Delay
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDelay(delay - 0.1)}
              className="flex-1 py-2.5 px-4 bg-white/8 hover:bg-white/12 rounded-xl text-white text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Late
            </button>
            <div className="w-20 text-center py-2.5 bg-white/8 rounded-xl text-white font-mono text-sm">
              {delay.toFixed(1)}s
            </div>
            <button
              onClick={() => setDelay(delay + 0.1)}
              className="flex-1 py-2.5 px-4 bg-white/8 hover:bg-white/12 rounded-xl text-white text-sm transition-colors flex items-center justify-center gap-2"
            >
              Early
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Size */}
        <div>
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            Text Size — {Math.round(styling.size * 100)}%
          </div>
          <input
            type="range"
            min="50"
            max="200"
            value={styling.size * 100}
            onChange={(e) =>
              updateStyling({
                ...styling,
                size: parseInt(e.target.value, 10) / 100,
              })
            }
            className="w-full h-1.5 bg-white/20 rounded appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Background Opacity */}
        <div>
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            Background — {Math.round(styling.backgroundOpacity * 100)}%
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={styling.backgroundOpacity * 100}
            onChange={(e) =>
              updateStyling({
                ...styling,
                backgroundOpacity: parseInt(e.target.value, 10) / 100,
              })
            }
            className="w-full h-1.5 bg-white/20 rounded appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Color */}
        <div>
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
            Color
          </div>
          <div className="flex items-center gap-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => updateStyling({ ...styling, color })}
                className={classNames(
                  "w-8 h-8 rounded-full transition-all",
                  styling.color === color
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]"
                    : "",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={styling.color}
              onChange={(e) =>
                updateStyling({ ...styling, color: e.target.value })
              }
              className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>

        {/* Bold */}
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-semibold">Bold</span>
          <button
            onClick={() => updateStyling({ ...styling, bold: !styling.bold })}
            className={classNames(
              "w-10 h-6 rounded-full transition-colors",
              styling.bold ? "bg-blue-500" : "bg-white/20",
            )}
          >
            <div
              className={classNames(
                "w-5 h-5 bg-white rounded-full transition-transform m-0.5",
                styling.bold ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-black/30 rounded-xl p-4 text-center">
          <div
            className="inline-block px-4 py-2 rounded"
            style={{
              backgroundColor: `rgba(0,0,0,${styling.backgroundOpacity})`,
              color: styling.color,
              fontSize: `${styling.size}rem`,
              fontWeight: styling.bold ? "bold" : "normal",
            }}
          >
            This is a subtitle example.
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CaptionsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"main" | "settings">("main");
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupStyle = usePopupPosition(anchorRef, isOpen, 480);

  const captionList = usePlayerStore((s) => s.captionList);
  const selectedCaption = usePlayerStore((s) => s.caption.selected);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const display = usePlayerStore((s) => s.display);
  const { selectCaptionById } = useCaptions();

  useEffect(() => {
    _captionsSetOpen = (v) => {
      setIsOpen(v);
      setHasOpenOverlay(v);
      if (!v) setView("main");
    };
    return () => {
      _captionsSetOpen = null;
    };
  }, [setHasOpenOverlay]);

  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 1024) {
      cancelCloseCaptions();
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        _captionsSetOpen?.(true);
      }, 120);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (window.innerWidth >= 1024) scheduleCloseCaptions();
  }, []);

  useEffect(
    () => () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    },
    [],
  );

  const handleCaptionSelect = (captionId: string | null) => {
    if (!captionId) {
      setCaption(null);
      return;
    }
    selectCaptionById(captionId).catch(console.error);
  };

  const handleAudioSelect = (trackId: string) => {
    if (display) display.setAudioTrack(trackId);
  };

  const portalEl = getPlayerPortalElement();

  return (
    <div className="relative inline-flex" ref={anchorRef}>
      <button
        onClick={() => {
          if (window.innerWidth < 1024) {
            const next = !isOpen;
            setIsOpen(next);
            setHasOpenOverlay(next);
            if (!next) setView("main");
          } else {
            cancelCloseCaptions();
            setIsOpen(true);
            setHasOpenOverlay(true);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-white hover:text-white/80 transition-colors flex items-center justify-center rounded-lg p-2"
        title="Captions & Audio"
      >
        <HugeiconsIcon
          icon={ClosedCaptionIcon}
          size="md"
          className="w-8 h-8 lg:w-10 lg:h-10"
        />
      </button>

      {createPortal(
        <div
          style={popupStyle}
          className={classNames(
            "absolute bottom-[88px] z-[300] w-[580px] max-h-[70vh]",
            "flex flex-col rounded-2xl overflow-hidden",
            "bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl",
            "transition-all duration-200 ease-out origin-bottom",
            isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none",
          )}
          onMouseEnter={cancelCloseCaptions}
          onMouseLeave={() => scheduleCloseCaptions()}
        >
          {view === "settings" ? (
            <SubtitleSettingsView onBack={() => setView("main")} />
          ) : (
            <>
              {/* Two-column layout: Subtitles | Audio */}
              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Subtitles column */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="px-5 py-4 flex-shrink-0">
                    <h3 className="text-white font-bold text-base">
                      Subtitles
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Off */}
                    <div
                      onClick={() => handleCaptionSelect(null)}
                      className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                    >
                      <div className="w-4 flex-shrink-0 flex items-center">
                        {!selectedCaption && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-lg font-semibold">Off</span>
                    </div>

                    {captionList.length === 0 ? (
                      <div className="px-5 py-3 text-white/30 text-lg">
                        No subtitles
                      </div>
                    ) : (
                      captionList.map((caption, index) => {
                        let name =
                          caption.display || getLanguageName(caption.language);
                        if (
                          !caption.display &&
                          (!caption.language || caption.language === "en")
                        ) {
                          name = `Subtitle ${index + 1}`;
                        }
                        const isSelected = selectedCaption?.id === caption.id;
                        return (
                          <div
                            key={caption.id}
                            onClick={() => handleCaptionSelect(caption.id)}
                            className={classNames(
                              "flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/5 transition-colors",
                              isSelected ? "text-white" : "text-white/70",
                            )}
                          >
                            <div className="w-4 flex-shrink-0 flex items-center">
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className="flex-1 text-lg font-semibold truncate">
                              {name}
                              {caption.isHearingImpaired && " (CC)"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Settings link */}
                  <div className="px-5 py-3 flex-shrink-0 ">
                    <button
                      onClick={() => setView("settings")}
                      className="text-blue-400 hover:text-blue-300 text-lg flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                </div>

                {/* Audio column */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="px-5 py-4 flex-shrink-0">
                    <h3 className="text-white font-bold text-lg">Audio</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {audioTracks.length === 0 ? (
                      <div className="px-5 py-3 text-white/30 text-lg">
                        No audio tracks
                      </div>
                    ) : (
                      audioTracks.map((track) => {
                        const isSelected = currentAudioTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            onClick={() => handleAudioSelect(track.id)}
                            className={classNames(
                              "flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/5 transition-colors",
                              isSelected ? "text-white" : "text-white/70",
                            )}
                          >
                            <div className="w-4 flex-shrink-0 flex items-center">
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className="flex-1 text-lg font-semibold truncate">
                              {track.label ||
                                getLanguageName(track.language) ||
                                `Track ${track.id}`}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Empty bottom to match settings link height */}
                  <div className="px-5 py-3 flex-shrink-0  opacity-0 pointer-events-none">
                    <span className="text-lg">placeholder</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>,
        portalEl,
      )}
    </div>
  );
}
