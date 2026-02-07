import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";

export type PauseAction = "play" | "pause";

// Size mapping - play/pause should be larger than other controls
const sizeMap = {
  sm: 28,
  md: 34,
  lg: 70, // Matches user request for 70px
  xl: 96, // Increased size directly (matches Spinner default 96px)
};

function PlayIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 250 266"
      fill="currentColor"
    >
      <path d="M156 42c26 15 47 27 62 38s26 22 30 37q4.5 16.5 0 33c-4 15-15 26-30 37s-35 23-62 37c-25 14-47 27-63 34s-31 11-46 6c-11-3-20-9-28-17-11-11-15-26-17-43-2-18-2-41-2-70v-2c0-29 0-53 2-70 2-18 6-33 17-43 8-8 18-14 28-17 15-4 30-1 46 6s38 19 63 34" />
    </svg>
  );
}

function PauseIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 250 250"
      fill="currentColor"
    >
      <path d="M196 0h2c10 0 18 0 24 1 7 1 14 3 19 9 5 5 8 12 9 19s1 15 1 24v144c0 10 0 18-1 24-1 7-3 14-9 19-5 5-12 8-19 9s-15 1-24 1h-1c-10 0-18 0-24-1-7-1-14-3-19-9-5-5-8-12-9-19s-1-15-1-24V53c0-9 0-18 1-24 1-7 3-14 9-19 5-5 12-8 19-9s15-1 24-1zM53 0h2c9 0 18 0 24 1 7 1 14 3 19 9 5 5 8 12 9 19s1 15 1 24v144c0 10 0 18-1 24-1 7-3 14-9 19-5 5-12 8-19 9s-15 1-24 1h-1c-9 0-18 0-24-1-7-1-14-3-19-9-5-5-8-12-9-19s-1-15-1-24V53c0-9 0-18 1-24 1-7 3-14 9-19 5-5 12-8 19-9s15-1 24-1z" />
    </svg>
  );
}

export function Pause(props: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onAction?: (action: PauseAction) => void;
}) {
  const isPaused = usePlayerStore((s) => s.mediaPlaying.isPaused);
  const display = usePlayerStore((s) => s.display);

  const togglePause = () => {
    if (isPaused) {
      display?.play();
      props.onAction?.("play");
    } else {
      display?.pause();
      props.onAction?.("pause");
    }
  };

  const size = sizeMap[props.size || "lg"];

  return (
    <VideoPlayerButton
      onClick={togglePause}
      className={`text-white ${props.className || ""}`}
      activeClass="active:scale-100 active:text-white"
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Play icon - visible when paused */}
        <div
          style={{
            position: "absolute",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isPaused
              ? "scale(1) rotate(0deg)"
              : "scale(1) rotate(-90deg)", // No scale change
            opacity: isPaused ? 1 : 0,
          }}
        >
          <PlayIcon size={size} />
        </div>
        {/* Pause icon - visible when playing */}
        <div
          style={{
            position: "absolute",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isPaused
              ? "scale(1) rotate(90deg)" // No scale change
              : "scale(1) rotate(0deg)",
            opacity: isPaused ? 0 : 1,
          }}
        >
          <PauseIcon size={size} />
        </div>
      </div>
    </VideoPlayerButton>
  );
}
