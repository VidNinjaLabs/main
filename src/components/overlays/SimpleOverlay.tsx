import classNames from "classnames";
import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface SimpleOverlayProps {
  id: string;
  show: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * SimpleOverlay - A clean, CSS-based overlay component
 *
 * Features:
 * - CSS positioning (no JavaScript calculations)
 * - CSS transitions (smooth fade + scale)
 * - Click outside to close
 * - Escape key to close
 * - Portal rendering for proper z-index
 */
export function SimpleOverlay({
  id,
  show,
  onClose,
  children,
  className,
}: SimpleOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!show) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [show, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if not showing (for performance)
  // But keep in DOM for smooth exit animation
  const content = (
    <div
      className={classNames(
        "fixed inset-0 z-[999]",
        show ? "pointer-events-auto" : "pointer-events-none",
      )}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={classNames(
          "absolute inset-0 bg-black transition-opacity duration-200",
          show ? "opacity-50" : "opacity-0",
        )}
      />

      {/* Overlay content wrapper - positioned by anchor */}
      <div
        ref={overlayRef}
        id={`simple-overlay-${id}`}
        className={classNames(
          // Base styles
          "absolute transition-all duration-200 ease-out",
          // Animation origin from bottom
          "origin-bottom",
          // Show/hide states
          show
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

/**
 * SimpleOverlayAnchor - Wrapper that positions the overlay relative to its children
 */
interface SimpleOverlayAnchorProps {
  children: ReactNode;
  overlay: ReactNode;
  show: boolean;
  onClose: () => void;
}

export function SimpleOverlayAnchor({
  children,
  overlay,
  show,
  onClose,
}: SimpleOverlayAnchorProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Position overlay above anchor
  useEffect(() => {
    if (!show || !anchorRef.current || !overlayRef.current) return;

    const anchor = anchorRef.current.getBoundingClientRect();
    const overlayEl = overlayRef.current;

    // Position above anchor, centered
    overlayEl.style.bottom = `${window.innerHeight - anchor.top + 12}px`;
    overlayEl.style.right = `${window.innerWidth - anchor.right}px`;
  }, [show]);

  return (
    <div ref={anchorRef} className="relative">
      {children}
      {createPortal(
        <div
          ref={overlayRef}
          className={classNames(
            "fixed z-[999] transition-all duration-200 ease-out origin-bottom",
            show
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none",
          )}
        >
          {/* Backdrop for click outside */}
          {show && <div className="fixed inset-0 -z-10" onClick={onClose} />}
          {overlay}
        </div>,
        document.body,
      )}
    </div>
  );
}
