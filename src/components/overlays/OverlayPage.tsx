import classNames from "classnames";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

import {
  Transition,
  TransitionAnimations,
} from "@/components/utils/Transition";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useInternalOverlayRouter } from "@/hooks/useOverlayRouter";
import { useOverlayStore } from "@/stores/overlay/store";

interface Props {
  id: string;
  path: string;
  children?: ReactNode;
  className?: string;
  height?: number; // Optional - will be measured if not provided
  maxHeight?: number; // Maximum height constraint
  width: number;
  fullWidth?: boolean;
}

export function OverlayPage(props: Props) {
  const router = useInternalOverlayRouter(props.id);
  const backwards = router.showBackwardsTransition(props.path);
  const show = router.isCurrentPage(props.path);
  const registerRoute = useOverlayStore((s) => s.registerRoute);
  const path = useMemo(() => router.makePath(props.path), [props.path, router]);
  const { isMobile } = useIsMobile();

  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(
    props.height || 400,
  );

  // Measure content height dynamically
  useEffect(() => {
    if (props.height || !contentRef.current) return; // Skip if height is explicitly set

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const height = entry.contentRect.height;
        // Apply max-height constraint if specified
        const finalHeight = props.maxHeight
          ? Math.min(height, props.maxHeight)
          : height;
        setMeasuredHeight(finalHeight);
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [props.height, props.maxHeight]);

  // Register route with final height
  useEffect(() => {
    const finalHeight = props.height || measuredHeight;
    registerRoute({
      id: path,
      width: props.fullWidth ? window.innerWidth - 60 : props.width,
      height: finalHeight,
    });
  }, [
    measuredHeight,
    props.height,
    props.width,
    props.fullWidth,
    path,
    registerRoute,
  ]);

  const width = !isMobile
    ? props.fullWidth
      ? "calc(100vw - 60px)"
      : `${props.width}px`
    : "100%";
  let animation: TransitionAnimations = "none";
  if (backwards === "yes" || backwards === "no")
    animation = backwards === "yes" ? "slide-full-left" : "slide-full-right";

  const finalHeight = props.height || measuredHeight;

  return (
    <Transition
      animation={animation}
      className="absolute inset-0"
      durationClass="duration-150"
      show={show}
    >
      <div
        ref={contentRef}
        className={classNames([
          "grid grid-rows-1 max-h-full",
          props.className,
          props.fullWidth ? "max-w-none" : "",
        ])}
        style={{
          height: finalHeight ? `${finalHeight}px` : undefined,
          maxHeight: props.maxHeight ? `${props.maxHeight}px` : undefined,
          width: props.width ? width : undefined,
        }}
      >
        {props.children}
      </div>
    </Transition>
  );
}
