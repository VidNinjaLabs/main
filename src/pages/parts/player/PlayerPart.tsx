import classNames from "classnames";
import { ReactNode, useEffect, useRef, useState } from "react";

import { Player } from "@/components/player";
import { UnreleasedEpisodeOverlay } from "@/components/player/atoms/UnreleasedEpisodeOverlay";
import { useShouldShowControls } from "@/components/player/hooks/useShouldShowControls";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PlayerMeta, playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

import { Tips } from "./ScrapingPart";

export interface PlayerPartProps {
  children?: ReactNode;
  backUrl: string;
  onLoad?: () => void;
  onMetaChange?: (meta: PlayerMeta) => void;
  backdropUrl?: string | null;
  isStandalone?: boolean;
}

export function PlayerPart(props: PlayerPartProps) {
  const { showTargets } = useShouldShowControls();
  const status = usePlayerStore((s) => s.status);
  const { isMobile } = useIsMobile();
  const manualSourceSelection = usePreferencesStore(
    (s) => s.manualSourceSelection,
  );
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);
  // const { isHost, enabled } = useWatchPartyStore(); // Removed

  const inControl = true; // Always in control as watchparty is removed

  const _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const _isPWA = window.matchMedia("(display-mode: standalone)").matches;

  const [isShifting, setIsShifting] = useState(false);
  const [isHoldingFullscreen, setIsHoldingFullscreen] = useState(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, setFeedbackAction] = useState<
    "play" | "pause" | "forward" | "backward" | null
  >(null);

  // Track if video has ever started playing to distinguish initial load from mid-playback buffering
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Once video starts playing (not loading), mark it
  useEffect(() => {
    if (status === playerStatus.PLAYING && !isLoading) {
      setHasStartedPlaying(true);
    }
  }, [status, isLoading]);

  // Reset when status goes back to non-playing states (new media)
  useEffect(() => {
    if (status !== playerStatus.PLAYING) {
      setHasStartedPlaying(false);
    }
  }, [status]);

  // Show backdrop only during initial loading, not mid-playback buffering
  const showBackdrop = !hasStartedPlaying;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Shift") {
      setIsShifting(true);
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Shift") {
      setIsShifting(false);
    }
  });

  const _handleTouchStart = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    holdTimeoutRef.current = setTimeout(() => {
      setIsHoldingFullscreen(true);
    }, 100);
  };

  const _handleTouchEnd = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    holdTimeoutRef.current = setTimeout(() => {
      setIsHoldingFullscreen(false);
    }, 1000);
  };

  return (
    <div className="relative">
      <Player.Container onLoad={props.onLoad} showingControls={showTargets}>
        {/* Persistent Backdrop Layer */}
        {props.backdropUrl && showBackdrop && (
          <div className="absolute inset-0 overflow-hidden z-0">
            <img
              src={props.backdropUrl}
              className="absolute inset-0 w-full h-full object-cover scale-110"
              alt=""
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        )}

        {props.children}
        <Player.EpisodesRouter onChange={props.onMetaChange} />
        <Player.SettingsRouter />
        <Player.SubtitleView controlsShown={showTargets} />
        {/* TODO: ActionFeedback - needs keyboard support and refinement */}
        {/* <ActionFeedback
        action={feedbackAction}
        onComplete={() => setFeedbackAction(null)}
      /> */}

        {/* Netflix-Style Player Controls */}
        {status === playerStatus.PLAYING && (
          <>
            {/* Top Bar - Always visible when controls shown */}
            {showTargets && <Player.PlayerTopBar />}

            {/* Center Controls - Large play/pause with skip buttons */}
            {showTargets && <Player.PlayerCenterControls />}

            {/* Bottom Bar - Progress + Time + Next Episode */}
            {showTargets && <Player.PlayerBottomBar />}

            {/* Loading Spinner & Casting Notification (Center) */}
            <Player.CenterControls>
              <Player.LoadingSpinner />
              <Player.CastingNotification />
            </Player.CenterControls>
          </>
        )}

        <Player.VolumeChangedPopout />
        <Player.SubtitleDelayPopout />
        <Player.SpeedChangedPopout />
        <UnreleasedEpisodeOverlay />

        <Player.NextEpisodeButton
          controlsShowing={showTargets}
          onChange={props.onMetaChange}
          inControl={inControl}
        />
      </Player.Container>
    </div>
  );
}
