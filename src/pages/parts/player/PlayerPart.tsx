import { ReactNode, useRef, useState } from "react";

import { BrandPill } from "@/components/layout/BrandPill";
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

import { ScrapingPartInterruptButton, Tips } from "./ScrapingPart";

export interface PlayerPartProps {
  children?: ReactNode;
  backUrl: string;
  onLoad?: () => void;
  onMetaChange?: (meta: PlayerMeta) => void;
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

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;

  const [isShifting, setIsShifting] = useState(false);
  const [isHoldingFullscreen, setIsHoldingFullscreen] = useState(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleTouchStart = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    holdTimeoutRef.current = setTimeout(() => {
      setIsHoldingFullscreen(true);
    }, 100);
  };

  const handleTouchEnd = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    holdTimeoutRef.current = setTimeout(() => {
      setIsHoldingFullscreen(false);
    }, 1000);
  };

  const skiptime = useSkipTime();

  return (
    <Player.Container onLoad={props.onLoad} showingControls={showTargets}>
      {props.children}
      <Player.BlackOverlay
        show={showTargets && status === playerStatus.PLAYING}
      />
      <Player.EpisodesRouter onChange={props.onMetaChange} />
      <Player.SettingsRouter />
      <Player.SubtitleView controlsShown={showTargets} />

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
        <Player.SkipBackward iconSizeClass="text-3xl" />
        <Player.Pause
          iconSizeClass="text-5xl"
          className={isLoading ? "opacity-0" : "opacity-100"}
        />
        <Player.SkipForward iconSizeClass="text-3xl" />
      </Player.CenterMobileControls>

      <div
        className={`absolute right-4 z-50 transition-all duration-300 ease-in-out ${
          showTargets ? "top-16" : "top-1"
        }`}
      >
        <WatchPartyStatus />
      </div>

      <Player.TopControls show={showTargets}>
        <div className="grid grid-cols-3 items-center">
          <div className="flex items-center justify-start">
            <Player.BackLink url={props.backUrl} />
          </div>
          <div className="flex justify-center items-center text-center">
            <Player.Title />
          </div>
          <div className="flex items-center justify-end space-x-3">
            <Player.InfoButton />
            <Player.BookmarkButton />
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
        {status !== playerStatus.PLAYING && !manualSourceSelection && <Tips />}
        <div className="flex items-center justify-center space-x-3 h-full">
          {status === playerStatus.PLAYING ? (
            <>
              {isMobile ? <Player.Time short /> : null}
              <Player.ProgressBar />
            </>
          ) : null}
        </div>
        <div className="hidden lg:flex justify-between" dir="ltr">
          <Player.LeftSideControls>
            {status === playerStatus.PLAYING ? (
              <>
                <Player.Pause iconSizeClass="text-5xl w-12 h-12" />
                <Player.SkipBackward iconSizeClass="text-5xl w-12 h-12" />
                <Player.SkipForward iconSizeClass="text-5xl w-12 h-12" />
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
            <Player.Settings iconSizeClass="text-5xl w-12 h-12" />
            {isShifting || isHoldingFullscreen ? (
              <Player.Widescreen iconSizeClass="text-5xl w-12 h-12" />
            ) : (
              <Player.Fullscreen iconSizeClass="text-5xl w-12 h-12" />
            )}
          </div>
        </div>
        <div className="grid grid-cols-[2.5rem,1fr,2.5rem] gap-3 lg:hidden">
          <div />
          <div className="flex justify-center space-x-3">
            {/* Disable PiP for iOS PWA */}
            {!(isPWA && isIOS) && status === playerStatus.PLAYING && (
              <Player.Pip />
            )}
            <Player.Episodes inControl={inControl} />
            {status === playerStatus.PLAYING ? (
              <div className="hidden ssm:block">
                <Player.Captions />
              </div>
            ) : null}
            <Player.Settings />
          </div>
          <div>
            {status === playerStatus.PLAYING && (
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="select-none touch-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {isHoldingFullscreen ? (
                  <Player.Widescreen />
                ) : (
                  <Player.Fullscreen />
                )}
              </div>
            )}
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
  );
}
