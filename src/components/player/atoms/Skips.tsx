import { useCallback, useState } from "react";

import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

// Size mapping - larger for better visibility
const sizeMap = {
  sm: 24,
  md: 28,
  lg: 32,
  xl: 38,
};

interface SkipIconProps {
  size: number;
  isAnimating: boolean;
}

function SkipForwardIcon({ size, isAnimating }: SkipIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 250 250"
      fill="currentColor"
    >
      {/* Circle with arrow - ANIMATED */}
      <path
        d="M125 250C56 250 0 194 0 125S56 0 125 0h6c9 0 17 1 20 8 4 8-1 14-6 22l-13 18c-3 4-8 5-12 2s-5-8-2-12l13-18c1-1 1-2 2-2h-8C66 18 17 66 17 126c0 59 48 108 108 108 59 0 108-48 108-108 0-34-16-66-43-86-4-3-5-8-2-12s8-5 12-2c31 23 50 61 50 100 0 69-56 125-125 125z"
        style={{
          transformOrigin: "125px 125px",
          transition: isAnimating
            ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
          transform: isAnimating ? "rotate(360deg)" : "rotate(0deg)",
        }}
      />
      {/* "10" text - STATIC */}
      <path d="M89 172c-3 0-5-1-7-3s-3-4-3-7v-60c0-2-1-3-3-2l-4 2c-1 0-1 0-2 1h-2c-3 0-5-1-7-3s-3-4-3-7q0-6 6-9l17-7c2-1 4-1 5-1 3 0 6 1 8 3s3 5 3 8v74c0 3-1 5-3 7s-4 3-7 3zm35-48c0-15 3-26 8-34 6-8 14-12 25-12s20 4 26 12 9 20 9 34c0 15-3 26-9 35s-14 13-26 13c-11 0-20-4-25-13-6-9-8-20-8-35m20 0c0 10 1 17 3 22s6 7 11 7 9-3 11-8 3-13 3-22q0-15-3-21c-2-4-6-6-11-6s-9 2-11 7q-3 6-3 21" />
    </svg>
  );
}

function SkipBackwardIcon({ size, isAnimating }: SkipIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 250 250"
      fill="currentColor"
    >
      {/* Circle with arrow - ANIMATED */}
      <path
        d="M125 250c69 0 125-56 125-125S194 0 125 0h-6c-9 0-17 1-20 8-4 8 1 14 6 22l13 18c3 4 8 5 12 2s5-8 2-12l-13-18c-1-1-1-2-2-2h8c59 0 108 48 108 108 0 59-48 108-108 108-59 0-108-48-108-108 0-34 16-66 43-86 4-3 5-8 2-12s-8-5-12-2C19 49 0 87 0 126c0 69 56 125 125 125z"
        style={{
          transformOrigin: "125px 125px",
          transition: isAnimating
            ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
          transform: isAnimating ? "rotate(-360deg)" : "rotate(0deg)",
        }}
      />
      {/* "10" text - STATIC */}
      <path d="M89 172c-3 0-5-1-7-3s-3-4-3-7v-60c0-2-1-3-3-2l-4 2c-1 0-1 0-2 1h-2c-3 0-5-1-7-3s-3-4-3-7q0-6 6-9l17-7c2-1 4-1 5-1 3 0 6 1 8 3s3 5 3 8v74c0 3-1 5-3 7s-4 3-7 3zm35-48c0-15 3-26 8-34 6-8 14-12 25-12s20 4 26 12 9 20 9 34c0 15-3 26-9 35s-14 13-26 13c-11 0-20-4-25-13-6-9-8-20-8-35m20 0c0 10 1 17 3 22s6 7 11 7 9-3 11-8 3-13 3-22q0-15-3-21c-2-4-6-6-11-6s-9 2-11 7q-3 6-3 21" />
    </svg>
  );
}

export function SkipForward(props: {
  size?: "sm" | "md" | "lg" | "xl";
  onAction?: (action: "forward") => void;
}) {
  const display = usePlayerStore((s) => s.display);
  const time = usePlayerStore((s) => s.progress.time);
  const enableDoubleClickToSeek = usePreferencesStore(
    (s) => s.enableDoubleClickToSeek,
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const commit = useCallback(() => {
    display?.setTime(time + 10);
    props.onAction?.("forward");

    // Trigger circle+arrow rotation (full loop), "10" stays static
    setIsAnimating(false);
    requestAnimationFrame(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    });
  }, [display, time, props]);

  if (enableDoubleClickToSeek) return null;

  return (
    <VideoPlayerButton onClick={commit}>
      <SkipForwardIcon
        size={sizeMap[props.size || "lg"]}
        isAnimating={isAnimating}
      />
    </VideoPlayerButton>
  );
}

export function SkipBackward(props: {
  size?: "sm" | "md" | "lg" | "xl";
  onAction?: (action: "backward") => void;
}) {
  const display = usePlayerStore((s) => s.display);
  const time = usePlayerStore((s) => s.progress.time);
  const enableDoubleClickToSeek = usePreferencesStore(
    (s) => s.enableDoubleClickToSeek,
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const commit = useCallback(() => {
    display?.setTime(time - 10);
    props.onAction?.("backward");

    // Trigger circle+arrow rotation (full loop), "10" stays static
    setIsAnimating(false);
    requestAnimationFrame(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    });
  }, [display, time, props]);

  if (enableDoubleClickToSeek) return null;

  return (
    <VideoPlayerButton onClick={commit}>
      <SkipBackwardIcon
        size={sizeMap[props.size || "lg"]}
        isAnimating={isAnimating}
      />
    </VideoPlayerButton>
  );
}
