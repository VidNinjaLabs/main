import {
  Maximize,
  Minimize,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { Player } from "@/components/player";
import { PlayerHoverState } from "@/stores/player/slices/interface";
import { usePlayerStore } from "@/stores/player/store";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CaptionsButton } from "@/components/player/atoms/CaptionsButton";
import { QualityButton } from "@/components/player/atoms/QualityButton";
import { ServerSelector } from "@/components/player/atoms/ServerSelector";
import { SpeedButton } from "@/components/player/atoms/SpeedButton";
import { VolumeButton } from "@/components/player/atoms/VolumeButton";

export function PlayerBottomBar() {
  const meta = usePlayerStore((s) => s.meta);
  const isShow = meta?.type === "show";
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);
  const isPaused = usePlayerStore((s) => s.mediaPlaying.isPaused);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const progress = usePlayerStore((s) => s.progress.time);
  const duration = usePlayerStore((s) => s.progress.duration);
  const isFullscreen = usePlayerStore((s) => s.interface.isFullscreen);
  const display = usePlayerStore((s) => s.display);
  const hasOpenOverlay = usePlayerStore((s) => s.interface.hasOpenOverlay);

  // Hide bottom bar only during initial load
  const showMinimalUI = !hasPlayedOnce;
  const { isMobile } = useIsMobile();

  // Don't render anything during loading
  if (showMinimalUI) return null;

  const togglePlay = () => {
    console.log("Toggling play state", { isPaused });
    if (isPaused) play();
    else pause();
  };

  const toggleFullscreen = () => {
    if (display && display.toggleFullscreen) {
      display.toggleFullscreen();
    }
  };

  const seekRelative = (seconds: number) => {
    const newTime = progress + seconds;
    if (newTime < 0) {
      usePlayerStore.getState().display?.setTime(0);
    } else if (newTime > duration) {
      usePlayerStore.getState().display?.setTime(duration);
    } else {
      usePlayerStore.getState().display?.setTime(newTime);
    }
  };

  /* Reduced gradient height (pt-6) and padding (py-1) for mobile */
  return (
    <div
      onPointerMove={() => {
        usePlayerStore
          .getState()
          .updateInterfaceHovering(PlayerHoverState.MOUSE_HOVER);
      }}
      className="absolute bottom-0 left-0 right-0 z-50 px-2 md:px-6 lg:px-8 pb-3 lg:py-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-2 lg:pt-12 transition-opacity duration-200"
    >
      {/* Row 1: Progress Bar with Timestamps – hidden when episode panel open */}
      <div
        className={`pointer-events-auto mb-0.5 lg:mb-4 w-full flex items-center gap-3 transition-all duration-200 overflow-hidden ${
          hasOpenOverlay
            ? "opacity-0 pointer-events-none max-h-0 mb-0"
            : "opacity-100 max-h-20"
        }`}
      >
        {/* Current Time */}
        <div className="text-sm font-medium text-white/90 min-w-[35px] text-right">
          <Player.CurrentTime />
        </div>

        {/* Progress Bar - Flex Grow */}
        <div className="flex-1 group/progress">
          <Player.ProgressBar />
        </div>

        {/* Duration */}
        <div className="text-sm font-medium text-white/90 min-w-[35px]">
          <Player.Duration />
        </div>
      </div>

      {/* Row 2: Controls */}
      <div className="flex items-center justify-between pointer-events-auto pb-0 lg:pb-4">
        {/* Left Section (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="text-white hover:text-white/80 transition-colors flex items-center justify-center"
          >
            {isPaused ? (
              <Play className="w-8 h-8 lg:w-10 lg:h-10 fill-white" />
            ) : (
              <Pause className="w-8 h-8 lg:w-10 lg:h-10 fill-white" />
            )}
          </button>

          <Player.SkipBackward size="md" onAction={() => seekRelative(-10)} />

          <Player.SkipForward size="md" onAction={() => seekRelative(10)} />

          <VolumeButton />

          {/* Title Info (Desktop) - Single Line Layout */}
          <div className="flex items-center ml-4 gap-2 text-white/90">
            <h1 className="text-xl font-medium line-clamp-1 max-w-[600px] lg:max-w-[300px]">
              {meta?.title}
            </h1>
            {isShow && meta?.episode && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-sm text-white/80 line-clamp-1">
                  S{meta.season?.number}:E{meta.episode.number}{" "}
                  {meta.episode.title}
                </span>
                {meta.releaseYear && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-sm text-white/60">
                      {meta.releaseYear}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Center Section (Mobile Only - Playback Controls) */}
        {/* MOVED TO PlayerCenterControls.tsx as per new design */}

        {/* Center Section (Mobile Only - Spacer) */}
        {/* WE DO NOT NEED A SPACER IF WE WANT BUTTONS ON LEFT AND RIGHT. 
            But keeping it to push right controls to right. 
            Volume is now before it, so Volume [Spacer] [Right Controls] 
        */}
        <div className="flex lg:hidden flex-1" />

        {/* Right Section */}
        <div className="flex items-center gap-1 md:gap-4 justify-end">
          {isShow && (
            <Player.NextEpisodeButton
              inControl={true}
              controlsShowing={true}
              className="hidden lg:flex" // Keep hidden on mobile
            />
          )}

          {isShow && (
            <Player.Episodes
              inControl={true}
              iconSizeClass="w-8 h-8 lg:w-10 lg:h-10"
            />
          )}

          <CaptionsButton />

          {/* Controls - Visible on Mobile too now */}
          <div className="flex items-center gap-1 md:gap-4">
            <QualityButton />
            <ServerSelector />
            <SpeedButton />
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-white/80 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-8 h-8 lg:w-10 lg:h-10" />
            ) : (
              <Maximize className="w-8 h-8 lg:w-10 lg:h-10" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
