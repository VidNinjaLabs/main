import { ReactNode, useEffect, useRef } from "react";

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Popover({
  trigger,
  content,
  position = "bottom",
  align = "center",
  className = "",
  isOpen,
  onClose,
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const getPositionClasses = () => {
    const positions = {
      top: "bottom-full mb-3",
      bottom: "top-full mt-3",
      left: "right-full mr-3",
      right: "left-full ml-3",
    };

    const alignments = {
      start: position === "top" || position === "bottom" ? "left-0" : "top-0",
      center:
        position === "top" || position === "bottom"
          ? "left-1/2 -translate-x-1/2"
          : "top-1/2 -translate-y-1/2",
      end: position === "top" || position === "bottom" ? "right-0" : "bottom-0",
    };

    return `${positions[position]} ${alignments[align]}`;
  };

  const getArrowClasses = () => {
    const arrowPositions = {
      top: "top-full left-1/2 -translate-x-1/2 -mt-px border-l-[6px] border-r-[6px] border-b-0 border-t-[6px] border-l-transparent border-r-transparent border-t-zinc-900",
      bottom:
        "bottom-full left-1/2 -translate-x-1/2 -mb-px border-l-[6px] border-r-[6px] border-t-0 border-b-[6px] border-l-transparent border-r-transparent border-b-zinc-900",
      left: "left-full top-1/2 -translate-y-1/2 -ml-px border-t-[6px] border-b-[6px] border-r-0 border-l-[6px] border-t-transparent border-b-transparent border-l-zinc-900",
      right:
        "right-full top-1/2 -translate-y-1/2 -mr-px border-t-[6px] border-b-[6px] border-l-0 border-r-[6px] border-t-transparent border-b-transparent border-r-zinc-900",
    };

    return arrowPositions[position];
  };

  return (
    <div className="relative inline-block">
      <div ref={triggerRef}>{trigger}</div>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-[100] ${getPositionClasses()} ${className} animate-in fade-in-0 zoom-in-95 duration-200`}
        >
          {/* Arrow */}
          <div className={`absolute w-0 h-0 ${getArrowClasses()}`} />

          {/* Content - Neutral zinc background */}
          <div className="bg-zinc-900 rounded-lg shadow-2xl border border-zinc-700 overflow-hidden">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
