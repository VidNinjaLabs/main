import classNames from "classnames";
import { ReactNode, useEffect, useRef, useState } from "react";

import { Icon, Icons } from "@/components/Icon";
import { Player } from "@/components/player";
import { MobileVolumeSlider } from "@/components/player/atoms/MobileVolumeSlider";
import { SkipIntroButton } from "@/components/player/atoms/SkipIntroButton";
import { UnreleasedEpisodeOverlay } from "@/components/player/atoms/UnreleasedEpisodeOverlay";
import { WatchPartyStatus } from "@/components/player/atoms/WatchPartyStatus";
import { useShouldShowControls } from "@/components/player/hooks/useShouldShowControls";
import { useSkipTime } from "@/components/player/hooks/useSkipTime";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { PlayerMeta, playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";
import { useWatchPartyStore } from "@/stores/watchParty";

import { Tips } from "./ScrapingPart";

// Helper components for mobile controls with clickable labels
function EpisodesButton({ inControl }: { inControl: boolean }) {
  const router = useOverlayRouter("episodes");
  const type = usePlayerStore((s) => s.meta?.type);

  if (type !== "show" || !inControl) return null;

  return (
    <button
      type="button"
      onClick={() => router.open()}
      className="flex flex-row items-center"
    >
      <Icon icon={Icons.EPISODES} className="text-2xl" />
      <span className="text-sm text-white">Episodes</span>
    </button>
  );
}

function CaptionsButton() {
  const router = useOverlayRouter("settings");
  return (
    <div
      onClick={() => router.open("/captionsOverlay")}
      className="flex flex-row items-center cursor-pointer"
    >
      <Player.Captions iconSizeClass="text-2xl" />
      <span className="text-sm text-white">Subtitle</span>
    </div>
  );
}

function SettingsButton() {
  const router = useOverlayRouter("settings");
  return (
    <div
      onClick={() => router.open()}
      className="flex flex-row items-center cursor-pointer"
    >
      <Player.Settings iconSizeClass="text-2xl" />
      <span className="text-sm text-white">Settings</span>
    </div>
  );
}

export interface PlayerPartProps {
  children?: ReactNode;
  backUrl: string;
  onLoad?: () => void;
  onMetaChange?: (meta: PlayerMeta) => void;
  backdropUrl?: string | null;
}

export function PlayerPart(props: PlayerPartProps) {
  const { showTargets, showTouchTargets } = useShouldShowControls();
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

  const display = usePlayerStore((s) => s.display);

  // Auto-rotate to landscape on mobile mount
  useEffect(() => {
    if (isMobile && display) {
      display.toggleFullscreen();
      // Attempt to lock orientation to landscape
      const orientation = window.screen?.orientation as any;
      if (orientation && orientation.lock) {
        orientation.lock("landscape").catch(() => {
          // Orientation lock failed, likely not supported or permission denied
          // We can silently ignore this as it's a progressive enhancement
        });
      }
    }
  }, [isMobile, display]);

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

        {/* Mobile Volume Slider */}
        {isMobile && status === playerStatus.PLAYING && (
          <MobileVolumeSlider show={showTargets} />
        )}

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

        <Player.CenterMobileControls
          className="text-white"
          show={showTouchTargets && status === playerStatus.PLAYING}
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
              <Player.BackLink url={props.backUrl} />
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
          <div className="flex items-center justify-center space-x-3 h-full">
            {status === playerStatus.PLAYING ? (
              <>
                <Player.ProgressBar />
                {isMobile ? <Player.Time short /> : null}
              </>
            ) : null}
          </div>
          <div className="hidden lg:flex justify-between" dir="ltr">
            <Player.LeftSideControls>
              {status === playerStatus.PLAYING ? (
                <>
                  <Player.Pause
                    iconSizeClass="text-5xl w-12 h-12"
                    onAction={(action) => setFeedbackAction(action)}
                  />
                  <Player.SkipBackward
                    iconSizeClass="text-5xl w-12 h-12"
                    onAction={() => setFeedbackAction("backward")}
                  />
                  <Player.SkipForward
                    iconSizeClass="text-5xl w-12 h-12"
                    onAction={() => setFeedbackAction("forward")}
                  />
                  <Player.Volume iconSizeClass="text-5xl w-12 h-12" />
                  <Player.Time />
                </>
              ) : null}
            </Player.LeftSideControls>
            <div className="flex items-center space-x-3">
              <Player.Episodes
                inControl={inControl}
                iconSizeClass="text-5xl w-12 h-12"
              />
              <Player.SkipEpisodeButton
                inControl={inControl}
                onChange={props.onMetaChange}
                iconSizeClass="text-5xl w-12 h-12"
              />
              {status === playerStatus.PLAYING ? (
                <>
                  <Player.Pip iconSizeClass="text-5xl w-12 h-12" />
                  <Player.Airplay iconSizeClass="text-5xl w-12 h-12" />
                  <Player.Chromecast iconSizeClass="text-5xl w-12 h-12" />
                </>
              ) : null}
              {status === playerStatus.PLAYBACK_ERROR ||
              status === playerStatus.PLAYING ? (
                <Player.Captions iconSizeClass="text-5xl w-12 h-12" />
              ) : null}
              {status === playerStatus.PLAYING && (
                <Player.Settings iconSizeClass="text-5xl w-12 h-12" />
              )}
              {status === playerStatus.PLAYING &&
                (isShifting || isHoldingFullscreen ? (
                  <Player.Widescreen iconSizeClass="text-5xl w-12 h-12" />
                ) : (
                  <Player.Fullscreen iconSizeClass="text-5xl w-12 h-12" />
                ))}
            </div>
          </div>
          {status === playerStatus.PLAYING && (
            <div className="flex justify-between items-center gap-6 lg:hidden px-4">
              <div className="flex justify-center items-center gap-6">
                {/* Episodes - Only show for TV shows */}
                <EpisodesButton inControl={inControl} />
                {/* Captions */}
                <CaptionsButton />
              </div>
              {/* Settings and Fullscreen - Right corner */}
              <div className="flex items-center gap-6">
                <SettingsButton />
                <Player.Fullscreen iconSizeClass="text-2xl" />
              </div>
            </div>
          )}
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
