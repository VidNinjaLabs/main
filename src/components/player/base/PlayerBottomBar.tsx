import { Player } from "@/components/player";
import { usePlayerStore } from "@/stores/player/store";

export function PlayerBottomBar() {
  const meta = usePlayerStore((s) => s.meta);
  const isShow = meta?.type === "show";

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 px-4 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
      {/* Progress Bar with horizontal padding */}
      <div className="pointer-events-auto mb-2">
        <Player.ProgressBar />
      </div>

      {/* Time below progress bar and Next Episode */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="text-base md:text-lg lg:text-xl text-white font-medium">
          <Player.Time />
        </div>

        {isShow && (
          <Player.SkipEpisodeButton
            iconSizeClass="text-sm md:text-base"
            inControl={true}
          />
        )}
      </div>
    </div>
  );
}
