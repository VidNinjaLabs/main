/* eslint-disable react/button-has-type */
import classNames from "classnames";
import { Check, Settings2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Popover } from "@/components/ui/Popover";
import { usePlayerStore } from "@/stores/player/store";

import { usePopupPosition } from "./usePopupPosition";

function getPlayerPortalElement(): HTMLElement {
  return (
    document.getElementById("vidninja-portal-mount") ||
    document.getElementById("vidninja-player-container") ||
    document.body
  );
}

// Smart Quality Mapping logic
type SmartQuality = { label: string; value: string; desc: string };

function deriveSmartQualities(qualities: string[]): SmartQuality[] {
  let hasAuto = false;
  let autoValue = "unknown";

  const numQualities: { q: string; res: number }[] = [];
  const otherQualities: string[] = [];

  for (const q of qualities) {
    const lower = q.toLowerCase();
    if (lower === "unknown" || lower === "auto") {
      hasAuto = true;
      autoValue = q;
      continue;
    }
    const match = lower.match(/(\d+)/);
    if (match) {
      numQualities.push({ q, res: parseInt(match[1], 10) });
    } else {
      otherQualities.push(q);
    }
  }

  // Sort descending by resolution
  numQualities.sort((a, b) => b.res - a.res);

  let fourK: (typeof numQualities)[0] | null = null;
  let hd: (typeof numQualities)[0] | null = null;
  let good: (typeof numQualities)[0] | null = null;
  let dataSave: (typeof numQualities)[0] | null = null;

  for (const item of numQualities) {
    if (item.res >= 2160) {
      if (!fourK) fourK = item;
    } else if (item.res >= 1080) {
      if (!hd) hd = item;
    } else if (item.res >= 720) {
      if (!good) good = item;
    } else {
      dataSave = item; // Overwrite continually to get the absolute lowest
    }
  }

  const result: SmartQuality[] = [];

  if (hasAuto)
    result.push({
      label: "Auto",
      value: autoValue,
      desc: "Adjusts dynamically",
    });
  if (fourK)
    result.push({ label: "4K", value: fourK.q, desc: "Ultra High Definition" });
  if (hd) result.push({ label: "HD", value: hd.q, desc: "High Definition" });
  if (good)
    result.push({ label: "Good", value: good.q, desc: "Standard Definition" });
  if (dataSave)
    result.push({
      label: "Data Save",
      value: dataSave.q,
      desc: "Reduced bandwidth",
    });

  for (const q of otherQualities) {
    result.push({
      label: q.charAt(0).toUpperCase() + q.slice(1),
      value: q,
      desc: "Video Quality",
    });
  }

  return result;
}

function getCategoryForQuality(quality: string | null): string {
  if (!quality) return "Auto";
  const lower = quality.toLowerCase();

  if (lower === "unknown" || lower === "auto") return "Auto";

  const match = lower.match(/(\d+)/);
  if (match) {
    const res = parseInt(match[1], 10);
    if (res >= 2160) return "4K";
    if (res >= 1080) return "HD";
    if (res >= 720) return "Good";
    return "Data Save";
  }

  return quality.charAt(0).toUpperCase() + quality.slice(1);
}

let _qualitySetOpen: ((v: boolean) => void) | null = null;
let _qualityCloseTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCloseQuality(delayMs = 300) {
  if (_qualityCloseTimer) clearTimeout(_qualityCloseTimer);
  _qualityCloseTimer = setTimeout(() => {
    _qualitySetOpen?.(false);
    _qualityCloseTimer = null;
  }, delayMs);
}
function cancelCloseQuality() {
  if (_qualityCloseTimer) {
    clearTimeout(_qualityCloseTimer);
    _qualityCloseTimer = null;
  }
}

export function QualityButton() {
  const qualities = usePlayerStore((s) => s.qualities);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const switchQuality = usePlayerStore((s) => s.switchQuality);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupStyle = usePopupPosition(anchorRef, isOpen, 260);

  const smartQualities = deriveSmartQualities(qualities);
  const currentCategory = getCategoryForQuality(currentQuality);

  useEffect(() => {
    _qualitySetOpen = (v) => {
      setIsOpen(v);
      setHasOpenOverlay(v);
    };
    return () => {
      _qualitySetOpen = null;
    };
  }, [setHasOpenOverlay]);

  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 1024) {
      cancelCloseQuality();
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        _qualitySetOpen?.(true);
      }, 120);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (window.innerWidth >= 1024) scheduleCloseQuality();
  }, []);

  useEffect(
    () => () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    },
    [],
  );

  if (qualities.length === 0) return null;

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
            cancelCloseQuality();
            setIsOpen(true);
            setHasOpenOverlay(true);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-white hover:text-white/80 transition-colors flex items-center justify-center rounded-lg p-2"
        title="Quality"
      >
        <Settings2 className="w-8 h-8 lg:w-10 lg:h-10" />
      </button>

      {createPortal(
        <div
          style={popupStyle}
          className={classNames(
            "absolute bottom-[88px] z-[300] min-w-[220px] max-w-[320px]",
            "flex flex-col rounded-2xl overflow-hidden",
            "bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl",
            "transition-all duration-200 ease-out origin-bottom",
            isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none",
          )}
          onMouseEnter={cancelCloseQuality}
          onMouseLeave={() => scheduleCloseQuality()}
        >
          {/* Quality list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {smartQualities.map(({ label, value, desc }) => {
              const isSelected = label === currentCategory;
              return (
                <div
                  key={label}
                  onClick={() => {
                    switchQuality(value as any);
                    setIsOpen(false);
                    setHasOpenOverlay(false);
                  }}
                  className={classNames(
                    "flex items-center gap-2 p-2.5 cursor-pointer hover:bg-white/5 transition-colors",
                    isSelected ? "text-white" : "text-white/70",
                  )}
                >
                  <div className="w-5 flex-shrink-0 flex items-center justify-center">
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-lg font-semibold leading-[1.1]">
                      {label}
                    </span>
                    {desc && (
                      <span className="text-white/40 text-sm mt-0.5">
                        {desc}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        portalEl,
      )}
    </div>
  );
}
