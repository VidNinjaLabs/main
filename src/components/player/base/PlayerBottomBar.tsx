import { Player } from "@/components/player";
import { PlayerHoverState } from "@/stores/player/slices/interface";
import { usePlayerStore } from "@/stores/player/store";

export function PlayerBottomBar() {
  const meta = usePlayerStore((s) => s.meta);
  const isShow = meta?.type === "show";
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);

  // Hide bottom bar only during initial load
  const showMinimalUI = !hasPlayedOnce;

  // Don't render anything during loading
  if (showMinimalUI) return null;

  return (
    <div
      onPointerMove={() => {
        usePlayerStore
          .getState()
          .updateInterfaceHovering(PlayerHoverState.MOUSE_HOVER);
      }}
      className="absolute bottom-0 left-0 right-0 z-50 px-4 md:px-3 lg:px-8 py-4 md:py-3 pointer-events-none"
    >
      {/* Progress Bar with horizontal padding */}
      <div className="pointer-events-auto mb-3 md:mb-2">
        <Player.ProgressBar />
      </div>

      {/* Time below progress bar and Next Episode */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="text-sm md:text-base font-medium text-white/90">
          <Player.Time />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isShow && (
            <Player.SkipEpisodeButton
              iconSizeClass="w-5 h-5 md:w-[25px] md:h-[25px]"
              inControl={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
