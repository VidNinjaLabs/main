import { PictureInPictureOnIcon } from "@hugeicons/react";

import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePlayerStore } from "@/stores/player/store";
import {
  canPictureInPicture,
  canWebkitPictureInPicture,
} from "@/utils/detectFeatures";

export function Pip(props: { size?: "sm" | "md" | "lg" | "xl" }) {
  const display = usePlayerStore((s) => s.display);
  const { isMobile } = useIsMobile();

  // Hide PiP on mobile devices
  if (isMobile) return null;

  if (!canPictureInPicture() && !canWebkitPictureInPicture()) return null;

  return (
    <VideoPlayerButton
      onClick={() => display?.togglePictureInPicture()}
      className="text-white transition-colors"
    >
      <HugeiconsIcon
        icon={PictureInPictureOnIcon}
        size={props.size || "md"}
        strokeWidth={2}
      />
    </VideoPlayerButton>
  );
}
