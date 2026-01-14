import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { febboxClient } from "@/backend/api/febbox";
import type {
  FebboxSource,
  Provider,
  StreamResponse,
} from "@/backend/api/types";
import { backendClient } from "@/backend/api/vidninja";
import { usePlayerStore } from "@/stores/player/store";
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
  session?: string; // New session ID
  availableProviders?: { index: number; name: string; status: string }[]; // Available providers in session
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
      const response = await backendClient.getProviders();

      // Backend returns {sources: [...], embeds: [...]}
      const backendProviders = response.sources || [];

      const febboxSources = febboxClient.getSources();

      // Normalize all providers
      const allProviders = [
        ...backendProviders.map(normalizeProvider),
        ...febboxSources.map(normalizeProvider),
      ];

      // Cache the result
      cachedProviders = allProviders;
      return allProviders;
    } catch (error) {
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

  const setSourceList = useCallback((list: NormalizedProvider[]) => {
    const initialSources = list
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
    setSourceOrder(list.map((v) => ({ id: v.id, children: [] })));
  }, []);

  return {
    sources,
    sourceOrder,
    currentSource,
    initSources,
    setSourceList,
    updateSourceStatus,
    setCurrentSourceId,
    setSources,
  };
}

export function useScrape() {
  const {
    sources,
    sourceOrder,
    currentSource,
    initSources,
    setSourceList,
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

  // Get failed providers from player store (providers that had HLS playback errors)
  const failedProviders = usePlayerStore((s) => s.failedProviders);
  const setScrapeSessionId = usePlayerStore((s) => s.setScrapeSessionId);
  const setSessionProviders = usePlayerStore((s) => s.setSessionProviders);

  const startScraping = useCallback(
    async (media: ScrapeMedia): Promise<RunOutput | null> => {
      // Clear previous sources/status
      initSources([]);
      setCurrentSourceId("scraper");
      setScrapeSessionId(null);
      setSessionProviders([]);

      try {
        let response: StreamResponse;

        // Call backend (Auto Mode) - single request handles parallel scraping
        if (media.type === "movie") {
          response = await backendClient.scrapeMovie(media.tmdbId, undefined);
        } else {
          const season = media.season?.number ?? 1;
          const episode = media.episode?.number ?? 1;
          response = await backendClient.scrapeShow(
            media.tmdbId,
            season,
            episode,
            undefined,
          );
        }

        // Process available providers from backend response
        if (response.availableProviders) {
          const providersList: NormalizedProvider[] =
            response.availableProviders.map((p) => ({
              id: p.name,
              name: p.name,
              rank: p.index,
              type: "source",
              isFebbox: false,
            }));
          setSourceList(providersList);

          // Update status based on backend status
          response.availableProviders.forEach((p) => {
            updateSourceStatus(
              p.name,
              p.status === "success"
                ? "success"
                : p.status === "failure"
                  ? "failure"
                  : "pending",
              p.status === "success" ? 100 : 50,
            );
          });
        }

        // Check for success
        if (response.servers && Object.keys(response.servers).length > 0) {
          const bestServer = await selectBestServer(response.servers);

          if (
            response.selectedProvider !== undefined &&
            response.availableProviders
          ) {
            const providerName =
              response.availableProviders.find(
                (p) => p.index === response.selectedProvider,
              )?.name || "Unknown";
            setCurrentSourceId(providerName);
            updateSourceStatus(providerName, "success", 100);
          }

          if (!bestServer) {
            return null;
          }

          return {
            sourceId: response.selectedProvider?.toString() || "session",
            provider: "Auto",
            streamType: response.type,
            selectedServer: bestServer.server,
            url: bestServer.url,
            servers: response.servers,
            subtitles: response.subtitles || response.captions || [],
            headers: response.headers,
            session: response.session,
            availableProviders: response.availableProviders,
          };
        }
      } catch (error: any) {
        console.error("Scraping failed:", error);
        // If error has session data (as returned by updated vidninja client)
        if (error.session && error.availableProviders) {
          const providersList: NormalizedProvider[] =
            error.availableProviders.map((p: any) => ({
              id: p.name,
              name: p.name,
              rank: p.index,
              type: "source",
              isFebbox: false,
            }));
          setSourceList(providersList);
          error.availableProviders.forEach((p: any) => {
            updateSourceStatus(
              p.name,
              p.status === "success" ? "success" : "failure",
              100,
            );
          });
        }
      }

      return null;
    },
    [
      initSources,
      setSourceList,
      updateSourceStatus,
      setCurrentSourceId,
      setScrapeSessionId,
      setSessionProviders,
    ],
  );

  const switchProvider = useCallback(
    async (
      media: ScrapeMedia,
      session: string,
      providerIndex: string,
    ): Promise<RunOutput | null> => {
      // Switch provider using cached session
      try {
        let response: StreamResponse;
        if (media.type === "movie") {
          response = await backendClient.scrapeMovie(
            media.tmdbId,
            undefined,
            session,
            providerIndex,
          );
        } else {
          const season = media.season?.number ?? 1;
          const episode = media.episode?.number ?? 1;
          response = await backendClient.scrapeShow(
            media.tmdbId,
            season,
            episode,
            undefined,
            session,
            providerIndex,
          );
        }

        if (response.servers && Object.keys(response.servers).length > 0) {
          const bestServer = await selectBestServer(response.servers);
          if (!bestServer) return null;

          return {
            sourceId: providerIndex,
            provider:
              response.availableProviders?.find(
                (p) => p.index === parseInt(providerIndex),
              )?.name || "Manual",
            streamType: response.type,
            selectedServer: bestServer.server,
            url: bestServer.url,
            servers: response.servers,
            subtitles: response.subtitles || response.captions || [],
            headers: response.headers,
            session: response.session,
            availableProviders: response.availableProviders,
          };
        }
      } catch (error) {
        console.error("Switch provider failed", error);
      }
      return null;
    },
    [],
  ); // Dependencies

  return {
    startScraping,
    switchProvider,
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
