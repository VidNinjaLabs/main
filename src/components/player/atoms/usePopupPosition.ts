import { useState, useCallback, useEffect, RefObject } from "react";

export function usePopupPosition(anchorRef: RefObject<HTMLElement>, isOpen: boolean, popupWidth?: number) {
  const [position, setPosition] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    if (!isOpen || !anchorRef.current) return;

    const portal =
      document.getElementById("vidninja-portal-mount") ||
      document.getElementById("vidninja-player-container") ||
      document.body;

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const portalRect = portal.getBoundingClientRect();

    // Calculate center of anchor relative to the portal container
    let centerX = anchorRect.left - portalRect.left + anchorRect.width / 2;

    // Prevent overflowing screen edges if width is known
    if (popupWidth) {
      const halfWidth = popupWidth / 2;
      const padding = 16; // 16px safe area from edge
      
      if (centerX - halfWidth < padding) {
        centerX = halfWidth + padding;
      }
      if (centerX + halfWidth > portalRect.width - padding) {
        centerX = portalRect.width - halfWidth - padding;
      }
    }

    setPosition({
      left: `${centerX}px`,
      transform: "translateX(-50%)",
    });
  }, [isOpen, anchorRef, popupWidth]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  return position;
}
