import {
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute01Icon,
} from "@hugeicons/react";
import { useState, useCallback, useRef, useEffect } from "react";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { usePlayerStore } from "@/stores/player/store";
import { useVolume } from "../hooks/useVolume";
import {
  useProgressBar,
  makePercentage,
  makePercentageString,
} from "@/hooks/useProgressBar";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { usePopupPosition } from "./usePopupPosition";

function getPlayerPortalElement(): HTMLElement {
  return (
    document.getElementById("vidninja-portal-mount") ||
    document.getElementById("vidninja-player-container") ||
    document.body
  );
}

let _volSetOpen: ((v: boolean) => void) | null = null;
let _volCloseTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCloseVol(delayMs = 300) {
  if (_volCloseTimer) clearTimeout(_volCloseTimer);
  _volCloseTimer = setTimeout(() => {
    _volSetOpen?.(false);
    _volCloseTimer = null;
  }, delayMs);
}
function cancelCloseVol() {
  if (_volCloseTimer) {
    clearTimeout(_volCloseTimer);
    _volCloseTimer = null;
  }
}

export function VolumeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const volume = usePlayerStore((s) => s.mediaPlaying.volume);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const { setVolume, toggleMute } = useVolume();
  
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const commitVolume = useCallback(
    (percentage: number) => {
      setVolume(percentage);
    },
    [setVolume],
  );

  // Vertical slider
  const refVertical = useRef<HTMLDivElement>(null);
  const {
    dragging: draggingVertical,
    dragPercentage: dragPercentageVertical,
    dragMouseDown: dragMouseDownVertical,
  } = useProgressBar(refVertical, commitVolume, true, true); // commitImmediately=true, vertical=true

  const popupStyle = usePopupPosition(anchorRef, isOpen || draggingVertical, 48);

  useEffect(() => {
    _volSetOpen = (v) => {
      setIsOpen(v);
      setHasOpenOverlay(v);
    };
    return () => { _volSetOpen = null; };
  }, [setHasOpenOverlay]);

  let percentage = makePercentage(volume * 100);
  if (draggingVertical) percentage = makePercentage(dragPercentageVertical);
  const percentageString = makePercentageString(percentage);

  // Determine icon state
  const volState =
    percentage === 0 ? "mute" : percentage <= 50 ? "medium" : "full";

  // Get appropriate icon
  const getVolumeIcon = () => {
    if (volState === "mute") return VolumeMute01Icon;
    if (volState === "medium") return VolumeLowIcon;
    return VolumeHighIcon;
  };

  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 1024) {
      cancelCloseVol();
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        _volSetOpen?.(true);
      }, 120);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (window.innerWidth >= 1024) scheduleCloseVol();
  }, []);

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }, []);

  // Prevent closing when dragging
  useEffect(() => {
    if (draggingVertical) {
      cancelCloseVol();
      _volSetOpen?.(true);
    } else {
      // Once dragging stops, close if not hovering (easiest is to schedule a close, if they hover it'll cancel)
      if (window.innerWidth >= 1024) scheduleCloseVol(800); 
    }
  }, [draggingVertical]);

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
            toggleMute(); // On click desktop it just toggles mute
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-white hover:text-white/80 transition-colors flex items-center justify-center rounded-lg p-2"
        title="Volume"
      >
        <HugeiconsIcon
          icon={getVolumeIcon()}
          className="w-8 h-8 lg:w-10 lg:h-10 text-white transition-colors"
          strokeWidth={2}
        />
      </button>

      {createPortal(
        <div
          style={popupStyle}
          className={classNames(
            "absolute bottom-[88px] z-[300] w-[48px]",
            "flex flex-col rounded-2xl overflow-hidden py-4",
            "bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl",
            "transition-all duration-200 ease-out origin-bottom",
            isOpen || draggingVertical
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none",
          )}
          onMouseEnter={cancelCloseVol}
          onMouseLeave={() => {
             if (!draggingVertical) scheduleCloseVol();
          }}
        >
          <div className="flex flex-col items-center justify-center">
            {/* Volume Slider */}
            <div
              ref={refVertical}
              className="relative w-1.5 h-32 rounded-full bg-white/20 cursor-pointer touch-none group"
              onMouseDown={dragMouseDownVertical}
              onTouchStart={dragMouseDownVertical}
            >
              {/* Filled portion */}
              <div
                className="absolute inset-x-0 bottom-0 rounded-full bg-white transition-all will-change-[height]"
                style={{
                  height: percentageString,
                }}
              />
              {/* White knob */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-md transition-all will-change-[bottom]"
                style={{
                  bottom: `calc(${percentageString} - 8px)`,
                }}
              />
            </div>
            
            
          </div>
        </div>,
        portalEl,
      )}
    </div>
  );
}
