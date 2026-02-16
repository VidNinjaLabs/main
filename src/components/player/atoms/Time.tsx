import { usePlayerStore } from "@/stores/player/store";
import { durationExceedsHour, formatSeconds } from "@/utils/formatSeconds";

// Export individual components for flexible layout
export function CurrentTime() {
  const { time, draggingTime } = usePlayerStore((s) => s.progress);
  const { isSeeking } = usePlayerStore((s) => s.interface);
  const duration = usePlayerStore((s) => s.progress.duration);
  const hasHours = durationExceedsHour(duration);

  // Use dragging time if seeking, otherwise current time
  const displayTime = isSeeking ? draggingTime : time;
  const safeTime = Math.min(Math.max(displayTime, 0), duration);

  return (
    <span className="tabular-nums">{formatSeconds(safeTime, hasHours)}</span>
  );
}

export function Duration() {
  const duration = usePlayerStore((s) => s.progress.duration);
  const hasHours = durationExceedsHour(duration);

  if (!duration || duration <= 0) return null;

  return (
    <span className="tabular-nums">{formatSeconds(duration, hasHours)}</span>
  );
}

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

  // Standard format: Current / Duration
  const timeWatched = formatSeconds(currentTime, hasHours);
  const totalDuration = formatSeconds(timeDuration, hasHours);

  return (
    <div className="flex items-center gap-2 select-none">
      <span className="tabular-nums">
        {timeWatched} <span className="text-white/60">/ {totalDuration}</span>
      </span>
    </div>
  );
}
