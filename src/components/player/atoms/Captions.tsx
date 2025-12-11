import { OpenCaptionIcon } from "@hugeicons/react";
import { useEffect } from "react";

import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { OverlayAnchor } from "@/components/overlays/OverlayAnchor";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";

export function Captions(props: { size?: "sm" | "md" | "lg" | "xl" }) {
  const router = useOverlayRouter("settings");
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);

  useEffect(() => {
    setHasOpenOverlay(router.isRouterActive);
  }, [setHasOpenOverlay, router.isRouterActive]);

  return (
    <OverlayAnchor id={router.id}>
      <VideoPlayerButton
        onClick={() => {
          router.open();
          router.navigate("/captionsOverlay");
        }}
      >
        <HugeiconsIcon
          icon={OpenCaptionIcon}
          size={props.size || "md"}
          strokeWidth={2}
        />
      </VideoPlayerButton>
    </OverlayAnchor>
  );
}
