import { RotateCcw, RotateCw } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { useControls } from "@/components/player/hooks/useControls";
import { Player } from "@/components/player";
import { SkipBackward, SkipForward } from "../atoms/Skips";

export function PlayerCenterControls() {
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);
  const controls = useControls();

  // Initial load: Hide all controls
  if (!hasPlayedOnce) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center gap-16 md:gap-24 lg:gap-32 z-40 pointer-events-none">
      {/* Rewind 10s */}
      <div className="pointer-events-auto">
        <SkipBackward size="xl" />
      </div>

      {/* Play/Pause - Hide during buffering/seeking so spinner can show */}
      <div className="pointer-events-auto w-24 h-24 flex items-center justify-center">
        {!isLoading && <Player.Pause size="xl" className="" />}
      </div>

      {/* Forward 10s */}
      <div className="pointer-events-auto">
        <SkipForward size="xl" />
      </div>
    </div>
  );
}
