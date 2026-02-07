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
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const [arrowLeft, setArrowLeft] = useState<number>(0);

  const calculateAndSetCoords = useCallback(
    (anchor: typeof anchorPoint, card: DOMRect) => {
      if (!anchor) return;
      const buttonCenter = anchor.x + anchor.w / 2;
      const gap = 16; // Gap between button and popup

      // Determine if the button is in the top or bottom half of the screen
      const viewportHeight = window.innerHeight;
      const buttonCenterY = anchor.y + anchor.h / 2;
      const isButtonInTopHalf = buttonCenterY < viewportHeight / 2;

      let topPosition: number;
      const isTop = !isButtonInTopHalf; // "top" placement means popup is above button (button is at bottom)

      // Update placement state
      // if isButtonInTopHalf, popup is BELOW -> placement = 'bottom'
      // if !isButtonInTopHalf (bottom controls), popup is ABOVE -> placement = 'top'
      setPlacement(isButtonInTopHalf ? "bottom" : "top");

      if (isButtonInTopHalf) {
        // Button is at top - position popup BELOW the button
        topPosition = anchor.y + anchor.h + gap;
      } else {
        // Button is at bottom - position popup ABOVE the button
        topPosition = anchor.y - card.height - gap;
      }

      // Constrain vertical
      const minTop = 20;
      const maxTop = viewportHeight - card.height - 20;
      const constrainedTop = Math.max(minTop, Math.min(topPosition, maxTop));

      // Horizontal Centering
      let leftPosition = buttonCenter - card.width / 2;

      // Constrain horizontal
      const maxLeft = window.innerWidth - card.width - 20;
      leftPosition = Math.max(20, Math.min(leftPosition, maxLeft));

      // Calculate Arrow Position relative to card
      // arrow is at (buttonCenter - leftPosition)
      const calculatedArrowLeft = buttonCenter - leftPosition;

      setTop(constrainedTop);
      setLeft(leftPosition);
      setArrowLeft(calculatedArrowLeft);
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

  return [ref, left, top, isPositioned, placement, arrowLeft] as const;
}

export function OverlayAnchorPosition(props: AnchorPositionProps) {
  const [ref, left, top, isPositioned, placement, arrowLeft] =
    useCalculatePositions();
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
        position: "absolute", // Ensure absolute positioning
        top: 0,
        left: 0,
      }}
      className={classNames([
        "[&>*]:pointer-events-auto z-10 flex dir-neutral:origin-top-left touch-none",
        // Pure fade animation - no scale to avoid position movement
        "transition-opacity duration-200 ease-out",
        animateIn ? "opacity-100" : "opacity-0",
        props.className,
      ])}
    >
      {props.children}

      {/* Arrow Indicator */}
      {isPositioned && (
        <div
          className={classNames(
            "absolute w-4 h-2 z-50 pointer-events-none drop-shadow-sm",
            placement === "bottom" ? "-top-2" : "-bottom-2",
          )}
          style={{
            left: arrowLeft,
            transform: "translateX(-50%)",
          }}
        >
          <svg
            width="16"
            height="8"
            viewBox="0 0 16 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {placement === "bottom" ? (
              <path
                d="M8 0L0 8H16L8 0Z"
                className="fill-video-context-background/95"
              />
            ) : (
              <path
                d="M8 8L0 0H16L8 8Z"
                className="fill-video-context-background/95"
              />
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
