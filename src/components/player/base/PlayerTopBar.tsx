import { X } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { Player } from "@/components/player";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CaptionsButton } from "../atoms/CaptionsButton";
import { SettingsButton } from "../atoms/SettingsButton";
import { VolumeButton } from "../atoms/VolumeButton";
import { ServerSelector } from "../atoms/ServerSelector";

export function PlayerTopBar() {
  const meta = usePlayerStore((s) => s.meta);
  const isShow = meta?.type === "show";
  const { isMobile } = useIsMobile();
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);

  // Show minimal UI during initial load/buffering/seeking
  const showMinimalUI = isLoading || !hasPlayedOnce;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 grid grid-cols-3 items-center px-4 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
      {/* Left Side */}
      <div className="flex items-center gap-3 pointer-events-auto justify-start">
        {!showMinimalUI && !isMobile && <ServerSelector />}
        {!showMinimalUI && isMobile && <Player.BackLink url="/" />}
      </div>

      {/* Center: Title & Episode Info - Always centered, hidden on mobile */}
      <div className="flex flex-col items-center justify-center text-center px-6 min-w-0 pointer-events-none">
        {!showMinimalUI && !isMobile && (
          <>
            <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-white truncate max-w-full">
              {meta?.title || "Loading..."}
            </h1>
            {isShow && meta?.episode && (
              <p className="text-sm md:text-base text-white/80 truncate mt-1 max-w-full">
                Season {meta.season?.number}, Ep. {meta.episode.number}{" "}
                {meta.episode.title}
              </p>
            )}
          </>
        )}
      </div>

      {/* Right Side: Control Buttons */}
      <div className="flex items-center gap-4 md:gap-5 lg:gap-6 pointer-events-auto justify-end">
        {/* Episode List Button (TV Shows Only) - Hide during loading */}
        {!showMinimalUI && isShow && (
          <Player.Episodes
            inControl={true}
            iconSizeClass="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
          />
        )}

        {/* Desktop: All buttons - Hide during loading */}
        {!showMinimalUI && !isMobile && (
          <>
            <CaptionsButton />
            <SettingsButton />
            <VolumeButton />
            <Player.Chromecast iconSizeClass="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
            <div className="w-px h-8 bg-white/20 mx-1" />
          </>
        )}

        {/* Mobile: Simplified buttons - Hide during loading */}
        {!showMinimalUI && isMobile && <SettingsButton />}

        {/* PIP - Always visible */}
        {!isMobile && <Player.Pip size="md" />}

        {/* Close Button - Always visible */}
        <button
          onClick={() => window.history.back()}
          className="p-2 md:p-2.5 transition-colors group"
          title="Close"
        >
          <X className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white/70 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}
