import { CloudIcon } from "@hugeicons/react";
import { useState, useEffect, useRef } from "react";
import { Check, Loader2, Server } from "lucide-react";
import { DropdownMenu } from "@/components/ui";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { usePlayerStore } from "@/stores/player/store";
import { backendClient } from "@/backend/api/vidninja";
import { Provider } from "@/backend/api/types";

export function ServerSelector() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(
    null,
  );
  const [errorProviderId, setErrorProviderId] = useState<string | null>(null);

  // Get current provider, player controls, and media info
  const currentProvider = usePlayerStore((s) => s.sourceId);
  const meta = usePlayerStore((s) => s.meta);
  const setSourceId = usePlayerStore((s) => s.setSourceId);
  const performPause = usePlayerStore((s) => s.pause);
  const performPlay = usePlayerStore((s) => s.play);
  const setIsLoading = usePlayerStore((s) => s.setIsLoading);
  const display = usePlayerStore((s) => s.display);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);

  // Fetch all providers from backend on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await backendClient.getProviders();

        if (response && Array.isArray(response.sources)) {
          setProviders(response.sources);
        } else {
          setProviders([]);
        }
      } catch (error) {
        console.error("[ServerSelector] Failed to fetch providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleProviderSelect = async (providerId: string) => {
    if (loadingProviderId === providerId || providerId === currentProvider) {
      return;
    }

    if (!meta) {
      console.error("[ServerSelector] No media loaded");
      return;
    }

    console.log("[ServerSelector] Switching to provider:", providerId);

    // Show loading states & Unmount video visually
    // This sets isSwitchingProvider=true in store, triggering the overlay
    usePlayerStore.getState().pauseCurrentPlayback();

    setLoadingProviderId(providerId);
    setErrorProviderId(null);

    try {
      // Fetch new stream with specific provider - WAIT for 200 response
      console.log(
        `[ServerSelector] Fetching: /stream/${meta.type}/${meta.tmdbId}?provider=${providerId}`,
      );

      const streamResponse =
        meta.type === "movie"
          ? await backendClient.scrapeMovie(meta.tmdbId, providerId)
          : await backendClient.scrapeShow(
              meta.tmdbId,
              meta.season?.number || 1,
              meta.episode?.number || 1,
              providerId,
            );

      // Check if we have a valid stream in the new sanitized format
      if (
        !streamResponse ||
        (!streamResponse.stream && !streamResponse.manifestUrl)
      ) {
        throw new Error("No stream found for this provider");
      }

      // Update sourceId to show tick mark on active server
      // With sanitized response, 'provider' field might be missing, so we use the requested providerId
      setSourceId(streamResponse.provider || providerId);

      // Extract stream data, prioritizing the 'stream' array which contains the PROXIED URL from Edge
      let streamUrl = streamResponse.manifestUrl;
      let streamHeaders = streamResponse.headers;

      if (streamResponse.stream) {
        const streams = Array.isArray(streamResponse.stream)
          ? streamResponse.stream
          : [streamResponse.stream];

        if (streams.length > 0) {
          streamUrl = streams[0].playlist; // This is the rewriting Proxy URL
          streamHeaders = streams[0].headers; // Should be empty/safe if proxied
        }
      }

      const newSource = {
        type: "hls",
        url: streamUrl,
        headers: streamHeaders,
      };

      // Update store source - this triggers internal redisplaySource logic
      usePlayerStore.getState().setSource(newSource as any, [], 0);

      // Reset switching state (hides overlay)
      usePlayerStore.getState().resumeCurrentPlayback();

      console.log("[ServerSelector] Successfully switched to:", providerId);
      setLoadingProviderId(null);
      performPlay(); // Start playback from beginning
    } catch (error) {
      console.error("[ServerSelector] Failed to switch provider:", error);
      setErrorProviderId(providerId);
      setLoadingProviderId(null);

      // Revert switching state (hides overlay, potentially resumes old stream)
      usePlayerStore.getState().resumeCurrentPlayback();

      // Note: resumeCurrentPlayback already handles resuming if it was playing.
      // We don't need to call performPlay() explicitly if we want to revert state exactly.
    }
  };

  const getProviderName = (id: string) => {
    const p = providers.find((pr) => pr.id === id);
    return p ? p.name : id;
  };

  return (
    <DropdownMenu.Root onOpenChange={setHasOpenOverlay} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 md:p-2 transition-colors group relative outline-none"
          title={`Server: ${currentProvider ? getProviderName(currentProvider) : "Auto"}`}
          disabled={!!loadingProviderId}
        >
          <HugeiconsIcon
            icon={CloudIcon}
            size="sm"
            className={`text-white transition-colors ${
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
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="center" sideOffset={10} className="w-56">
        <DropdownMenu.Arrow className="fill-video-context-background/95" />
        <DropdownMenu.Label>
          <div className="flex flex-col gap-0.5">
            <span className="text-white font-medium">Select Server</span>
            {loadingProviderId && (
              <span className="text-blue-200 text-xs flex items-center gap-1.5 font-normal">
                <Loader2 className="w-3 h-3 animate-spin" />
                Switching...
              </span>
            )}
          </div>
        </DropdownMenu.Label>

        <DropdownMenu.Separator />

        {loading ? (
          <div className="px-3 py-2 text-gray-400 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading servers...
          </div>
        ) : providers.length === 0 ? (
          <div className="px-3 py-2 text-gray-400 text-sm">
            No servers available
          </div>
        ) : (
          <DropdownMenu.RadioGroup
            value={currentProvider || ""}
            onValueChange={handleProviderSelect}
          >
            {providers.map((provider) => {
              const hasError = errorProviderId === provider.id;
              const isLoading = loadingProviderId === provider.id;

              return (
                <DropdownMenu.RadioItem
                  key={provider.id}
                  value={provider.id}
                  disabled={!!loadingProviderId}
                  className={
                    hasError ? "!text-red-400 hover:!bg-red-500/10" : ""
                  }
                >
                  <span className="flex-1">{provider.name}</span>
                  {isLoading && (
                    <Loader2 className="w-3 h-3 ml-2 animate-spin" />
                  )}
                </DropdownMenu.RadioItem>
              );
            })}
          </DropdownMenu.RadioGroup>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
