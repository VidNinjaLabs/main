/* eslint-disable react/no-unused-prop-types */
import { useCallback, useState } from "react";

interface SkipIconProps {
  size?: number;
  className?: string;
  direction: "forward" | "backward";
  isAnimating: boolean;
}

export function SkipIcon({
  size = 24,
  className,
  direction,
  isAnimating,
}: SkipIconProps) {
  const isForward = direction === "forward";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ transform: isForward ? "scaleX(1)" : "scaleX(-1)" }}
    >
      {/* Static circle with "10" */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize="7"
        fontWeight="bold"
        style={{
          transform: isForward ? "scaleX(1)" : "scaleX(-1)",
          transformOrigin: "center",
        }}
      >
        10
      </text>

      {/* Animated arrow - rotates around the circle */}
      <g
        style={{
          transformOrigin: "12px 12px",
          transition: isAnimating ? "transform 0.4s ease-out" : "none",
          transform: isAnimating ? "rotate(360deg)" : "rotate(0deg)",
        }}
      >
        {/* Arrow pointing right at 3 o'clock position */}
        <path
          d="M21 12 L17 8 M21 12 L17 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

// Size mapping for consistent sizing
const sizeMap = {
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
};

interface AnimatedSkipIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  direction: "forward" | "backward";
  onAnimationEnd?: () => void;
}

export function useSkipAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    // Reset after animation completes (400ms matches the CSS transition)
    setTimeout(() => setIsAnimating(false), 400);
  }, []);

  return { isAnimating, triggerAnimation };
}

export function AnimatedSkipIcon({
  size = "lg",
  direction,
}: AnimatedSkipIconProps) {
  return (
    <SkipIcon size={sizeMap[size]} direction={direction} isAnimating={false} />
  );
}
