export * from "./atoms";
export * from "./base/Container";
export * from "./base/TopControls";
export * from "./base/CenterControls";
export * from "./base/BottomControls";
export * from "./base/BlackOverlay";
export * from "./base/BackLink";
export * from "./base/LeftSideControls";
export * from "./base/CenterMobileControls";
export * from "./base/SubtitleView";
export * from "./internals/BookmarkButton";
export * from "./internals/InfoButton";
export * from "./internals/SkipEpisodeButton";
export * from "./atoms/Chromecast";
export * from "./atoms/Widescreen";

// New Netflix-style components
export * from "./base/PlayerTopBar";
export * from "./base/PlayerCenterControls";
export * from "./base/PlayerBottomBar";

// Loading overlay component
import { Loader2 } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { Transition } from "@/components/utils/Transition";

export function SwitchingProviderOverlay() {
  const isSwitching = usePlayerStore((s) => s.isSwitchingProvider);

  return (
    <Transition
      animation="fade"
      show={isSwitching}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white"
    >
      <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
      <h3 className="text-xl font-medium">Switching Server...</h3>
      <p className="text-white/60 text-sm mt-2">Please wait while we connect</p>
    </Transition>
  );
}
