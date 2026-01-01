/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-shadow */
import { useCallback, useRef, useState } from "react";

import { useIsMobile } from "@/hooks/useIsMobile";
import {
  makePercentage,
  makePercentageString,
  useProgressBar,
} from "@/hooks/useProgressBar";
import { usePlayerStore } from "@/stores/player/store";
import { canChangeVolume } from "@/utils/detectFeatures";

import { useVolume } from "../hooks/useVolume";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: 28,
  md: 40, // Match other buttons
  lg: 42,
  xl: 48,
};

function VolumeMuteIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.29289 1.29289C1.68342 0.902369 2.31658 0.902369 2.70711 1.29289L22.7071 21.2929C23.0976 21.6834 23.0976 22.3166 22.7071 22.7071C22.3166 23.0976 21.6834 23.0976 21.2929 22.7071L1.29289 2.70711C0.902369 2.31658 0.902369 1.68342 1.29289 1.29289Z"
        fill="currentColor"
      />
      <path
        d="M10.9916 3.9756C11.6784 3.44801 12.4957 3.01957 13.367 3.38808C14.2302 3.75318 14.5076 4.63267 14.6274 5.49785C14.7502 6.38459 14.7502 7.60557 14.7502 9.12365V14.8794C14.7502 16.3975 14.7502 17.6185 14.6274 18.5052C14.5076 19.3704 14.2302 20.2499 13.367 20.615C12.4957 20.9835 11.6784 20.5551 10.9916 20.0275C10.2892 19.488 9.3966 18.5765 8.34667 17.5044L8.34663 17.5044C7.80717 16.9535 7.44921 16.6873 7.08663 16.5374C6.72221 16.3868 6.27914 16.3229 5.50619 16.3229C4.83768 16.3229 4.23963 16.3229 3.78679 16.2758C3.31184 16.2265 2.87088 16.1191 2.47421 15.8485C1.7184 15.3328 1.42917 14.5777 1.31957 13.8838C1.23785 13.3663 1.24723 12.7981 1.25479 12.3405V11.6626C1.24723 11.205 1.23785 10.6368 1.31957 10.1193C1.42917 9.42536 1.7184 8.67029 2.47421 8.15462C2.87088 7.88398 3.31184 7.77657 3.78679 7.72723C4.23963 7.68019 4.83768 7.68021 5.50619 7.68023C6.27914 7.68023 6.72221 7.61628 7.08663 7.46563C7.44922 7.31574 7.80717 7.04954 8.34663 6.49869L8.34664 6.49869C9.39659 5.42655 10.2892 4.51511 10.9916 3.9756Z"
        fill="currentColor"
      />
    </svg>
  );
}

function VolumeMediumIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
    >
      <path
        d="M10.9916 3.9756C11.6784 3.44801 12.4957 3.01957 13.367 3.38808C14.2302 3.75318 14.5076 4.63267 14.6274 5.49785C14.7502 6.38459 14.7502 7.60557 14.7502 9.12365V14.8794C14.7502 16.3975 14.7502 17.6185 14.6274 18.5052C14.5076 19.3704 14.2302 20.2499 13.367 20.615C12.4957 20.9835 11.6784 20.5551 10.9916 20.0275C10.2892 19.488 9.3966 18.5765 8.34667 17.5044L8.34663 17.5044C7.80717 16.9535 7.44921 16.6873 7.08663 16.5374C6.72221 16.3868 6.27914 16.3229 5.50619 16.3229C4.83768 16.3229 4.23963 16.3229 3.78679 16.2758C3.31184 16.2265 2.87088 16.1191 2.47421 15.8485C1.7184 15.3328 1.42917 14.5777 1.31957 13.8838C1.23785 13.3663 1.24723 12.7981 1.25479 12.3405V11.6626C1.24723 11.205 1.23785 10.6368 1.31957 10.1193C1.42917 9.42536 1.7184 8.67029 2.47421 8.15462C2.87088 7.88398 3.31184 7.77657 3.78679 7.72723C4.23963 7.68019 4.83768 7.68021 5.50619 7.68023C6.27914 7.68023 6.72221 7.61628 7.08663 7.46563C7.44922 7.31574 7.80717 7.04954 8.34663 6.49869L8.34664 6.49869C9.39659 5.42655 10.2892 4.51511 10.9916 3.9756Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.3935 8.20504C16.8325 7.87003 17.4601 7.95439 17.7951 8.39347C18.5519 9.38539 19.0001 10.6418 19.0001 12.0001C19.0001 13.3583 18.5519 14.6147 17.7951 15.6066C17.4601 16.0457 16.8325 16.1301 16.3935 15.7951C15.9544 15.4601 15.87 14.8325 16.205 14.3935C16.699 13.746 17.0001 12.9149 17.0001 12.0001C17.0001 11.0852 16.699 10.2541 16.205 9.60664C15.87 9.16756 15.9544 8.54004 16.3935 8.20504Z"
        fill="currentColor"
      />
    </svg>
  );
}

function VolumeFullIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
    >
      <path
        d="M10.9916 3.9756C11.6784 3.44801 12.4957 3.01957 13.367 3.38808C14.2302 3.75318 14.5076 4.63267 14.6274 5.49785C14.7502 6.38459 14.7502 7.60557 14.7502 9.12365V14.8794C14.7502 16.3975 14.7502 17.6185 14.6274 18.5052C14.5076 19.3704 14.2302 20.2499 13.367 20.615C12.4957 20.9835 11.6784 20.5551 10.9916 20.0275C10.2892 19.488 9.3966 18.5765 8.34667 17.5044L8.34663 17.5044C7.80717 16.9535 7.44921 16.6873 7.08663 16.5374C6.72221 16.3868 6.27914 16.3229 5.50619 16.3229C4.83768 16.3229 4.23963 16.3229 3.78679 16.2758C3.31184 16.2265 2.87088 16.1191 2.47421 15.8485C1.7184 15.3328 1.42917 14.5777 1.31957 13.8838C1.23785 13.3663 1.24723 12.7981 1.25479 12.3405V11.6626C1.24723 11.205 1.23785 10.6368 1.31957 10.1193C1.42917 9.42536 1.7184 8.67029 2.47421 8.15462C2.87088 7.88398 3.31184 7.77657 3.78679 7.72723C4.23963 7.68019 4.83768 7.68021 5.50619 7.68023C6.27914 7.68023 6.72221 7.61628 7.08663 7.46563C7.44922 7.31574 7.80717 7.04954 8.34663 6.49869L8.34664 6.49869C9.39659 5.42655 10.2892 4.51511 10.9916 3.9756Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.3935 8.20504C16.8325 7.87003 17.4601 7.95439 17.7951 8.39347C18.5519 9.38539 19.0001 10.6418 19.0001 12.0001C19.0001 13.3583 18.5519 14.6147 17.7951 15.6066C17.4601 16.0457 16.8325 16.1301 16.3935 15.7951C15.9544 15.4601 15.87 14.8325 16.205 14.3935C16.699 13.746 17.0001 12.9149 17.0001 12.0001C17.0001 11.0852 16.699 10.2541 16.205 9.60664C15.87 9.16756 15.9544 8.54004 16.3935 8.20504Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.3247 6.26245C19.7321 5.8895 20.3646 5.91738 20.7376 6.32472C22.1408 7.8573 23 9.83247 23 12C23 14.1675 22.1408 16.1427 20.7376 17.6753C20.3646 18.0826 19.7321 18.1105 19.3247 17.7376C18.9174 17.3646 18.8895 16.7321 19.2625 16.3247C20.3609 15.125 21 13.621 21 12C21 10.379 20.3609 8.87497 19.2625 7.6753C18.8895 7.26796 18.9174 6.63541 19.3247 6.26245Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Volume(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const setHovering = usePlayerStore((s) => s.setHoveringLeftControls);
  const hovering = usePlayerStore((s) => s.interface.leftControlHovering);
  const volume = usePlayerStore((s) => s.mediaPlaying.volume);
  const { setVolume, toggleMute } = useVolume();
  const { isMobile } = useIsMobile();

  const commitVolume = useCallback(
    (percentage: number) => {
      setVolume(percentage);
    },
    [setVolume],
  );

  // Custom vertical drag handling
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [verticalPercentage, setVerticalPercentage] = useState(0);

  const handleVerticalDrag = useCallback(
    (clientY: number) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const offsetY = rect.bottom - clientY; // Distance from bottom
      const height = rect.height;
      let percentage = (offsetY / height) * 100;
      percentage = Math.max(0, Math.min(percentage, 100));
      setVerticalPercentage(percentage);
      commitVolume(percentage / 100);
    },
    [commitVolume],
  );

  const handleVerticalMouseDown = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      setIsDraggingVertical(true);
      const clientY =
        "touches" in event ? event.touches[0].clientY : event.clientY;
      handleVerticalDrag(clientY);

      const handleMove = (e: MouseEvent | TouchEvent) => {
        const y = "touches" in e ? e.touches[0].clientY : e.clientY;
        handleVerticalDrag(y);
      };

      const handleUp = () => {
        setIsDraggingVertical(false);
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
      document.addEventListener("touchmove", handleMove);
      document.addEventListener("touchend", handleUp);
    },
    [handleVerticalDrag],
  );

  // Horizontal slider for mobile
  const refHorizontal = useRef<HTMLDivElement>(null);
  const {
    dragging: draggingHorizontal,
    dragPercentage: dragPercentageHorizontal,
    dragMouseDown: dragMouseDownHorizontal,
  } = useProgressBar(refHorizontal, commitVolume, false);

  const handleClick = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  const handleMouseEnter = useCallback(async () => {
    if (await canChangeVolume()) setHovering(true);
    document.body.classList.add("overflow-y-hidden");
  }, [setHovering]);

  const handleMouseLeave = () => {
    setHovering(false);
    document.body.classList.remove("overflow-y-hidden");
  };

  let percentage = makePercentage(volume * 100);
  if (isDraggingVertical) percentage = makePercentage(verticalPercentage);
  if (draggingHorizontal) percentage = makePercentage(dragPercentageHorizontal);
  const percentageString = makePercentageString(percentage);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      let newVolume = volume - event.deltaY / 1000;
      newVolume = Math.max(0, Math.min(newVolume, 1));
      setVolume(newVolume);
    },
    [volume, setVolume],
  );

  // Determine current icon state
  const volState =
    percentage === 0 ? "mute" : percentage <= 50 ? "medium" : "full";

  const sizePx = sizeMap[props.size || "md"];

  // Animation helper
  const getStyle = (targetState: string) => {
    const isActive = volState === targetState;
    return {
      position: "absolute" as const,
      left: 0,
      top: 0,
      opacity: isActive ? 1 : 0,
      transition: "opacity 0.15s ease-in-out",
    };
  };

  const getClassName = (targetState: string) => {
    const isActive = volState === targetState;
    return isActive ? "" : "pointer-events-none";
  };

  // On mobile, always show the slider; on desktop, show on hover/drag
  const showSlider = isMobile || hovering || isDraggingVertical;

  return (
    <div
      className={props.className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <div className="pointer-events-auto flex cursor-pointer items-center relative">
        {/* Vertical Slider Area - Desktop Only */}
        {!isMobile && (
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-[opacity,transform] duration-300 ${
              showSlider
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            <div
              ref={ref}
              className="flex w-10 h-24 items-center justify-center px-2 bg-black bg-opacity-80 rounded-lg backdrop-blur-sm"
              onMouseDown={handleVerticalMouseDown}
              onTouchStart={handleVerticalMouseDown}
            >
              <div className="relative w-1 flex-1 rounded-full bg-gray-500 bg-opacity-50">
                {/* Filled portion */}
                <div
                  className="absolute inset-x-0 bottom-0 rounded-full bg-video-audio-set"
                  style={{
                    height: percentageString,
                  }}
                />
                {/* White knob - positioned based on percentage */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white"
                  style={{
                    bottom: percentageString,
                    transform: "translate(-50%, 50%)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Button Area */}
        <div
          className="tabbable rounded-full flex items-center text-white relative"
          onClick={handleClick}
          style={{ width: sizePx, height: sizePx }}
        >
          <div style={{ position: "relative", width: sizePx, height: sizePx }}>
            <div style={getStyle("mute")} className={getClassName("mute")}>
              <VolumeMuteIcon size={sizePx} />
            </div>
            <div style={getStyle("medium")} className={getClassName("medium")}>
              <VolumeMediumIcon size={sizePx} />
            </div>
            <div style={getStyle("full")} className={getClassName("full")}>
              <VolumeFullIcon size={sizePx} />
            </div>
          </div>
        </div>

        {/* Horizontal Slider Area - Mobile Only */}
        {isMobile && (
          <div className="ml-2 opacity-100">
            <div
              ref={refHorizontal}
              className="flex h-10 w-20 items-center px-2"
              onMouseDown={dragMouseDownHorizontal}
              onTouchStart={dragMouseDownHorizontal}
            >
              <div className="relative h-1 flex-1 rounded-full bg-gray-500 bg-opacity-50">
                <div
                  className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-video-audio-set"
                  style={{
                    width: percentageString,
                  }}
                >
                  <div className="absolute h-3 w-3 translate-x-1/2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
