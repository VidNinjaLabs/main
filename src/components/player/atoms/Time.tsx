import { usePlayerStore } from "@/stores/player/store";
import { durationExceedsHour, formatSeconds } from "@/utils/formatSeconds";

export function Time(props: { short?: boolean }) {
  const {
    duration: timeDuration,
    time,
    draggingTime,
  } = usePlayerStore((s) => s.progress);
  const { isSeeking } = usePlayerStore((s) => s.interface);
  const hasHours = durationExceedsHour(timeDuration);

  // Hide time display when duration is not available (loading/scraping state)
  if (!timeDuration || timeDuration <= 0) {
    return null;
  }

  const currentTime = Math.min(
    Math.max(isSeeking ? draggingTime : time, 0),
    timeDuration,
  );
  const secondsRemaining = Math.abs(currentTime - timeDuration);

  const timeLeft = formatSeconds(
    secondsRemaining,
    durationExceedsHour(secondsRemaining),
  );
  const timeWatched = formatSeconds(currentTime, hasHours);

  return (
    <div className="flex items-center gap-2 select-none">
      <span className="tabular-nums">
        {timeWatched} <span className="text-white/60">/ {timeLeft}</span>
      </span>
    </div>
  );
}
