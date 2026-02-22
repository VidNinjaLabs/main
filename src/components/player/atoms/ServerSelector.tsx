import { CloudIcon } from "@hugeicons/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { usePlayerStore } from "@/stores/player/store";
import { backendClient } from "@/backend/api/vidninja";
import { Provider } from "@/backend/api/types";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { usePopupPosition } from "./usePopupPosition";

function getPlayerPortalElement(): HTMLElement {
  return (
    document.getElementById("vidninja-portal-mount") ||
    document.getElementById("vidninja-player-container") ||
    document.body
  );
}

let _serverSetOpen: ((v: boolean) => void) | null = null;
let _serverCloseTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCloseServer(delayMs = 300) {
  if (_serverCloseTimer) clearTimeout(_serverCloseTimer);
  _serverCloseTimer = setTimeout(() => {
    _serverSetOpen?.(false);
    _serverCloseTimer = null;
  }, delayMs);
}
function cancelCloseServer() {
  if (_serverCloseTimer) {
    clearTimeout(_serverCloseTimer);
    _serverCloseTimer = null;
  }
}

export function ServerSelector() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(null);
  const [errorProviderId, setErrorProviderId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupStyle = usePopupPosition(anchorRef, isOpen, 480);

  const currentProvider = usePlayerStore((s) => s.sourceId);
  const meta = usePlayerStore((s) => s.meta);
  const setSourceId = usePlayerStore((s) => s.setSourceId);
  const performPlay = usePlayerStore((s) => s.play);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const display = usePlayerStore((s) => s.display);

  useEffect(() => {
    _serverSetOpen = (v) => {
      setIsOpen(v);
      setHasOpenOverlay(v);
    };
    return () => { _serverSetOpen = null; };
  }, [setHasOpenOverlay]);

  useEffect(() => {
    backendClient.getProviders()
      .then((res) => { if (res && Array.isArray(res.sources)) setProviders(res.sources); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 1024) {
      cancelCloseServer();
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => { _serverSetOpen?.(true); }, 120);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (window.innerWidth >= 1024) scheduleCloseServer();
  }, []);

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }, []);

  const handleProviderSelect = async (providerId: string) => {
    if (loadingProviderId === providerId || providerId === currentProvider) return;
    if (!meta) return;

    usePlayerStore.getState().pauseCurrentPlayback();
    setLoadingProviderId(providerId);
    setErrorProviderId(null);

    try {
      const streamResponse =
        meta.type === "movie"
          ? await backendClient.scrapeMovie(meta.tmdbId, providerId)
          : await backendClient.scrapeShow(meta.tmdbId, meta.season?.number || 1, meta.episode?.number || 1, providerId);

      if (!streamResponse || (!streamResponse.stream && !streamResponse.manifestUrl)) {
        throw new Error("No stream found");
      }

      setSourceId(streamResponse.provider || providerId);

      let streamUrl = streamResponse.manifestUrl;
      let streamHeaders = streamResponse.headers;

      if (streamResponse.stream) {
        const streams = Array.isArray(streamResponse.stream) ? streamResponse.stream : [streamResponse.stream];
        if (streams.length > 0) {
          streamUrl = streams[0].playlist;
          streamHeaders = streams[0].headers;
        }
      }

      usePlayerStore.getState().setSource({ type: "hls", url: streamUrl, headers: streamHeaders } as any, [], 0);
      usePlayerStore.getState().resumeCurrentPlayback();
      setLoadingProviderId(null);
      performPlay();
      setIsOpen(false);
      setHasOpenOverlay(false);
    } catch {
      setErrorProviderId(providerId);
      setLoadingProviderId(null);
      usePlayerStore.getState().resumeCurrentPlayback();
    }
  };

  const getProviderName = (id: string) => providers.find((p) => p.id === id)?.name ?? id;
  const portalEl = getPlayerPortalElement();

  return (
    <div className="relative inline-flex" ref={anchorRef}>
      <button
        onClick={() => {
          if (window.innerWidth < 1024) {
            const next = !isOpen;
            setIsOpen(next);
            setHasOpenOverlay(next);
          } else {
            cancelCloseServer();
            setIsOpen(true);
            setHasOpenOverlay(true);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={!!loadingProviderId}
        className="text-white hover:text-white/80 transition-colors flex items-center justify-center rounded-lg p-2 relative"
        title={`Server: ${currentProvider ? getProviderName(currentProvider) : "Auto"}`}
      >
        <HugeiconsIcon
          icon={CloudIcon}
          size="sm"
          className={classNames("w-8 h-8 lg:w-10 lg:h-10", loadingProviderId && "animate-pulse")}
          strokeWidth={2}
        />
        {loadingProviderId && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </button>

      {createPortal(
        <div
          style={popupStyle}
          className={classNames(
            "absolute bottom-[88px] z-[300] w-[280px] max-h-[70vh]",
            "flex flex-col rounded-2xl overflow-hidden",
            "bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl",
            "transition-all duration-200 ease-out origin-bottom",
            isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none",
          )}
          onMouseEnter={cancelCloseServer}
          onMouseLeave={() => scheduleCloseServer()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
            <h3 className="text-white font-bold text-lg">Select Server</h3>
            {loadingProviderId && (
              <span className="text-blue-300 text-lg flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Switching...
              </span>
            )}
          </div>

          {/* Server list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : providers.length === 0 ? (
              <div className="px-5 py-6 text-white/40 text-lg">No servers available</div>
            ) : (
              providers.map((provider) => {
                const isSelected = provider.id === currentProvider;
                const isLoading = loadingProviderId === provider.id;
                const hasError = errorProviderId === provider.id;
                return (
                  <div
                    key={provider.id}
                    onClick={() => !loadingProviderId && handleProviderSelect(provider.id)}
                    className={classNames(
                      "flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors",
                      loadingProviderId && !isLoading ? "opacity-40 cursor-default" : "hover:bg-white/5",
                      hasError ? "text-red-400" : isSelected ? "text-white" : "text-white/70",
                    )}
                  >
                    <div className="w-5 flex-shrink-0 flex items-center justify-center">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                      ) : isSelected ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : null}
                    </div>
                    <span className="flex-1 text-lg font-semibold">{provider.name}</span>
                    {hasError && <span className="text-lg text-red-400">Failed</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        portalEl,
      )}
    </div>
  );
}
