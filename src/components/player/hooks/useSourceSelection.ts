import { useAsyncFn } from "react-use";

import { febboxClient } from "@/backend/api/febbox";
import { backendClient } from "@/backend/api/vidninja";
// Extension imports removed
import {
  scrapeSourceOutputToProviderMetric,
  useReportProviders,
} from "@/backend/helpers/report";
import { convertProviderCaption } from "@/components/player/utils/captions";
import { convertRunoutputToSource } from "@/components/player/utils/convertRunoutputToSource";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { RunOutput } from "@/hooks/useProviderScrape";
import { metaToScrapeMedia } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";
import { useProgressStore } from "@/stores/progress";
import analytics from "@/utils/analytics";
import { selectBestServer } from "@/utils/serverValidator";
import { getCachedStream, setCachedStream } from "@/utils/streamCache";
import { TIMEOUTS, withTimeout } from "@/utils/timeout";

function getSavedProgress(items: Record<string, any>, meta: any): number {
  const item = items[meta?.tmdbId ?? ""];
  if (!item || !meta) return 0;
  if (meta.type === "movie") {
    if (!item.progress) return 0;
    return item.progress.watched;
  }

  const ep = item.episodes[meta.episode?.tmdbId ?? ""];
  if (!ep) return 0;
  return ep.progress.watched;
}

// Note: VidNinja API doesn't support embed scraping separately
export function useEmbedScraping(
  routerId: string,
  _sourceId: string,
  _url: string,
  _embedId: string,
) {
  const router = useOverlayRouter(routerId);

  const [request, run] = useAsyncFn(async () => {
    router.close();
  }, [router]);

  return {
    run,
    loading: request.loading,
    errored: !!request.error,
  };
}

// Global cache for in-flight requests to prevent duplicates across component remounts
const inflightRequests = new Map<string, Promise<any>>();

