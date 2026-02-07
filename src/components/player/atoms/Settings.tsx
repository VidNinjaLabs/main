import { Settings02Icon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { OverlayAnchor } from "@/components/overlays/OverlayAnchor";
import { Overlay } from "@/components/overlays/OverlayDisplay";
import { OverlayPage } from "@/components/overlays/OverlayPage";
import { OverlayRouter } from "@/components/overlays/OverlayRouter";
import {
  EmbedSelectionView,
  SourceSelectionView,
} from "@/components/player/atoms/settings/SourceSelectingView";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";

import { AudioView } from "./settings/AudioView";
import { CaptionSettingsView } from "./settings/CaptionSettingsView";
import { CaptionsView } from "./settings/CaptionsView";
import { DownloadRoutes } from "./settings/Downloads";
import { PlaybackSettingsView } from "./settings/PlaybackSettingsView";
import { QualityView } from "./settings/QualityView";
import { SettingsMenu } from "./settings/SettingsMenu";

function SettingsOverlay({ id }: { id: string }) {
  const [chosenSourceId, setChosenSourceId] = useState<string | null>(null);
  const router = useOverlayRouter(id);

  // reset source id when going to home or closing overlay
  useEffect(() => {
    if (!router.isRouterActive) {
      setChosenSourceId(null);
    }
    if (router.route === "/") {
      setChosenSourceId(null);
    }
  }, [router.isRouterActive, router.route]);

  return (
    <Overlay id={id}>
      <OverlayRouter id={id}>
        <OverlayPage id={id} path="/" width={290} maxHeight={400}>
          <SettingsMenu id={id} />
        </OverlayPage>
        <OverlayPage id={id} path="/captions" width={280} maxHeight={500}>
          <Menu.CardWithScrollable>
            <CaptionsView id={id} backLink />
          </Menu.CardWithScrollable>
        </OverlayPage>
        {/* This is used by the captions shortcut in bottomControls of player */}
        <OverlayPage
          id={id}
          path="/captionsOverlay"
          width={300}
          maxHeight={500}
        >
          <Menu.CardWithScrollable>
            <CaptionsView id={id} />
          </Menu.CardWithScrollable>
        </OverlayPage>
        <OverlayPage
          id={id}
          path="/captions/settings"
          width={300}
          maxHeight={600}
        >
          <Menu.CardWithScrollable>
            <CaptionSettingsView id={id} />
          </Menu.CardWithScrollable>
        </OverlayPage>
        {/* This is used by the captions shortcut in bottomControls of player */}
        <OverlayPage
          id={id}
          path="/captions/settingsOverlay"
          width={300}
          maxHeight={600}
        >
          <Menu.CardWithScrollable>
            <CaptionSettingsView id={id} overlayBackLink />
          </Menu.CardWithScrollable>
        </OverlayPage>
        <OverlayPage id={id} path="/source" width={280} maxHeight={500}>
          <Menu.CardWithScrollable>
            <SourceSelectionView id={id} onChoose={setChosenSourceId} />
          </Menu.CardWithScrollable>
        </OverlayPage>
        <OverlayPage id={id} path="/source/embeds" width={280} maxHeight={510}>
          <Menu.CardWithScrollable>
            <EmbedSelectionView id={id} sourceId={chosenSourceId} />
          </Menu.CardWithScrollable>
        </OverlayPage>
        <DownloadRoutes id={id} />
      </OverlayRouter>
    </Overlay>
  );
}

export function SettingsRouter() {
  return <SettingsOverlay id="settings" />;
}

export function Settings(props: { size?: "sm" | "md" | "lg" | "xl" }) {
  const router = useOverlayRouter("settings");
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);

  useEffect(() => {
    setHasOpenOverlay(router.isRouterActive);
  }, [setHasOpenOverlay, router.isRouterActive]);

  return (
    <OverlayAnchor id={router.id}>
      <VideoPlayerButton onClick={() => router.open()}>
        <HugeiconsIcon
          icon={Settings02Icon}
          size={props.size || "md"}
          strokeWidth={2}
        />
      </VideoPlayerButton>
    </OverlayAnchor>
  );
}
