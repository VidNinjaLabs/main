import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { febboxClient } from "@/backend/api/febbox";
import type {
  FebboxSource,
  Provider,
  StreamResponse,
} from "@/backend/api/types";
import { backendClient } from "@/backend/api/vidninja";
import { usePreferencesStore } from "@/stores/preferences";
import analytics from "@/utils/analytics";
import { selectBestServer } from "@/utils/serverValidator";
import { TIMEOUTS, withTimeout } from "@/utils/timeout";

export interface ScrapingItems {
  id: string;
  children: string[];
}

export interface ScrapingSegment {
  name: string;
  id: string;
  embedId?: string;
  status: "failure" | "pending" | "notfound" | "success" | "waiting";
  reason?: string;
  error?: any;
  percentage: number;
}

export interface ScrapeMedia {
  type: "movie" | "show";
  title: string;
  releaseYear: number;
  tmdbId: string;
  imdbId?: string;
  backdropPath?: string;
  episode?: {
    number: number;
    tmdbId: string;
    title: string;
  };
  season?: {
    number: number;
    tmdbId: string;
    title: string;
  };
}

// Output format for successful scrape
export interface RunOutput {
  sourceId: string;
  provider: string;
  streamType: "hls" | "file"; // Stream type from backend
  selectedServer: string; // Selected server name
  url: string; // Selected server URL
  servers: Record<string, string>; // All available servers for failover
  subtitles: StreamResponse["subtitles"];
  headers?: Record<string, string>;
}

// Normalized provider interface for internal use
interface NormalizedProvider {
  id: string;
  name: string;
  rank: number;
  type: "source" | "embed";
  isFebbox: boolean;
}

/**
 * Normalizes providers from different sources to a common format
 */
function normalizeProvider(
  provider: Provider | FebboxSource,
): NormalizedProvider {
  // Check if it's a FebboxSource (has 'id' property)
  if ("id" in provider && provider.id === "febbox") {
    return {
      id: provider.id,
      name: provider.name,
      rank: provider.rank,
      type: provider.type,
      isFebbox: true,
    };
  }

  // It's a backend Provider (uses 'codename')
  const p = provider as Provider;
  return {
    id: p.codename,
    name: p.codename, // Use codename as display name
    rank: p.rank,
    type: p.type,
    isFebbox: false,
  };
}

/**
 * Fetches available providers from the backend API
 * Cached to prevent duplicate requests
 */
let cachedProviders: NormalizedProvider[] | null = null;
let providerFetchPromise: Promise<NormalizedProvider[]> | null = null;

async function getAvailableProviders(): Promise<NormalizedProvider[]> {
  // Return cached providers if available
  if (cachedProviders) {
    return cachedProviders;
  }

  // Return existing promise if already fetching (deduplication)
  if (providerFetchPromise) {
    return providerFetchPromise;
  }

  providerFetchPromise = (async () => {
    try {
      // eslint-disable-next-line no-console
      console.log("[DEBUG] Fetching providers from backend...");
      const response = await backendClient.getProviders();
      // eslint-disable-next-line no-console
      console.log("[DEBUG] Backend response:", response);

      // Backend returns {sources: [...], embeds: [...]}
      const backendProviders = response.sources || [];
      // eslint-disable-next-line no-console
      console.log("[DEBUG] Backend providers:", backendProviders);

      const febboxSources = febboxClient.getSources();
      // eslint-disable-next-line no-console
      console.log("[DEBUG] Febbox sources:", febboxSources);

      // Normalize all providers
      const allProviders = [
        ...backendProviders.map(normalizeProvider),
        ...febboxSources.map(normalizeProvider),
      ];
      // eslint-disable-next-line no-console
      console.log("[DEBUG] All normalized providers:", allProviders);

      // Cache the result
      cachedProviders = allProviders;
      return allProviders;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[DEBUG] Failed to fetch providers:", error);
      // Return febbox as fallback if backend fails
      const fallback = febboxClient.getSources().map(normalizeProvider);
      cachedProviders = fallback;
      return fallback;
    } finally {
      providerFetchPromise = null;
    }
  })();

  return providerFetchPromise;
}

