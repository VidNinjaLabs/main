import {
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute01Icon,
} from "@hugeicons/react";
import { useState, useCallback, useRef } from "react";
import { usePlayerStore } from "@/stores/player/store";
import { useVolume } from "../hooks/useVolume";
import {
  useProgressBar,
  makePercentage,
  makePercentageString,
} from "@/hooks/useProgressBar";
import { Popover } from "../base/Popover";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";

export function VolumeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const volume = usePlayerStore((s) => s.mediaPlaying.volume);
  const { setVolume } = useVolume();

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

  return (
    <Popover
      trigger={
        <button
          className="p-2 md:p-2.5 transition-colors group"
          title="Volume"
          onClick={() => setIsOpen(!isOpen)}
        >
          <HugeiconsIcon
            icon={getVolumeIcon()}
            size="md"
            className="text-white/70 group-hover:text-white transition-colors"
            strokeWidth={2}
          />
        </button>
      }
      content={
        <div className="w-12 py-4">
          {/* Volume Slider */}
          <div className="flex items-center justify-center">
            <div
              ref={refVertical}
              className="relative w-1.5 h-32 rounded-full bg-gray-600 cursor-pointer"
              onMouseDown={dragMouseDownVertical}
              onTouchStart={dragMouseDownVertical}
            >
              {/* Filled portion */}
              <div
                className="absolute inset-x-0 bottom-0 rounded-full bg-white transition-all"
                style={{
                  height: percentageString,
                }}
              />
              {/* White knob */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg transition-all"
                style={{
                  bottom: `calc(${percentageString} - 7px)`,
                }}
              />
            </div>
          </div>

          {/* Volume percentage */}
          <div className="text-center mt-3">
            <span className="text-white text-xs font-medium">
              {Math.round(percentage)}%
            </span>
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
