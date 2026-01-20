import { CloudIcon } from "@hugeicons/react";
import { useState, useEffect, useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { Popover } from "../base/Popover";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { usePlayerStore } from "@/stores/player/store";
import { backendClient } from "@/backend/api/vidninja";
import { useSourceScraping } from "@/components/player/hooks/useSourceSelection";

interface Provider {
  codename: string;
  rank: number;
  type: string;
}

export function ServerSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(
    null,
  );
  const [errorProviderId, setErrorProviderId] = useState<string | null>(null);
  const lastFetchedProviderId = useRef<string | null>(null);

  // Get current provider, player controls, and media info
  const currentProvider = usePlayerStore((s) => s.sourceId);
  const meta = usePlayerStore((s) => s.meta);
  const setSource = usePlayerStore((s) => s.setSource);
  const setSourceId = usePlayerStore((s) => s.setSourceId);
  const performPause = usePlayerStore((s) => s.pause);
  const performPlay = usePlayerStore((s) => s.play);
  const setIsLoading = usePlayerStore((s) => s.setIsLoading);
  const display = usePlayerStore((s) => s.display);

  // Fetch all providers from backend on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await backendClient.getProviders();
        console.log("[ServerSelector] Fetched providers:", response);

        // Backend now returns array of provider names (codenames)
        // Convert to Provider objects for display
        const providerList = Array.isArray(response)
          ? response.map((name: string, index: number) => ({
              codename: name,
              rank: index, // Use index as rank since backend doesn't return it
              type: "source",
            }))
          : [];

        setProviders(providerList);
      } catch (error) {
        console.error("[ServerSelector] Failed to fetch providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleProviderSelect = async (codename: string) => {
    if (loadingProviderId === codename || codename === currentProvider) {
      setIsOpen(false);
      return;
    }

    if (!meta) {
      console.error("[ServerSelector] No media loaded");
      return;
    }

    console.log("[ServerSelector] Switching to provider:", codename);
    setIsOpen(false);

    // Show loading states
    performPause();
    setIsLoading(true);
    setLoadingProviderId(codename);
    setErrorProviderId(null);

    try {
      // Fetch new stream with specific provider - WAIT for 200 response
      console.log(
        `[ServerSelector] Fetching: /stream/${meta.type}/${meta.tmdbId}?provider=${codename}`,
      );

      const streamResponse =
        meta.type === "movie"
          ? await backendClient.scrapeMovie(meta.tmdbId, codename)
          : await backendClient.scrapeShow(
              meta.tmdbId,
              meta.season?.number || 1,
              meta.episode?.number || 1,
              codename,
            );

      if (!streamResponse || !streamResponse.manifestUrl) {
        throw new Error("No stream found for this provider");
      }

      // Update sourceId to show tick mark on active server
      setSourceId(streamResponse.provider || codename);

      // Load new stream and START FROM BEGINNING
      if (display) {
        await display.load(streamResponse.manifestUrl);
        display.setTime(0); // Start from beginning, not resume
      }

      console.log("[ServerSelector] Successfully switched to:", codename);
      setLoadingProviderId(null);
      setIsLoading(false);
      performPlay(); // Start playback from beginning
    } catch (error) {
      console.error("[ServerSelector] Failed to switch provider:", error);
      setErrorProviderId(codename);
      setLoadingProviderId(null);
      setIsLoading(false);
      performPlay(); // Resume playback on error
    }
  };

  return (
    <Popover
      trigger={
        <button
          className="p-2 md:p-2.5 transition-colors group relative"
          title={`Server: ${currentProvider || "Auto"}`}
          onClick={() => setIsOpen(!isOpen)}
          disabled={!!loadingProviderId}
        >
          <HugeiconsIcon
            icon={CloudIcon}
            size="md"
            className={`text-white/70 group-hover:text-white transition-colors ${
              loadingProviderId ? "animate-pulse" : ""
            }`}
            strokeWidth={2}
          />
          {loadingProviderId && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </button>
      }
      content={
        <div className="w-56 backdrop-blur-xl bg-black/40 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5">
            <h3 className="text-white font-medium text-sm">Select Server</h3>
            <p className="text-zinc-400 text-xs mt-0.5">
              {loadingProviderId ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Switching...
                </span>
              ) : (
                `Current: ${currentProvider || "session"}`
              )}
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {loading ? (
              <div className="px-3 py-2 text-gray-400 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : providers.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 text-sm">
                No servers available
              </div>
            ) : (
              providers.map((provider) => {
                const isActive = currentProvider === provider.codename;
                const isLoading = loadingProviderId === provider.codename;
                const hasError = errorProviderId === provider.codename;

                return (
                  <button
                    key={provider.codename}
                    onClick={() => handleProviderSelect(provider.codename)}
                    disabled={!!loadingProviderId}
                    className={`w-full px-3 py-2 text-left transition-all duration-200 flex items-center justify-between group ${
                      loadingProviderId
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-white/10 active:scale-[0.98]"
                    } ${
                      isActive
                        ? "bg-white/15 border-l-2 border-blue-400"
                        : "border-l-2 border-transparent"
                    } ${hasError ? "bg-red-500/10 border-l-2 border-red-400" : ""}`}
                  >
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isActive ? "text-white" : "text-gray-300"
                      } ${hasError ? "text-red-400" : ""} ${
                        !loadingProviderId && !isActive
                          ? "group-hover:text-white"
                          : ""
                      }`}
                    >
                      {provider.codename}
                    </span>
                    {isActive && (
                      <Check className="w-4 h-4 text-blue-400 animate-in fade-in zoom-in duration-200" />
                    )}
                    {isLoading && (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      }
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      position="bottom"
      align="start"
    />
  );
}
