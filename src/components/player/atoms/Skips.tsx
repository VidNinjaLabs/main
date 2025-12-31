import { useCallback, useState } from "react";

import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

// Size mapping - matching Hugeicons responsive sizing
const sizeMap: Record<"sm" | "md" | "lg" | "xl", { base: number; lg: number }> =
  {
    sm: { base: 24, lg: 28 },
    md: { base: 32, lg: 40 }, // Default for all controls
    lg: { base: 40, lg: 48 },
    xl: { base: 56, lg: 64 },
  };

interface SkipIconProps {
  baseSize: number;
  lgSize: number;
  isAnimating: boolean;
}

function SkipForwardIcon({ baseSize, lgSize, isAnimating }: SkipIconProps) {
  const svgContent = (
    <>
      {/* Circle with arrow - ANIMATED */}
      <path
        d="M12 5L13.1039 3.45459C13.5149 2.87911 13.7205 2.59137 13.5907 2.32411C13.4609 2.05684 13.1311 2.04153 12.4714 2.01092C12.3152 2.00367 12.158 2 12 2C6.4772 2 2 6.47715 2 12C2 17.5228 6.4772 22 12 22C17.5229 22 22 17.5228 22 12C22 8.72836 20.4289 5.82368 18 3.99927"
        style={{
          transformOrigin: "center",
          transition: isAnimating
            ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
          transform: isAnimating ? "rotate(360deg)" : "rotate(0deg)",
        }}
      />
      {/* "1" - STATIC */}
      <path d="M7.99219 11.004C8.52019 10.584 9.00019 9.89143 9.30019 10.02C9.60019 10.1486 9.50419 10.572 9.50419 11.232C9.50419 11.892 9.50419 14.6847 9.50419 16.008" />
      {/* "0" - STATIC */}
      <path d="M16.0022 12.6C16.0022 11.22 16.0682 10.848 15.8042 10.404C15.5402 9.96001 14.8802 9.99841 14.2202 9.99841C13.5602 9.99841 13.0802 9.96001 12.7622 10.32C12.3722 10.74 12.5402 11.52 12.4922 12.6C12.6002 14.04 12.3062 15.18 12.7562 15.66C13.0802 16.056 13.6553 15.996 14.3402 16.008C15.0201 15.9997 15.4322 16.032 15.7682 15.648C16.1402 15.312 15.9602 13.98 16.0022 12.6Z" />
    </>
  );

  return (
    <>
      {/* Mobile */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={baseSize}
        height={baseSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lg:hidden"
      >
        {svgContent}
      </svg>
      {/* Desktop */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={lgSize}
        height={lgSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden lg:block"
      >
        {svgContent}
      </svg>
    </>
  );
}

function SkipBackwardIcon({ baseSize, lgSize, isAnimating }: SkipIconProps) {
  const svgContent = (
    <>
      {/* Circle with arrow - ANIMATED (backward direction) */}
      <path
        d="M12 5L10.8961 3.45459C10.4851 2.87911 10.2795 2.59137 10.4093 2.32411C10.5391 2.05684 10.8689 2.04153 11.5286 2.01092C11.6848 2.00367 11.842 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 8.72836 3.57111 5.82368 6 3.99927"
        style={{
          transformOrigin: "center",
          transition: isAnimating
            ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
          transform: isAnimating ? "rotate(-360deg)" : "rotate(0deg)",
        }}
      />
      {/* "1" - STATIC */}
      <path d="M7.99219 11.004C8.52019 10.584 9.00019 9.89143 9.30019 10.02C9.60019 10.1486 9.50419 10.572 9.50419 11.232C9.50419 11.892 9.50419 14.6847 9.50419 16.008" />
      {/* "0" - STATIC */}
      <path d="M16.0022 12.6C16.0022 11.22 16.0682 10.848 15.8042 10.404C15.5402 9.96001 14.8802 9.99841 14.2202 9.99841C13.5602 9.99841 13.0802 9.96001 12.7622 10.32C12.3722 10.74 12.5402 11.52 12.4922 12.6C12.6002 14.04 12.3062 15.18 12.7562 15.66C13.0802 16.056 13.6553 15.996 14.3402 16.008C15.0201 15.9997 15.4322 16.032 15.7682 15.648C16.1402 15.312 15.9602 13.98 16.0022 12.6Z" />
    </>
  );

  return (
    <>
      {/* Mobile */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={baseSize}
        height={baseSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lg:hidden"
      >
        {svgContent}
      </svg>
      {/* Desktop */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={lgSize}
        height={lgSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden lg:block"
      >
        {svgContent}
      </svg>
    </>
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

  const sizes = sizeMap[props.size || "lg"];

  return (
    <VideoPlayerButton onClick={commit}>
      <SkipForwardIcon
        baseSize={sizes.base}
        lgSize={sizes.lg}
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

  const sizes = sizeMap[props.size || "lg"];

  return (
    <VideoPlayerButton onClick={commit}>
      <SkipBackwardIcon
        baseSize={sizes.base}
        lgSize={sizes.lg}
        isAnimating={isAnimating}
      />
    </VideoPlayerButton>
  );
}
