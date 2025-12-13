import classNames from "classnames";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { useOverlayStore } from "@/stores/overlay/store";

interface AnchorPositionProps {
  children?: ReactNode;
  className?: string;
}

function useCalculatePositions() {
  const anchorPoint = useOverlayStore((s) => s.anchorPoint);
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<number>(0);
  const [top, setTop] = useState<number>(0);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [isPositioned, setIsPositioned] = useState(false);

  const calculateAndSetCoords = useCallback(
    (anchor: typeof anchorPoint, card: DOMRect) => {
      if (!anchor) return;
      const buttonCenter = anchor.x + anchor.w / 2;
      const bottomReal = window.innerHeight - (anchor.y + anchor.h);

      // Calculate top position - ensure popup stays within viewport
      const calculatedTop =
        window.innerHeight - bottomReal - anchor.h - card.height - 30;
      // Ensure minimum 20px from top of screen
      const constrainedTop = Math.max(20, calculatedTop);

      setTop(constrainedTop);
      setLeft(
        Math.min(
          buttonCenter - card.width / 2,
          window.innerWidth - card.width - 30,
        ),
      );
      setIsPositioned(true);
    },
    [],
  );

  useEffect(() => {
    if (!anchorPoint || !cardRect) return;
    calculateAndSetCoords(anchorPoint, cardRect);
  }, [anchorPoint, calculateAndSetCoords, cardRect]);

  useEffect(() => {
    if (!ref.current) return;
    function checkBox() {
      const divRect = ref.current?.getBoundingClientRect();
      setCardRect(divRect ?? null);
    }
    checkBox();
    const observer = new ResizeObserver(checkBox);
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, left, top, isPositioned] as const;
}

export function OverlayAnchorPosition(props: AnchorPositionProps) {
  const [ref, left, top, isPositioned] = useCalculatePositions();
  const [animateIn, setAnimateIn] = useState(false);

  // Trigger animation AFTER positioning is complete
  // Add small delay to let dimensions settle
  useEffect(() => {
    if (isPositioned) {
      // Delay to ensure child dimensions are measured
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, 50); // 50ms delay for dimensions to settle
      return () => clearTimeout(timer);
    }
    setAnimateIn(false);
  }, [isPositioned]);

  return (
    <div
      ref={ref}
      style={{
        transform: `translateX(${left}px) translateY(${top}px)`,
      }}
      className={classNames([
        "[&>*]:pointer-events-auto z-10 flex dir-neutral:items-start rtl:justify-start ltr:justify-end dir-neutral:origin-top-left touch-none",
        // Pure fade animation - no scale to avoid position movement
        "transition-opacity duration-200 ease-out",
        animateIn ? "opacity-100" : "opacity-0",
        props.className,
      ])}
    >
      {props.children}
    </div>
  );
}
