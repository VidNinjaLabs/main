import { RotateCcw, RotateCw } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { useControls } from "@/components/player/hooks/useControls";
import { Player } from "@/components/player";

export function PlayerCenterControls() {
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);
  const controls = useControls();

  const handleRewind = () => {
    controls.rewind(10);
  };

  const handleForward = () => {
    controls.forward(10);
  };

  // Don't show controls when loading
  if (isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center gap-12 md:gap-16 lg:gap-20 z-40 pointer-events-none">
      {/* Rewind 10s */}
      <button
        onClick={handleRewind}
        className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center transition-all pointer-events-auto group border border-white/10"
      >
        <div className="relative flex items-center justify-center">
          <RotateCcw className="w-6 h-6 md:w-7 md:h-7 lg:w-9 lg:h-9 text-white" />
          <span className="absolute text-xs md:text-sm font-bold text-white">
            10
          </span>
        </div>
      </button>

      {/* Play/Pause - Use existing Player.Pause component */}
      <div className="pointer-events-auto">
        <Player.Pause
          size="xl"
          className="scale-125 md:scale-150 lg:scale-[1.75]"
        />
      </div>

      {/* Forward 10s */}
      <button
        onClick={handleForward}
        className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center transition-all pointer-events-auto group border border-white/10"
      >
        <div className="relative flex items-center justify-center">
          <RotateCw className="w-6 h-6 md:w-7 md:h-7 lg:w-9 lg:h-9 text-white" />
          <span className="absolute text-xs md:text-sm font-bold text-white">
            10
          </span>
        </div>
      </button>
    </div>
  );
}
