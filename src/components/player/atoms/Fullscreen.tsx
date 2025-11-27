import { Maximize, Minimize } from "lucide-react";

import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";

export function Fullscreen(props: { iconSizeClass?: string }) {
  const { isFullscreen } = usePlayerStore((s) => s.interface);
  const display = usePlayerStore((s) => s.display);

  return (
    <VideoPlayerButton
      onClick={() => display?.toggleFullscreen()}
      icon={isFullscreen ? Minimize : Maximize}
      iconSizeClass={props.iconSizeClass}
    />
  );
}
