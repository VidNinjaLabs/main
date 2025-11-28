import { Pause as PauseIcon, Play } from "lucide-react";

import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";

export function Pause(props: {
  iconSizeClass?: string;
  className?: string;
  onAction?: (action: "play" | "pause") => void;
}) {
  const display = usePlayerStore((s) => s.display);
  const { isPaused } = usePlayerStore((s) => s.mediaPlaying);

  const toggle = () => {
    if (isPaused) {
      display?.play();
      props.onAction?.("play");
    } else {
      display?.pause();
      props.onAction?.("pause");
    }
  };

  return (
    <VideoPlayerButton
      className={props.className}
      iconSizeClass={props.iconSizeClass}
      onClick={toggle}
      icon={isPaused ? Play : PauseIcon}
    />
  );
}
