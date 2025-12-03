import classNames from "classnames";
import { LucideIcon as LucideIconType } from "lucide-react";
import { forwardRef } from "react";

import { Icon, Icons } from "@/components/Icon";

export interface VideoPlayerButtonProps {
  children?: React.ReactNode;
  onClick?: (el: HTMLButtonElement) => void;
  // Support both old Icons enum and new Lucide icons
  icon?: Icons | LucideIconType;
  iconSizeClass?: string;
  className?: string;
  activeClass?: string;
}

export const VideoPlayerButton = forwardRef<
  HTMLButtonElement,
  VideoPlayerButtonProps
>((props, ref) => {
  // Check if icon is a Lucide icon (function/object) or custom Icons enum (string)
  const isLucideIcon = typeof props.icon !== "string";
  const LucideComponent = isLucideIcon ? (props.icon as LucideIconType) : null;

  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => props.onClick?.(e.currentTarget as HTMLButtonElement)}
      className={classNames([
        "tabbable p-2 rounded-full transition-transform duration-75 flex items-center gap-3",
        props.activeClass ?? "active:scale-110 active:text-white",
        props.className ?? "",
      ])}
    >
      {props.icon &&
        (isLucideIcon && LucideComponent ? (
          <LucideComponent
            className={props.iconSizeClass || "text-2xl"}
            size="1em"
            strokeWidth={2}
          />
        ) : (
          <Icon
            className={props.iconSizeClass || "text-2xl"}
            icon={props.icon as Icons}
          />
        ))}
      {props.children}
    </button>
  );
});
