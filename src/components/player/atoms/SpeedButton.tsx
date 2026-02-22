import { Gauge } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { useState, useRef, useCallback, useEffect } from "react";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { usePopupPosition } from "./usePopupPosition";

function getPlayerPortalElement(): HTMLElement {
  return (
    document.getElementById("vidninja-portal-mount") ||
    document.getElementById("vidninja-player-container") ||
    document.body
  );
}

let _speedSetOpen: ((v: boolean) => void) | null = null;
let _speedCloseTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCloseSpeed(delayMs = 300) {
  if (_speedCloseTimer) clearTimeout(_speedCloseTimer);
  _speedCloseTimer = setTimeout(() => {
    _speedSetOpen?.(false);
    _speedCloseTimer = null;
  }, delayMs);
}
function cancelCloseSpeed() {
  if (_speedCloseTimer) {
    clearTimeout(_speedCloseTimer);
    _speedCloseTimer = null;
  }
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatSpeed(rate: number) {
  return rate === 1 ? "Normal" : `${rate}x`;
}

export function SpeedButton() {
  const playbackRate = usePlayerStore((s) => s.mediaPlaying.playbackRate);
  const display = usePlayerStore((s) => s.display);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupStyle = usePopupPosition(anchorRef, isOpen, 640);

  useEffect(() => {
    _speedSetOpen = (v) => {
      setIsOpen(v);
      setHasOpenOverlay(v);
    };
    return () => { _speedSetOpen = null; };
  }, [setHasOpenOverlay]);

  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 1024) {
      cancelCloseSpeed();
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        _speedSetOpen?.(true);
      }, 120);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (window.innerWidth >= 1024) scheduleCloseSpeed();
  }, []);

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (display) display.setPlaybackRate(rate);
    setIsOpen(false);
    setHasOpenOverlay(false);
  }, [display, setHasOpenOverlay]);

  const portalEl = getPlayerPortalElement();

  return (
    <div className="relative inline-flex" ref={anchorRef}>
      <button
        onClick={() => {
          if (window.innerWidth < 1024) {
            const next = !isOpen;
            setIsOpen(next);
            setHasOpenOverlay(next);
          } else {
            cancelCloseSpeed();
            setIsOpen(true);
            setHasOpenOverlay(true);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-white hover:text-white/80 transition-colors flex items-center justify-center rounded-lg p-2"
        title="Playback Speed"
      >
        <Gauge className="w-8 h-8 lg:w-10 lg:h-10" />
      </button>

      {createPortal(
        <div
          style={popupStyle}
          className={classNames(
            "absolute bottom-[88px] z-[300] w-[640px] max-h-[70vh]",
            "flex flex-col rounded-2xl overflow-hidden",
            "bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl",
            "transition-all duration-200 ease-out origin-bottom",
            isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none",
          )}
          onMouseEnter={cancelCloseSpeed}
          onMouseLeave={() => scheduleCloseSpeed()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0">
            <h3 className="text-white font-bold text-lg">Playback Speed</h3>
          </div>

          {/* Slider */}
          <div className="px-6 pb-6 pt-2">
            {/* Track + dots */}
            <div className="relative flex items-center justify-between">
              {/* Track line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-white/20" />

              {SPEED_OPTIONS.map((speed) => {
                const isSelected = Math.abs(playbackRate - speed) < 0.01;
                return (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setPlaybackRate(speed)}
                    className="relative flex flex-col items-center gap-2 group z-10"
                  >
                    {/* Dot */}
                    <div
                      className={classNames(
                        "w-4 h-4 rounded-full border-2 transition-all",
                        isSelected
                          ? "bg-white border-white scale-125"
                          : "bg-[#1a1a1a] border-white/40 group-hover:border-white/70",
                      )}
                    />
                    {/* Label below */}
                    <span
                      className={classNames(
                        "text-lg font-semibold whitespace-nowrap mt-1",
                        isSelected ? "text-white" : "text-white/50",
                      )}
                    >
                      {speed === 1 ? "1x (Normal)" : `${speed}x`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        portalEl,
      )}
    </div>
  );
}