function useBaseScrape() {
  const [sources, setSources] = useState<Record<string, ScrapingSegment>>({});
  const [sourceOrder, setSourceOrder] = useState<ScrapingItems[]>([]);
  const [currentSource, setCurrentSource] = useState<string>();

  const initSources = useCallback(
    async (providerList: NormalizedProvider[]) => {
      const initialSources = providerList
        .map((provider) => {
          const out: ScrapingSegment = {
            name: provider.name,
            id: provider.id,
            status: "waiting",
            percentage: 0,
          };
          return out;
        })
        .reduce<Record<string, ScrapingSegment>>((a, v) => {
          a[v.id] = v;
          return a;
        }, {});

      setSources(initialSources);
      setSourceOrder(providerList.map((v) => ({ id: v.id, children: [] })));
    },
    [],
  );

  const updateSourceStatus = useCallback(
    (
      id: string,
      status: ScrapingSegment["status"],
      percentage: number,
      reason?: string,
      error?: any,
    ) => {
      setSources((s) => {
        if (s[id]) {
          s[id].status = status;
          s[id].percentage = percentage;
          if (reason) s[id].reason = reason;
          if (error) s[id].error = error;
        }
        return { ...s };
      });
    },
    [],
  );

  const setCurrentSourceId = useCallback((id: string) => {
    setCurrentSource(id);
  }, []);

  return {
    sources,
    sourceOrder,
    currentSource,
    initSources,
    updateSourceStatus,
    setCurrentSourceId,
  };
}

export function useScrape() {
  const {
    sources,
    sourceOrder,
    currentSource,
    initSources,
    updateSourceStatus,
    setCurrentSourceId,
  } = useBaseScrape();

  const preferredSourceOrder = usePreferencesStore((s) => s.sourceOrder);
  const enableSourceOrder = usePreferencesStore((s) => s.enableSourceOrder);
  const lastSuccessfulSource = usePreferencesStore(
    (s) => s.lastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );
  const disabledSources = usePreferencesStore((s) => s.disabledSources);

  const startScraping = useCallback(
    async (media: ScrapeMedia): Promise<RunOutput | null> => {
      // Get all available providers (already normalized) - with timeout
      const availableProviders = await withTimeout(
        getAvailableProviders(),
        TIMEOUTS.PROVIDER_LIST,
        "Failed to fetch provider list",
      );
      let providerIds = availableProviders.map((p) => p.id);

      // Apply user preferences for source order
      if (enableSourceOrder && preferredSourceOrder.length > 0) {
        const customOrder = preferredSourceOrder.filter(
          (id) => !disabledSources.includes(id) && providerIds.includes(id),
        );
        const remainingProviders = providerIds.filter(
          (id) => !customOrder.includes(id) && !disabledSources.includes(id),
        );
        providerIds = [...customOrder, ...remainingProviders];
      } else {
        providerIds = providerIds.filter((id) => !disabledSources.includes(id));
      }

      // Prioritize last successful source if enabled
      if (enableLastSuccessfulSource && lastSuccessfulSource) {
        if (
          !disabledSources.includes(lastSuccessfulSource) &&
          providerIds.includes(lastSuccessfulSource)
        ) {
          providerIds = [
            lastSuccessfulSource,
            ...providerIds.filter((id) => id !== lastSuccessfulSource),
          ];
        }
      }

      // Filter available providers based on ordered IDs
      const orderedProviders = providerIds
        .map((id) => availableProviders.find((p) => p.id === id))
        .filter((p): p is NormalizedProvider => p !== undefined);

      // Initialize UI
      await initSources(orderedProviders);

      // Try each provider in order
      for (const provider of orderedProviders) {
        setCurrentSourceId(provider.id);
        updateSourceStatus(provider.id, "pending", 50);

        try {
          if (provider.isFebbox) {
            // Use Febbox client
            const febboxStream = await febboxClient.getStream({
              tmdbId: media.tmdbId,
              type: media.type,
              title: media.title,
              season: media.season?.number,
              episode: media.episode?.number,
            });

            if (febboxStream) {
              updateSourceStatus(provider.id, "success", 100);
              const servers = { Primary: febboxStream.playlist };

              // Track successful scrape
              analytics.track("scrape_complete", {
                provider: "Febbox",
                success: true,
                duration_ms: 0,
                servers_found: 1,
              });

              return {
                sourceId: provider.id,
                provider: "Febbox",
                streamType: "hls" as const,
                selectedServer: "Primary",
                url: febboxStream.playlist,
                servers,
                subtitles: [],
              };
            }
            updateSourceStatus(
              provider.id,
              "notfound",
              100,
              "No streams found",
            );
          } else {
            // Use backend client with actual API
            // Wrap with timeout to prevent hanging on unresponsive providers
            let response: StreamResponse;

            try {
              if (media.type === "movie") {
                response = await withTimeout(
                  backendClient.scrapeMovie(media.tmdbId, provider.id),
                  TIMEOUTS.PROVIDER_SCRAPE,
                  `Provider ${provider.name} timed out`,
                );
              } else {
                // TV show
                const season = media.season?.number ?? 1;
                const episode = media.episode?.number ?? 1;
                response = await withTimeout(
                  backendClient.scrapeShow(
                    media.tmdbId,
                    season,
                    episode,
                    provider.id,
                  ),
                  TIMEOUTS.PROVIDER_SCRAPE,
                  `Provider ${provider.name} timed out`,
                );
              }
            } catch (timeoutError: any) {
              // Timeout or other error - mark as failed and continue to next
              updateSourceStatus(
                provider.id,
                "failure",
                100,
                timeoutError.message || "Provider failed",
              );
              analytics.track("stream_failure", {
                provider: provider.name,
                server: "unknown",
                error: timeoutError.message || "Timeout",
              });
              continue; // Skip to next provider
            }

            // Check if we got valid servers
            if (response.servers && Object.keys(response.servers).length > 0) {
              // Auto-select best server
              const bestServer = await selectBestServer(response.servers);

              if (!bestServer) {
                analytics.track("stream_failure", {
                  provider: provider.name,
                  server: "all",
                  error: "All servers failed validation",
                });
                updateSourceStatus(
                  provider.id,
                  "notfound",
                  100,
                  "No valid servers",
                );
                continue; // Try next provider
              }

              // Track successful scrape
              analytics.track("scrape_complete", {
                provider: provider.name,
                success: true,
                duration_ms: 0,
                servers_found: Object.keys(response.servers).length,
              });

              updateSourceStatus(provider.id, "success", 100);
              return {
                sourceId: provider.id,
                provider: provider.name,
                streamType: response.type,
                selectedServer: bestServer.server,
                url: bestServer.url,
                servers: response.servers,
                subtitles: response.subtitles,
                headers: response.headers,
              };
            }
            updateSourceStatus(
              provider.id,
              "notfound",
              100,
              "No streams found",
            );
          }
        } catch (error: any) {
          // Check for "not found" indicators in error
          const errorString = error.toString().toLowerCase();
          const errorMessage = (error.message || "").toLowerCase();

          const isNotFound =
            errorString.includes("couldn't find a stream") ||
            errorString.includes("no streams found") ||
            errorMessage.includes("couldn't find a stream") ||
            errorMessage.includes("no streams found") ||
            errorMessage.includes("404") ||
            errorMessage.includes("500");

          updateSourceStatus(
            provider.id,
            isNotFound ? "notfound" : "failure",
            100,
            error.message || error.toString(),
            error,
          );
        }
      }

      return null;
    },
    [
      initSources,
      updateSourceStatus,
      setCurrentSourceId,
      preferredSourceOrder,
      enableSourceOrder,
      lastSuccessfulSource,
      enableLastSuccessfulSource,
      disabledSources,
    ],
  );

  return {
    startScraping,
    sourceOrder,
    sources,
    currentSource,
  };
}