export function useSourceScraping(sourceId: string | null, routerId: string) {
  const meta = usePlayerStore((s) => s.meta);
  const setSource = usePlayerStore((s) => s.setSource);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const setSourceId = usePlayerStore((s) => s.setSourceId);
  const setEmbedId = usePlayerStore((s) => (s as any).setEmbedId);
  // Provider switch - pause/resume methods
  const pauseCurrentPlayback = usePlayerStore((s) => s.pauseCurrentPlayback);
  const resumeCurrentPlayback = usePlayerStore((s) => s.resumeCurrentPlayback);
  const progressItems = useProgressStore((s) => s.items);
  const router = useOverlayRouter(routerId);
  const { report } = useReportProviders();
  const setLastSuccessfulSource = usePreferencesStore(
    (s) => s.setLastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );
  const scrapeSessionId = usePlayerStore((s) => s.scrapeSessionId);
  const sessionProviders = usePlayerStore((s) => s.sessionProviders);

  const [request, run] = useAsyncFn(async () => {
    if (!sourceId || !meta) return null;

    // Deduplication Key
    const cacheKey = `${meta.tmdbId}:${sourceId}`;

    // Return existing promise if already in flight
    if (inflightRequests.has(cacheKey)) {
      return inflightRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      const scrapeMedia = metaToScrapeMedia(meta);
      const startTime = performance.now();

      // Pause current playback while we fetch the new provider
      pauseCurrentPlayback();

      try {
        let runOutput: RunOutput | null = null;

        // Check cache first for faster loading
        const cachedStream = getCachedStream(
          scrapeMedia.tmdbId,
          scrapeMedia.type,
          sourceId,
          scrapeMedia.season?.number,
          scrapeMedia.episode?.number,
        );

        if (cachedStream) {
          // Use cached stream - much faster!
          runOutput = cachedStream;
        } else if (sourceId === "febbox") {
          // Use Febbox client
          const febboxStream = await febboxClient.getStream({
            tmdbId: scrapeMedia.tmdbId,
            type: scrapeMedia.type,
            title: scrapeMedia.title,
            season: scrapeMedia.season?.number,
            episode: scrapeMedia.episode?.number,
          });

          if (febboxStream) {
            runOutput = {
              sourceId,
              provider: "Febbox",
              streamType: "hls",
              selectedServer: "Primary",
              url: febboxStream.playlist,
              servers: { Primary: febboxStream.playlist },
              subtitles: [],
            };
          }
        } else {
          // Use backend client with new API - with timeout
          let response: any; // StreamResponse
          const sessionProvider = sessionProviders?.find(
            (p) => p.name.toLowerCase() === sourceId.toLowerCase(),
          );

          if (scrapeSessionId && sessionProvider) {
            // Use session-based scraping (Fast/Cached)
            response = await withTimeout(
              scrapeMedia.type === "movie"
                ? backendClient.scrapeMovie(
                    scrapeMedia.tmdbId,
                    undefined,
                    scrapeSessionId,
                    sessionProvider.index.toString(),
                  )
                : backendClient.scrapeShow(
                    scrapeMedia.tmdbId,
                    scrapeMedia.season?.number ?? 1,
                    scrapeMedia.episode?.number ?? 1,
                    undefined,
                    scrapeSessionId,
                    sessionProvider.index.toString(),
                  ),
              TIMEOUTS.PROVIDER_SCRAPE,
              `Provider ${sourceId} timed out`,
            );
          } else {
            // Legacy/Direct scraping
            response = await withTimeout(
              scrapeMedia.type === "movie"
                ? backendClient.scrapeMovie(scrapeMedia.tmdbId, sourceId)
                : backendClient.scrapeShow(
                    scrapeMedia.tmdbId,
                    scrapeMedia.season?.number ?? 1,
                    scrapeMedia.episode?.number ?? 1,
                    sourceId,
                  ),
              TIMEOUTS.PROVIDER_SCRAPE,
              `Provider ${sourceId} timed out`,
            );
          }

          // Check if we got valid servers
          if (response.servers && Object.keys(response.servers).length > 0) {
            // Auto-select best server
            const bestServer = await selectBestServer(response.servers);

            if (bestServer) {
              runOutput = {
                sourceId,
                provider: sourceId,
                streamType: response.type,
                selectedServer: bestServer.server,
                url: bestServer.url,
                servers: response.servers,
                subtitles: response.subtitles || response.captions || [],
                headers: response.headers,
              };
            } else {
              analytics.track("stream_failure", {
                provider: sourceId,
                server: "all",
                error: "All servers failed validation",
              });
            }
          }
        }

        const duration = Math.round(performance.now() - startTime);

        if (runOutput) {
          // Track successful scrape
          analytics.track("scrape_complete", {
            provider: runOutput.provider,
            success: true,
            duration_ms: duration,
            servers_found: Object.keys(runOutput.servers).length,
          });

          report([
            scrapeSourceOutputToProviderMetric(
              meta,
              sourceId,
              null,
              "success",
              null,
            ),
          ]);

          // Extension removed - prepareStream call removed

          setEmbedId(null);
          setCaption(null);
          setSource(
            convertRunoutputToSource(runOutput),
            convertProviderCaption(runOutput.subtitles),
            getSavedProgress(progressItems, meta),
            [],
          );
          setSourceId(sourceId);

          if (enableLastSuccessfulSource) {
            setLastSuccessfulSource(sourceId);
          }

          // Track stream play
          analytics.track("stream_play", {
            provider: runOutput.provider,
            server: runOutput.selectedServer,
            tmdbId: scrapeMedia.tmdbId,
            type: scrapeMedia.type,
          });

          // Cache the successful stream for faster replay
          if (!cachedStream) {
            setCachedStream(
              scrapeMedia.tmdbId,
              scrapeMedia.type,
              sourceId,
              runOutput,
              scrapeMedia.season?.number,
              scrapeMedia.episode?.number,
            );
          }

          router.close();
          return null;
        }

        // No stream found - resume previous playback
        resumeCurrentPlayback();
        report([
          scrapeSourceOutputToProviderMetric(
            meta,
            sourceId,
            null,
            "notfound",
            null,
          ),
        ]);
        throw new Error("No stream found");
      } catch (err) {
        // Resume previous playback on error
        resumeCurrentPlayback();
        // eslint-disable-next-line no-console
        console.error(`Failed to scrape ${sourceId}`, err);

        analytics.track("stream_failure", {
          provider: sourceId,
          server: "unknown",
          error: err instanceof Error ? err.message : String(err),
        });

        const status =
          err instanceof Error && err.message.includes("Couldn't find")
            ? "notfound"
            : "failed";
        report([
          scrapeSourceOutputToProviderMetric(meta, sourceId, null, status, err),
        ]);
        throw err;
      }
    })();

    // Store the promise in the cache
    inflightRequests.set(cacheKey, requestPromise);

    // Clean up cache when promise settles
    return requestPromise.finally(() => {
      inflightRequests.delete(cacheKey);
    });
  }, [
    sourceId,
    meta,
    router,
    setCaption,
    enableLastSuccessfulSource,
    setLastSuccessfulSource,
    report,
    scrapeSessionId,
    sessionProviders,
  ]);

  return {
    run,
    watching: (request.value ?? null) === null,
    loading: request.loading,
    items: request.value,
    notfound: !!(
      request.error instanceof Error &&
      request.error.message.includes("Couldn't find")
    ),
    errored: !!request.error,
  };
}

function isExtensionActiveCached() {
  throw new Error("Function not implemented.");
}

function prepareStream(arg0: any) {
  throw new Error("Function not implemented.");
}
