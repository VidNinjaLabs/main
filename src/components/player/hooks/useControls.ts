import { usePlayerStore } from "@/stores/player/store";

export function useControls() {
  const display = usePlayerStore((s) => s.display);
  const time = usePlayerStore((s) => s.progress.time);
  const duration = usePlayerStore((s) => s.progress.duration);

  return {
    rewind: (seconds: number) => {
      if (display) {
        display.setTime(Math.max(0, time - seconds));
      }
    },
    forward: (seconds: number) => {
      if (display) {
        display.setTime(Math.min(duration, time + seconds));
      }
    },
  };
}
