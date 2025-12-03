import classNames from "classnames";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { useIsMobile } from "@/hooks/useIsMobile";
import { useInternalOverlayRouter } from "@/hooks/useOverlayRouter";
import { useOverlayStore } from "@/stores/overlay/store";

interface Props {
  id: string;
  path: string;
  children?: ReactNode;
  className?: string;
  height?: number; // Optional - if provided, use fixed height
  maxHeight?: number; // Maximum allowed height
  width: number;
  fullWidth?: boolean;
}

export function OverlayPage(props: Props) {
  const router = useInternalOverlayRouter(props.id);
  const show = router.isCurrentPage(props.path);
  const registerRoute = useOverlayStore((s) => s.registerRoute);
  const path = useMemo(() => router.makePath(props.path), [props.path, router]);
  const { isMobile } = useIsMobile();

  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);

  /**
   * Measure and register route - synchronous, no delays
   */
  useEffect(() => {
    if (!contentRef.current) return;

    const measure = () => {
      if (!contentRef.current) return;

      // Use explicit height if provided
      if (props.height) {
        setMeasuredHeight(props.height);
        registerRoute({
          id: path,
          width: props.fullWidth ? window.innerWidth - 60 : props.width,
          height: props.height,
        });
        return;
      }

      // Otherwise measure from content
      const rawHeight = contentRef.current.scrollHeight;
      const finalHeight = props.maxHeight
        ? Math.min(rawHeight, props.maxHeight)
        : rawHeight;

      setMeasuredHeight(finalHeight);

      // Register immediately with measured height
      registerRoute({
        id: path,
        width: props.fullWidth ? window.innerWidth - 60 : props.width,
        height: finalHeight,
      });
    };

    // Measure and register synchronously
    measure();

    // ResizeObserver will catch any subsequent changes
    const observer = new ResizeObserver(measure);
    observer.observe(contentRef.current);

    return () => {
      observer.disconnect();
    };
  }, [
    props.height,
    props.maxHeight,
    props.children,
    props.path,
    props.width,
    props.fullWidth,
    path,
    registerRoute,
  ]);

  /**
   * Width calculation
   */
  const width = !isMobile
    ? props.fullWidth
      ? "calc(100vw - 60px)"
      : `${props.width}px`
    : "100%";

  /**
   * Final height (auto if dynamic)
   */
  const finalHeight = props.height ? `${props.height}px` : "auto";

  return (
    <div
      className={classNames([
        "absolute inset-0",
        !show && "pointer-events-none opacity-0", // Hide but keep in DOM
      ])}
    >
      <div
        ref={contentRef}
        className={classNames([
          "grid grid-rows-[auto] max-h-full",
          props.className,
          props.fullWidth ? "max-w-none" : "",
        ])}
        style={{
          height: finalHeight, // Auto height unless overridden
          maxHeight: props.maxHeight ? `${props.maxHeight}px` : undefined,
          width,
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
