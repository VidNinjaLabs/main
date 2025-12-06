import classNames from "classnames";
import { ReactNode, useRef, useState } from "react";

import { Player } from "@/components/player";
import { SkipIntroButton } from "@/components/player/atoms/SkipIntroButton";
import { UnreleasedEpisodeOverlay } from "@/components/player/atoms/UnreleasedEpisodeOverlay";
import { WatchPartyStatus } from "@/components/player/atoms/WatchPartyStatus";
import { useShouldShowControls } from "@/components/player/hooks/useShouldShowControls";
import { useSkipTime } from "@/components/player/hooks/useSkipTime";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PlayerMeta, playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";
import { useWatchPartyStore } from "@/stores/watchParty";

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
  const { isHost, enabled } = useWatchPartyStore();

  const inControl = !enabled || isHost;

  const _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const _isPWA = window.matchMedia("(display-mode: standalone)").matches;

  const [isShifting, setIsShifting] = useState(false);
  const [isHoldingFullscreen, setIsHoldingFullscreen] = useState(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, setFeedbackAction] = useState<
    "play" | "pause" | "forward" | "backward" | null
  >(null);

  // Show backdrop during all loading states, hide only when video is playing
  const showBackdrop = status !== playerStatus.PLAYING;

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
  const skiptime = useSkipTime();

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
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        {props.children}

        <Player.BlackOverlay
          show={showTargets && status === playerStatus.PLAYING}
        />
        <Player.EpisodesRouter onChange={props.onMetaChange} />
        <Player.SettingsRouter />
        <Player.SubtitleView controlsShown={showTargets} />
        {/* TODO: ActionFeedback - needs keyboard support and refinement */}
        {/* <ActionFeedback
        action={feedbackAction}
        onComplete={() => setFeedbackAction(null)}
      /> */}

        {status === playerStatus.PLAYING ? (
          <Player.CenterControls>
            <Player.LoadingSpinner />
            <Player.AutoPlayStart />
            <Player.CastingNotification />
          </Player.CenterControls>
        ) : null}

        {/* Center Playback Controls - Visible only on small/medium screens */}
        <div className="lg:hidden">
          <Player.CenterMobileControls
            className="text-white"
            show={showTargets && status === playerStatus.PLAYING}
          >
            <Player.SkipBackward
              iconSizeClass="text-5xl"
              onAction={() => setFeedbackAction("backward")}
            />
            <Player.Pause
              iconSizeClass="text-6xl"
              className={isLoading ? "opacity-0" : "opacity-100"}
              onAction={(action) => setFeedbackAction(action)}
            />
            <Player.SkipForward
              iconSizeClass="text-5xl"
              onAction={() => setFeedbackAction("forward")}
            />
          </Player.CenterMobileControls>
        </div>

        <div
          className={`absolute right-4 z-50 transition-all duration-300 ease-in-out ${
            showTargets ? "top-16" : "top-1"
          }`}
        >
          <WatchPartyStatus />
        </div>

        <Player.TopControls show={showTargets}>
          <div
            className={classNames(
              "grid grid-cols-3 items-center",
              isMobile ? "mt-0" : "",
            )}
          >
            <div className="flex items-center justify-start">
              {!props.isStandalone && <Player.BackLink url={props.backUrl} />}
            </div>
            <div className="flex justify-center items-center text-center">
              <Player.Title />
            </div>
            <div className="flex items-center justify-end space-x-3">
              {status === playerStatus.PLAYING ? (
                <div className="flex lg:hidden items-center">
                  <Player.Airplay />
                  <Player.Chromecast />
                </div>
              ) : null}
            </div>
          </div>
        </Player.TopControls>

        <Player.BottomControls show={showTargets}>
          {status !== playerStatus.PLAYING && !manualSourceSelection && (
            <Tips />
          )}
          <div className="flex flex-col w-full">
            {/* Mobile Time Display - Above Progress Bar */}
            <div className="lg:hidden flex justify-end px-4">
              <Player.Time />
            </div>

            <div className="flex items-center justify-center space-x-3 h-full">
              {status === playerStatus.PLAYING ? <Player.ProgressBar /> : null}
            </div>
          </div>

          <div className="flex justify-between w-full" dir="ltr">
            <Player.LeftSideControls>
              {status === playerStatus.PLAYING ? (
                <>
                  {/* Desktop Playback Controls - Hidden on mobile */}
                  <div className="hidden lg:flex items-center">
                    <Player.Pause
                      iconSizeClass="text-4xl w-10 h-10 xl:text-5xl xl:w-12 xl:h-12"
                      onAction={(action) => setFeedbackAction(action)}
                    />
                    <Player.SkipBackward
                      iconSizeClass="text-4xl w-10 h-10 xl:text-5xl xl:w-12 xl:h-12"
                      onAction={() => setFeedbackAction("backward")}
                    />
                    <Player.SkipForward
                      iconSizeClass="text-4xl w-10 h-10 xl:text-5xl xl:w-12 xl:h-12"
                      onAction={() => setFeedbackAction("forward")}
                    />
                  </div>
                  <Player.Volume iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10" />
                  {/* Desktop Time Display - Hidden on mobile */}
                  <div className="hidden lg:block">
                    <Player.Time />
                  </div>
                </>
              ) : null}
            </Player.LeftSideControls>
            <div className="flex items-center space-x-2 xl:space-x-3">
              <Player.Episodes
                inControl={inControl}
                iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10"
              />
              <Player.SkipEpisodeButton
                inControl={inControl}
                onChange={props.onMetaChange}
                iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10"
              />
              {status === playerStatus.PLAYING ? (
                <>
                  <Player.Pip iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10" />
                  <Player.Airplay iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10" />
                  <Player.Chromecast iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10" />
                </>
              ) : null}
              {status === playerStatus.PLAYBACK_ERROR ||
              status === playerStatus.PLAYING ? (
                <Player.Captions iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10" />
              ) : null}
              {status === playerStatus.PLAYING && (
                <Player.Settings iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10" />
              )}
              {status === playerStatus.PLAYING &&
                (isShifting || isHoldingFullscreen ? (
                  <Player.Widescreen iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10" />
                ) : (
                  <Player.Fullscreen iconSizeClass="text-3xl w-8 h-8 xl:text-4xl xl:w-10 xl:h-10" />
                ))}
            </div>
          </div>
        </Player.BottomControls>

        <Player.VolumeChangedPopout />
        <Player.SubtitleDelayPopout />
        <Player.SpeedChangedPopout />
        <UnreleasedEpisodeOverlay />

        <Player.NextEpisodeButton
          controlsShowing={showTargets}
          onChange={props.onMetaChange}
          inControl={inControl}
        />

        <SkipIntroButton
          controlsShowing={showTargets}
          skipTime={skiptime}
          inControl={inControl}
        />
      </Player.Container>
    </div>
  );
}
