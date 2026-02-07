import classNames from "classnames";
import { memo } from "react";

/**
 * HugeiconsIcon component wrapper for @hugeicons/react
 * Provides consistent sizing and responsive behavior
 */

export type IconSize = "sm" | "md" | "lg" | "xl";

export interface HugeiconsIconProps {
  icon: React.ComponentType<any>;
  size?: IconSize;
  className?: string;
  strokeWidth?: number;
}

// Responsive size mappings (mobile -> desktop) in pixels
const sizeMap: Record<IconSize, { base: number; lg: number }> = {
  sm: { base: 20, lg: 25 }, // 20px mobile, 25px desktop (matches top bar request)
  md: { base: 32, lg: 40 }, // 32px mobile, 40px desktop (default for all controls)
  lg: { base: 40, lg: 48 }, // 40px mobile, 48px desktop
  xl: { base: 56, lg: 64 }, // 56px mobile, 64px desktop (play button)
};

export const HugeiconsIcon = memo((props: HugeiconsIconProps) => {
  const {
    icon: IconComponent,
    size = "md",
    className,
    strokeWidth = 2,
  } = props;
  const sizes = size ? sizeMap[size] : sizeMap.md;

  return (
    <>
      <IconComponent
        size={sizes.base}
        strokeWidth={strokeWidth}
        className={classNames("lg:hidden", className)}
      />
      <IconComponent
        size={sizes.lg}
        strokeWidth={strokeWidth}
        className={classNames("hidden lg:block", className)}
      />
    </>
  );
});

HugeiconsIcon.displayName = "HugeiconsIcon";
