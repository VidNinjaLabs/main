import { ArrowLeft } from "lucide-react";
import { PlayerHoverState } from "@/stores/player/slices/interface";
import { usePlayerStore } from "@/stores/player/store";
import { useQueryParam } from "@/hooks/useQueryParams";
import { closeEpisodesPanel } from "@/components/player/atoms/Episodes";

export function PlayerTopBar() {
  const [route, setRoute] = useQueryParam("r");
  const hasOpenOverlay = usePlayerStore((s) => s.interface.hasOpenOverlay);

  const handleBack = () => {
    // If a panel/overlay is open (e.g., episodes), close it instead of navigating away
    if (hasOpenOverlay) {
      closeEpisodesPanel();
      return;
    }
    if (route) {
      setRoute(null, { replace: true });
      return;
    }
    window.history.back();
  };

  return (
    <div
      onPointerMove={() => {
        usePlayerStore
          .getState()
          .updateInterfaceHovering(PlayerHoverState.MOUSE_HOVER);
      }}
      className="absolute top-0 left-0 right-0 z-50 flex items-start justify-between px-3 md:px-8 lg:px-10 py-3 md:py-5 transition-opacity duration-200 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-1 text-white/90 hover:text-white transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-8 h-8 lg:w-10 lg:h-10" />
        </button>

        {/* Mobile Title - Single Line */}
        <div className="lg:hidden flex items-center text-left gap-1.5 overflow-hidden">
          <h1 className="text-sm text-white font-bold line-clamp-1 flex-shrink-0">
            {usePlayerStore((s) => s.meta?.title)}
          </h1>
          {usePlayerStore((s) => s.meta?.episode) && (
            <>
              <span className="text-white/60 text-xs">•</span>
              <span className="text-xs text-white/90 line-clamp-1 truncate min-w-0">
                S{usePlayerStore((s) => s.meta?.season?.number)} E
                {usePlayerStore((s) => s.meta?.episode?.number)}{" "}
                {usePlayerStore((s) => s.meta?.episode?.title)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
