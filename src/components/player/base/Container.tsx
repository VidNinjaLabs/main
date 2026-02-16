import { ReactNode, RefObject, useEffect, useRef } from "react";

import { OverlayDisplay } from "@/components/overlays/OverlayDisplay";
import { SkipTracker } from "@/components/player/internals/Backend/SkipTracker";
import { CastingInternal } from "@/components/player/internals/CastingInternal";
import { HeadUpdater } from "@/components/player/internals/HeadUpdater";
import { KeyboardEvents } from "@/components/player/internals/KeyboardEvents";
import { MediaSession } from "@/components/player/internals/MediaSession";
import { MetaReporter } from "@/components/player/internals/MetaReporter";
import { ProgressSaver } from "@/components/player/internals/ProgressSaver";
import { useAutoResume } from "@/components/player/hooks/useAutoResume";
import { ThumbnailScraper } from "@/components/player/internals/ThumbnailScraper";
import { VideoClickTarget } from "@/components/player/internals/VideoClickTarget";
import { VideoContainer } from "@/components/player/internals/VideoContainer";
// import { WatchPartyResetter } from "@/components/player/internals/WatchPartyResetter"; // Removed
import { PlayerHoverState } from "@/stores/player/slices/interface";
import { usePlayerStore } from "@/stores/player/store";

// import { WatchPartyReporter } from "../internals/Backend/WatchPartyReporter"; // Removed

export interface PlayerProps {
  children?: ReactNode;
  showingControls: boolean;
  onLoad?: () => void;
}

function useHovering(containerEl: RefObject<HTMLDivElement>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateInterfaceHovering = usePlayerStore(
    (s) => s.updateInterfaceHovering,
  );
  const hovering = usePlayerStore((s) => s.interface.hovering);

  useEffect(() => {
    if (!containerEl.current) return;
    const el = containerEl.current;

    function pointerMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      updateInterfaceHovering(PlayerHoverState.MOUSE_HOVER);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        updateInterfaceHovering(PlayerHoverState.NOT_HOVERING);
        timeoutRef.current = null;
      }, 3000);
    }

    function pointerLeave(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      updateInterfaceHovering(PlayerHoverState.NOT_HOVERING);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    el.addEventListener("pointermove", pointerMove);
    el.addEventListener("pointerleave", pointerLeave);

    return () => {
      el.removeEventListener("pointermove", pointerMove);
      el.removeEventListener("pointerleave", pointerLeave);
    };
  }, [containerEl, hovering, updateInterfaceHovering]);
}

function BaseContainer(props: { children?: ReactNode }) {
  const containerEl = useRef<HTMLDivElement | null>(null);
  const display = usePlayerStore((s) => s.display);
  useHovering(containerEl);

  // report container element to display interface
  useEffect(() => {
    if (display && containerEl.current) {
      display.processContainerElement(containerEl.current);
    }
  }, [display, containerEl]);

  // Prevent global scrolling when player is active
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  return (
    <div
      ref={containerEl}
      id="vidninja-player-container"
      className="fixed inset-0 z-50 overflow-hidden bg-black"
    >
      <OverlayDisplay>
        <div className="h-full w-full select-none">{props.children}</div>
      </OverlayDisplay>
    </div>
  );
}

import { SwitchingProviderOverlay } from "@/components/player/base/SwitchingProviderOverlay";

export function Container(props: PlayerProps) {
  const propRef = useRef(props.onLoad);
  useEffect(() => {
    propRef.current?.();
  }, []);

  return (
    <div className="relative">
      <BaseContainer>
        <VideoContainer />
        <MetaReporter />
        <ThumbnailScraper />
        <CastingInternal />
        <ProgressSaver />
        {/* Auto-resume DISABLED - causes segment loading issues */}
        {/* {useAutoResume()} */}
        <KeyboardEvents />
        <MediaSession />
        {/* <WatchPartyReporter /> Removed */}
        <SkipTracker />
        {/* <WatchPartyResetter /> Removed */}
        <div className="relative h-full w-full overflow-hidden z-10 isolate">
          <VideoClickTarget showingControls={props.showingControls} />
          <HeadUpdater />
          {props.children}
          <SwitchingProviderOverlay />
        </div>
        <div
          id="vidninja-portal-mount"
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-[9999]"
        />
      </BaseContainer>
    </div>
  );
}
