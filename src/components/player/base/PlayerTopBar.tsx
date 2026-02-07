import { ChevronLeft, MoreVertical, X } from "lucide-react";
import { useState, useEffect } from "react";
import {
  ClosedCaptionIcon,
  VolumeHighIcon,
  Settings02Icon,
  CloudIcon,
} from "@hugeicons/react";

import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { Player } from "@/components/player";
import { CaptionsButton } from "@/components/player/atoms/CaptionsButton";
import { ServerSelector } from "@/components/player/atoms/ServerSelector";
import { SettingsButton } from "@/components/player/atoms/SettingsButton";
import { VolumeButton } from "@/components/player/atoms/VolumeButton";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PlayerHoverState } from "@/stores/player/slices/interface";
import { usePlayerStore } from "@/stores/player/store";

// Mobile components
import { MobileCaptionsList } from "@/components/player/mobile/MobileCaptionsList";
import { MobileSettingsList } from "@/components/player/mobile/MobileSettingsList";
import { MobileServerList } from "@/components/player/mobile/MobileServerList";
import { MobileAudioList } from "@/components/player/mobile/MobileAudioList";

export function PlayerTopBar() {
  const meta = usePlayerStore((s) => s.meta);
  const isShow = meta?.type === "show";
  const { isMobile } = useIsMobile();
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);

  // Mobile Menu State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<
    "none" | "captions" | "settings" | "audio" | "server"
  >("none");

  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);

  // Sync mobile menu state with player store to prevent controls from auto-hiding
  useEffect(() => {
    setHasOpenOverlay(showMobileMenu || activeOverlay !== "none");
  }, [showMobileMenu, activeOverlay, setHasOpenOverlay]);

  // Show minimal UI during initial load
  const showMinimalUI = !hasPlayedOnce;

  return (
    <div
      onPointerMove={() => {
        usePlayerStore
          .getState()
          .updateInterfaceHovering(PlayerHoverState.MOUSE_HOVER);
      }}
      className="absolute top-0 left-0 right-0 z-50 flex items-start justify-between px-6 md:px-8 lg:px-10 py-4 md:py-5 transition-opacity duration-200"
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <>
          {showMobileMenu ? (
            /* Expanded Menu View */
            <div className="flex items-center justify-end w-full gap-4 animate-in fade-in slide-in-from-right-4 duration-200 pointer-events-auto">
              {/* Control Buttons Row */}
              <div className="flex items-center gap-4 mr-4">
                <button
                  onClick={() => setActiveOverlay("captions")}
                  className="p-1"
                  title="Captions"
                >
                  <HugeiconsIcon
                    icon={ClosedCaptionIcon}
                    className="w-6 h-6 text-white"
                  />
                </button>
                <button
                  onClick={() => setActiveOverlay("settings")}
                  className="p-1"
                  title="Settings"
                >
                  {/* Use standard Settings icon for consistency */}
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    className="w-6 h-6 text-white"
                  />
                </button>
                <button
                  onClick={() => setActiveOverlay("audio")}
                  className="p-1"
                  title="Audio"
                >
                  <HugeiconsIcon
                    icon={VolumeHighIcon}
                    className="w-6 h-6 text-white"
                  />
                </button>
                <button
                  onClick={() => setActiveOverlay("server")}
                  className="p-1"
                  title="Server"
                >
                  <HugeiconsIcon
                    icon={CloudIcon}
                    className="w-6 h-6 text-white"
                  />
                  {/* Used CloudIcon direct import instead of ServerSelector component to avoid UI hydration mismatches or complex state in the toolbar */}
                </button>
              </div>

              {/* Separator */}
              <div className="w-px h-5 bg-white/20" />

              {/* Fullscreen & Close */}
              <div className="flex items-center gap-3">
                <Player.Fullscreen size="sm" />
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          ) : (
            /* Standard Mobile Header */
            <>
              {/* Left: Title + Info */}
              <div className="flex flex-col justify-center pointer-events-auto flex-1 min-w-0 mr-4">
                <div className="flex items-baseline gap-2 truncate">
                  <h1 className="text-lg font-medium text-white truncate leading-snug">
                    {meta?.title || "Loading..."}
                  </h1>
                  {meta?.releaseYear ? (
                    <span className="text-sm text-white/60 font-normal">
                      ({meta.releaseYear})
                    </span>
                  ) : null}
                </div>
                {isShow && meta?.episode && (
                  <span className="text-xs text-white/70 truncate leading-snug">
                    S{meta.season?.number} E{meta.episode.number} •{" "}
                    {meta.episode.title}
                  </span>
                )}
              </div>

              {/* Right: Kebab Menu (Toggle) + Close */}
              <div className="pointer-events-auto flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="p-2 text-white/90 hover:text-white"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="p-2 text-white/90 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {/* Render Overlays */}
          <MobileCaptionsList
            isOpen={activeOverlay === "captions"}
            onClose={() => setActiveOverlay("none")}
            onOpenSettings={() => setActiveOverlay("settings")}
          />
          <MobileSettingsList
            isOpen={activeOverlay === "settings"}
            onClose={() => setActiveOverlay("none")}
          />
          <MobileServerList
            isOpen={activeOverlay === "server"}
            onClose={() => setActiveOverlay("none")}
          />
          <MobileAudioList
            isOpen={activeOverlay === "audio"}
            onClose={() => setActiveOverlay("none")}
          />
        </>
      ) : (
        /* Desktop Layout */
        <>
          {/* Left: Title + Info */}
          <div className="flex items-center gap-4 pointer-events-auto flex-1 justify-start mt-2 md:mt-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-bold text-white leading-tight">
                  {meta?.title || "Loading..."}
                </h1>
                {meta?.releaseYear ? (
                  <span className="text-xl text-white/60 font-medium">
                    ({meta.releaseYear})
                  </span>
                ) : null}
              </div>

              {isShow && meta?.episode && (
                <span className="text-base text-white/70">
                  S{meta.season?.number} E{meta.episode.number} •{" "}
                  {meta.episode.title}
                </span>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 pointer-events-auto justify-end">
            {!showMinimalUI && (
              <>
                <Player.Episodes
                  inControl={true}
                  iconSizeClass="w-[25px] h-[25px]"
                />
                <CaptionsButton />
                <SettingsButton />
                <VolumeButton />
                <ServerSelector />
                <div className="w-px h-6 bg-white/20 mx-2" />
                <Player.Chromecast iconSizeClass="w-[25px] h-[25px]" />
                <Player.Fullscreen size="sm" />
                <Player.Pip size="sm" />

                {/* Close Button */}
                <button
                  onClick={() => window.history.back()}
                  className="p-2 text-white transition-colors"
                  title="Close"
                >
                  <X className="w-[25px] h-[25px]" />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
