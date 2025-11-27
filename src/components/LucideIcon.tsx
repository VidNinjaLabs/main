import classNames from "classnames";
import { LucideIcon as LucideIconType, LucideProps } from "lucide-react";

export interface LucideIconProps extends Omit<LucideProps, "ref"> {
  icon: LucideIconType;
}

/**
 * Wrapper component for Lucide icons with consistent styling
 * Usage: <LucideIcon icon={Play} className="..." size={24} />
 */
export function LucideIcon({
  icon: Icon,
  className,
  ...props
}: LucideIconProps) {
  const flipClass =
    Icon.displayName === "ArrowLeft" ||
    Icon.displayName === "ArrowRight" ||
    Icon.displayName === "ChevronLeft" ||
    Icon.displayName === "ChevronRight"
      ? "rtl:-scale-x-100"
      : "";

  return <Icon className={classNames(className, flipClass)} {...props} />;
}
