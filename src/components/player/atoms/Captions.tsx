import { Subtitles } from "lucide-react";
import { useEffect } from "react";

import { OverlayAnchor } from "@/components/overlays/OverlayAnchor";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";

export function Captions(props: { iconSizeClass?: string }) {
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
        icon={Subtitles}
        iconSizeClass={props.iconSizeClass}
      />
    </OverlayAnchor>
  );
}
