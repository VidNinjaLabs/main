import {
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute01Icon,
} from "@hugeicons/react";
import { Check } from "lucide-react";
import React, { useRef } from "react";
import { usePlayerStore } from "@/stores/player/store";
import { useVolume } from "../hooks/useVolume";
import {
  useProgressBar,
  makePercentage,
  makePercentageString,
} from "@/hooks/useProgressBar";
import { MobileOverlay } from "./MobileOverlay";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";

interface MobileAudioListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileAudioList({ isOpen, onClose }: MobileAudioListProps) {
  const volume = usePlayerStore((s) => s.mediaPlaying.volume);
  const { setVolume } = useVolume();

  const commitVolume = (percentage: number) => {
    setVolume(percentage);
  };

  const refHorizontal = useRef<HTMLDivElement>(null);
  const { dragging, dragPercentage, dragMouseDown } = useProgressBar(
    refHorizontal,
    commitVolume,
    true, // commitImmediately
    false, // vertical=false for mobile horizontal slider
  );

  let percentage = makePercentage(volume * 100);
  if (dragging) percentage = makePercentage(dragPercentage);
  const percentageString = makePercentageString(percentage);

  // Icon state
  const volState =
    percentage === 0 ? "mute" : percentage <= 50 ? "medium" : "full";
  const getVolumeIcon = () => {
    if (volState === "mute") return VolumeMute01Icon;
    if (volState === "medium") return VolumeLowIcon;
    return VolumeHighIcon;
  };

  return (
    <MobileOverlay isOpen={isOpen} onClose={onClose} title="Volume & Sound">
      <div className="p-4 space-y-6">
        {/* Volume Slider */}
        <div className="flex items-center gap-4">
          <button onClick={() => setVolume(0)}>
            <HugeiconsIcon
              icon={getVolumeIcon()}
              size="md"
              className="text-white"
            />
          </button>

          <div
            ref={refHorizontal}
            className="relative flex-1 h-8 flex items-center cursor-pointer touch-none"
            onMouseDown={dragMouseDown}
            onTouchStart={dragMouseDown}
          >
            {/* Track */}
            <div className="w-full h-1.5 bg-white/20 rounded-full" />

            {/* Fill */}
            <div
              className="absolute left-0 h-1.5 bg-white rounded-full transition-all will-change-[width]"
              style={{ width: percentageString }}
            />

            {/* Knob */}
            <div
              className="absolute h-5 w-5 bg-white rounded-full shadow-lg transition-all will-change-[left]"
              style={{ left: `calc(${percentageString} - 10px)` }}
            />
          </div>

          <span className="text-white font-mono w-10 text-right">
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Boost Logic? User asked for "Sound". Usually just Volume. */}
        {/* If we had Audio Boost, it would go here. */}
      </div>
    </MobileOverlay>
  );
}
