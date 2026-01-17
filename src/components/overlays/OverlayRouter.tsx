import classNames from "classnames";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { OverlayAnchorPosition } from "@/components/overlays/positions/OverlayAnchorPosition";
import { OverlayMobilePosition } from "@/components/overlays/positions/OverlayMobilePosition";
import { Flare } from "@/components/utils/Flare";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useInternalOverlayRouter } from "@/hooks/useOverlayRouter";
import { useOverlayStore } from "@/stores/overlay/store";

interface OverlayRouterProps {
  children?: ReactNode;
  id: string;
}

function RouterBase(props: { id: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isMobile } = useIsMobile();

  const routes = useOverlayStore((s) => s.routes);
  const router = useInternalOverlayRouter(props.id);
  const routeMeta = useMemo(
    () => routes[router.currentRoute ?? ""],
    [routes, router],
  );

  // Track if this is the first dimension set
  const hasInitialized = useRef(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (routeMeta?.height && routeMeta.height > 0) {
      if (!hasInitialized.current) {
        // First time: don't animate
        hasInitialized.current = true;
      } else {
        // Subsequent changes: enable animation briefly
        setShouldAnimate(true);
        const timer = setTimeout(() => setShouldAnimate(false), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [routeMeta?.height]);

  const height = routeMeta?.height ?? 200;
  // On mobile, don't set width - parent container controls it
  // On desktop, use registered width or default
  const width = isMobile ? undefined : `${routeMeta?.width ?? 290}px`;

  const styleHeight = `${height}px`;

  return (
    <div
      ref={ref}
      style={{
        height: styleHeight,
        ...(width && { width }),
      }}
      className={classNames(
        "overflow-hidden relative z-10 max-h-full w-full",
        "transition-all duration-200 ease-out", // Always animate
      )}
    >
      <Flare.Base className="group w-full bg-video-context-border bg-opacity-30 backdrop-blur-md h-full rounded-xl text-video-context-type-main">
        <Flare.Light
          flareSize={200}
          cssColorVar="--colors-video-context-light"
          backgroundClass="bg-video-context-background"
          className="rounded-xl opacity-60"
          gradientOpacity={0.2}
          gradientSpread={60}
        />
        <Flare.Child className="pointer-events-auto relative h-full">
          {props.children}
        </Flare.Child>
      </Flare.Base>
    </div>
  );
}

export function OverlayRouter(props: OverlayRouterProps) {
  const { isMobile } = useIsMobile();
  const content = <RouterBase id={props.id}>{props.children}</RouterBase>;

  if (isMobile)
    return (
      <OverlayMobilePosition id={props.id}>{content}</OverlayMobilePosition>
    );
  return <OverlayAnchorPosition>{content}</OverlayAnchorPosition>;
}