export function useListCenter(
  containerRef: RefObject<HTMLDivElement | null>,
  listRef: RefObject<HTMLDivElement | null>,
  sourceOrder: ScrapingItems[],
  currentSource: string | undefined,
) {
  const [renderedOnce, setRenderedOnce] = useState(false);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    if (!listRef.current) return;

    const elements = [
      ...listRef.current.querySelectorAll("div[data-source-id]"),
    ] as HTMLDivElement[];

    const currentIndex = elements.findIndex(
      (e) => e.getAttribute("data-source-id") === currentSource,
    );

    const currentElement = elements[currentIndex];

    if (!currentElement) return;

    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const listWidth = listRef.current.getBoundingClientRect().width;

    const containerHeight = containerRef.current.getBoundingClientRect().height;

    const listTop = listRef.current.getBoundingClientRect().top;

    const currentTop = currentElement.getBoundingClientRect().top;
    const currentHeight = currentElement.getBoundingClientRect().height;

    const topDifference = currentTop - listTop;

    const listNewLeft = containerWidth / 2 - listWidth / 2;
    const listNewTop = containerHeight / 2 - topDifference - currentHeight / 2;

    listRef.current.style.transform = `translateY(${listNewTop}px) translateX(${listNewLeft}px)`;
    setTimeout(() => {
      setRenderedOnce(true);
    }, 150);
  }, [currentSource, containerRef, listRef, setRenderedOnce]);

  const updatePositionRef = useRef(updatePosition);

  useEffect(() => {
    updatePosition();
    updatePositionRef.current = updatePosition;
  }, [updatePosition, sourceOrder]);

  useEffect(() => {
    function resize() {
      updatePositionRef.current();
    }
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return renderedOnce;
}
