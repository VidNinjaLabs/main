import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { useControls } from "@/components/player/hooks/useControls";
import { Player } from "@/components/player";
import { SkipBackward, SkipForward } from "../atoms/Skips";

export function PlayerCenterControls() {
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);
  const isPaused = usePlayerStore((s) => s.mediaPlaying.isPaused);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const progress = usePlayerStore((s) => s.progress.time);
  const duration = usePlayerStore((s) => s.progress.duration);
  const controls = useControls();

  // Initial load: Hide all controls
  if (!hasPlayedOnce) return null;

  const togglePlay = () => {
    console.log("CenterControls: Toggling play", { isPaused });
    if (isPaused) play();
    else pause();
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

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
      {/* Mobile-only centered controls (Visible on Mobile + Tablet now) */}
      <div className="lg:hidden flex items-center gap-10 pointer-events-auto">
        <Player.SkipBackward size="lg" onAction={() => seekRelative(-10)} />

        <button
          onClick={togglePlay}
          className="text-white drop-shadow-md hover:scale-105 transition-transform rounded-full bg-white/10 p-3 backdrop-blur-sm"
        >
          {isPaused ? (
            <Play className="w-10 h-10 fill-white stroke-none ml-1" />
          ) : (
            <Pause className="w-10 h-10 fill-white stroke-none" />
          )}
        </button>

        <Player.SkipForward size="lg" onAction={() => seekRelative(10)} />
      </div>
    </div>
  );
}
