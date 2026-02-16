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
import { Popover } from "@/components/ui/Popover";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";

export function VolumeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const volume = usePlayerStore((s) => s.mediaPlaying.volume);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const { setVolume } = useVolume();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setHasOpenOverlay(open);
  };

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
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <Popover.Trigger asChild>
        <button
          className="p-1 md:p-2 transition-colors group outline-none rounded-md focus-visible:ring-2 focus-visible:ring-white/20"
          title="Volume"
        >
          <HugeiconsIcon
            icon={getVolumeIcon()}
            size="md"
            className="w-8 h-8 lg:w-10 lg:h-10 text-white transition-colors"
            strokeWidth={2}
          />
        </button>
      </Popover.Trigger>
      <Popover.Content
        side="top"
        align="center"
        sideOffset={8}
        className="!w-10 !min-w-0 py-3 px-0"
      >
        <div className="flex flex-col items-center justify-center">
          {/* Volume Slider */}
          <div
            ref={refVertical}
            className="relative w-0.5 h-24 rounded-full bg-white/30 cursor-pointer touch-none"
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
              className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md transition-all will-change-[bottom]"
              style={{
                bottom: `calc(${percentageString} - 5px)`,
              }}
            />
          </div>

          {/* Volume percentage */}
          <div className="text-center mt-2">
            <span className="text-white/80 text-[10px] font-medium tabular-nums">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
