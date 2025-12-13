import classNames from "classnames";
import { ReactNode, useEffect, useState } from "react";

import { Icon, Icons } from "@/components/Icon";

interface MobilePositionProps {
  children?: ReactNode;
  className?: string;
  id?: string;
}

export function OverlayMobilePosition(props: MobilePositionProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Delay showing until dimensions settle - 100ms delay
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const isCaptionsSettings = window.location.href.endsWith(
    "settings%2Fcaptions%2Fsettings",
  );

  let positionClass = "left-0 right-0 mx-auto"; // Default center

  if (props.id === "episodes") {
    positionClass = "left-6 right-auto";
  } else if (props.id === "settings") {
    // Settings and captions overlay on the right side
    positionClass = "right-6 left-auto";
  }

  return (
    <>
      {isCaptionsSettings ? (
        <button
          className="fixed top-1 right-4 w-12 h-12 text-video-context-type-main bg-video-context-background z-10 hover:bg-video-context-closeHover active:scale-95 rounded-2xl pointer-events-auto flex justify-center items-center py-3 mt-3 font-bold border border-video-context-border hover:text-white"
          type="button"
          onClick={togglePreview}
        >
          {isPreviewMode ? (
            <Icon icon={Icons.EYE} className="w-4" />
          ) : (
            <Icon icon={Icons.EYE_SLASH} className="w-4" />
          )}
        </button>
      ) : null}

      {/* Main Overlay - ONLY opacity transition, no dimension transitions */}
      <div
        style={{
          opacity: isReady ? (isPreviewMode ? 0.5 : 1) : 0,
          transition: "opacity 200ms ease-out",
        }}
        className={classNames([
          "pointer-events-auto px-2 pb-3 z-10 ml-[env(safe-area-inset-left)] mr-[env(safe-area-inset-right)] bottom-16 origin-top-left w-[290px] max-w-[calc(100vw-3rem)] absolute overflow-hidden max-h-[calc(100vh-1.5rem)] grid grid-rows-[minmax(0,1fr),auto]",
          positionClass,
          props.className,
        ])}
      >
        {props.children}
        {/* Gradient to hide the progress */}
        <div className="pointer-events-none absolute z-0 bottom-0 left-0 w-full h-32" />
      </div>
    </>
  );
}
