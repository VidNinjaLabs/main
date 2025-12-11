import { PictureInPictureOnIcon } from "@hugeicons/react";

import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";
import {
  canPictureInPicture,
  canWebkitPictureInPicture,
} from "@/utils/detectFeatures";

export function Pip(props: { size?: "sm" | "md" | "lg" | "xl" }) {
  const display = usePlayerStore((s) => s.display);

  if (!canPictureInPicture() && !canWebkitPictureInPicture()) return null;

  return (
    <VideoPlayerButton onClick={() => display?.togglePictureInPicture()}>
      <HugeiconsIcon
        icon={PictureInPictureOnIcon}
        size={props.size || "md"}
        strokeWidth={2}
      />
    </VideoPlayerButton>
  );
}
