/* eslint-disable import/no-extraneous-dependencies */
import { PauseIcon, PlayIcon } from "@hugeicons/react";

import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";

export type PauseAction = "play" | "pause";

export function Pause(props: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onAction?: (action: PauseAction) => void;
}) {
  const isPaused = usePlayerStore((s) => s.mediaPlaying.isPaused);
  const display = usePlayerStore((s) => s.display);

  const togglePause = () => {
    if (isPaused) {
      display?.play();
      props.onAction?.("play");
    } else {
      display?.pause();
      props.onAction?.("pause");
    }
  };

  return (
    <VideoPlayerButton onClick={togglePause} className={props.className}>
      <HugeiconsIcon
        icon={isPaused ? PlayIcon : PauseIcon}
        size={props.size || "lg"}
        strokeWidth={2}
      />
    </VideoPlayerButton>
  );
}
