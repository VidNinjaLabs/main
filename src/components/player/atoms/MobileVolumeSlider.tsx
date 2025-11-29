import { Volume1, Volume2, Volume as VolumeIcon, VolumeX } from "lucide-react";
import { useCallback, useRef } from "react";

import {
  makePercentage,
  makePercentageString,
  useProgressBar,
} from "@/hooks/useProgressBar";
import { usePlayerStore } from "@/stores/player/store";

import { useVolume } from "../hooks/useVolume";

interface MobileVolumeSliderProps {
  show: boolean;
}

export function MobileVolumeSlider(props: MobileVolumeSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const volume = usePlayerStore((s) => s.mediaPlaying.volume);
  const { setVolume, toggleMute } = useVolume();

  const commitVolume = useCallback(
    (percentage: number) => {
      setVolume(percentage);
    },
    [setVolume],
  );

  const { dragging, dragPercentage, dragMouseDown } = useProgressBar(
    ref,
    commitVolume,
    false,
    true, // vertical
  );

  const handleClick = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  let percentage = makePercentage(volume * 100);
  if (dragging) percentage = makePercentage(dragPercentage);
  const percentageString = makePercentageString(percentage);

  const getVolumeIcon = (volumeLevel: number) => {
    if (volumeLevel === 0) {
      return VolumeX;
    }
    if (volumeLevel > 0 && volumeLevel <= 0.33) {
      return VolumeIcon;
    }
    if (volumeLevel > 0.33 && volumeLevel <= 0.66) {
      return Volume1;
    }
    return Volume2;
  };

  const VolumeIconComponent = getVolumeIcon(percentage / 100);

  if (!props.show) return null;

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto">
      {/* Volume Icon Button */}
      <div className="p-2 text-white cursor-pointer" onClick={handleClick}>
        <VolumeIconComponent className="text-2xl" />
      </div>

      {/* Vertical Slider */}
      <div
        ref={ref}
        className="h-32 w-10 flex items-center justify-center"
        onMouseDown={dragMouseDown}
        onTouchStart={dragMouseDown}
      >
        <div className="relative w-1 h-28 rounded-full bg-gray-500 bg-opacity-50">
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center rounded-full bg-video-audio-set"
            style={{
              height: percentageString,
            }}
          >
            <div className="absolute w-3 h-3 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
