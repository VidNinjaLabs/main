import { CloudIcon } from "@hugeicons/react";
import { Check, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { backendClient } from "@/backend/api/vidninja";
import { Provider } from "@/backend/api/types";
import { usePlayerStore } from "@/stores/player/store";
import { MobileOverlay } from "./MobileOverlay";

interface MobileServerListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileServerList({ isOpen, onClose }: MobileServerListProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(
    null,
  );

  const currentProvider = usePlayerStore((s) => s.sourceId);
  const meta = usePlayerStore((s) => s.meta);
  const setSourceId = usePlayerStore((s) => s.setSourceId);
  const performPlay = usePlayerStore((s) => s.play);

  useEffect(() => {
    if (isOpen) {
      const fetchProviders = async () => {
        try {
          setLoading(true);
          const response = await backendClient.getProviders();
          if (response && Array.isArray(response.sources)) {
            setProviders(response.sources);
          }
        } catch (error) {
          console.error("Failed to fetch providers:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProviders();
    }
  }, [isOpen]);

  const handleProviderSelect = async (providerId: string) => {
    if (loadingProviderId || providerId === currentProvider) return;
    if (!meta) return;

    // Use same switching logic as ServerSelector
    usePlayerStore.getState().pauseCurrentPlayback();
    setLoadingProviderId(providerId);

    try {
      const streamResponse =
        meta.type === "movie"
          ? await backendClient.scrapeMovie(meta.tmdbId, providerId)
          : await backendClient.scrapeShow(
              meta.tmdbId,
              meta.season?.number || 1,
              meta.episode?.number || 1,
              providerId,
            );

      if (!streamResponse?.manifestUrl && !streamResponse?.stream) {
        throw new Error("No stream found");
      }

      setSourceId(streamResponse.provider || providerId);

      let streamUrl = streamResponse.manifestUrl;
      let streamHeaders = streamResponse.headers;

      if (streamResponse.stream) {
        const streams = Array.isArray(streamResponse.stream)
          ? streamResponse.stream
          : [streamResponse.stream];
        if (streams.length > 0) {
          streamUrl = streams[0].playlist;
          streamHeaders = streams[0].headers;
        }
      }

      const newSource = {
        type: "hls",
        url: streamUrl,
        headers: streamHeaders,
      };

      usePlayerStore.getState().setSource(newSource as any, [], 0);
      usePlayerStore.getState().resumeCurrentPlayback();

      setLoadingProviderId(null);
      onClose(); // Close overlay on success
      performPlay();
    } catch (error) {
      console.error("Switch failed:", error);
      setLoadingProviderId(null);
      usePlayerStore.getState().resumeCurrentPlayback();
    }
  };

  return (
    <MobileOverlay isOpen={isOpen} onClose={onClose} title="Select Server">
      <div className="space-y-1">
        {loading ? (
          <div className="p-4 text-center text-white/50 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading servers...
          </div>
        ) : (
          providers.map((provider) => {
            const isSelected = currentProvider === provider.id;
            const isLoading = loadingProviderId === provider.id;

            return (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider.id)}
                disabled={!!loadingProviderId}
                className={`w-full px-3 py-3 rounded-lg flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors ${
                  isSelected ? "bg-white/10 border border-white/20" : ""
                } ${!!loadingProviderId ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border border-white/20 flex items-center justify-center ${
                      isSelected ? "bg-white border-white" : ""
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <span className="text-white text-base">{provider.name}</span>
                </div>
                {isLoading && (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                )}
              </button>
            );
          })
        )}
      </div>
    </MobileOverlay>
  );
}
