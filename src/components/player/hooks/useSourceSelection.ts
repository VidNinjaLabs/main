import { useAsyncFn } from "react-use";

import { vidNinjaClient } from "@/backend/api/vidninja";
import { isExtensionActiveCached } from "@/backend/extension/messaging";
import { prepareStream } from "@/backend/extension/streams";
import {
  scrapeSourceOutputToProviderMetric,
  useReportProviders,
} from "@/backend/helpers/report";
import { convertProviderCaption } from "@/components/player/utils/captions";
import { convertRunoutputToSource } from "@/components/player/utils/convertRunoutputToSource";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { metaToScrapeMedia } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";
import { useProgressStore } from "@/stores/progress";

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
// This is a stub for compatibility
export function useEmbedScraping(
  routerId: string,
  _sourceId: string,
  _url: string,
  _embedId: string,
) {
  const router = useOverlayRouter(routerId);

  const [request, run] = useAsyncFn(async () => {
    // VidNinja API handles embeds automatically, just close the router
    router.close();
  }, [router]);

  return {
    run,
    loading: request.loading,
    errored: !!request.error,
  };
}

export function useSourceScraping(sourceId: string | null, routerId: string) {
  const meta = usePlayerStore((s) => s.meta);
  const setSource = usePlayerStore((s) => s.setSource);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const setSourceId = usePlayerStore((s) => s.setSourceId);
  const setEmbedId = usePlayerStore((s) => (s as any).setEmbedId);
  const progressItems = useProgressStore((s) => s.items);
  const router = useOverlayRouter(routerId);
  const { report } = useReportProviders();
  const setLastSuccessfulSource = usePreferencesStore(
    (s) => s.setLastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );

  const [request, run] = useAsyncFn(async () => {
    if (!sourceId || !meta) return null;
    setEmbedId(null);
    const scrapeMedia = metaToScrapeMedia(meta);

    try {
      const result = await vidNinjaClient.getStream({
        sourceId,
        tmdbId: scrapeMedia.tmdbId,
        type: scrapeMedia.type,
        season: scrapeMedia.season?.number,
        episode: scrapeMedia.episode?.number,
      });

      if (result.stream && result.stream.length > 0) {
        const stream = result.stream[0];

        report([
          scrapeSourceOutputToProviderMetric(
            meta,
            sourceId,
            null,
            "success",
            null,
          ),
        ]);

        if (isExtensionActiveCached()) await prepareStream(stream);

        setEmbedId(null);
        setCaption(null);
        setSource(
          convertRunoutputToSource({ stream }),
          convertProviderCaption(stream.captions),
          getSavedProgress(progressItems, meta),
        );
        setSourceId(sourceId);

        if (enableLastSuccessfulSource) {
          setLastSuccessfulSource(sourceId);
        }

        router.close();
        return null;
      }

      // No stream found
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
      console.error(`Failed to scrape ${sourceId}`, err);
      const status =
        err instanceof Error && err.message.includes("Couldn't find")
          ? "notfound"
          : "failed";
      report([
        scrapeSourceOutputToProviderMetric(meta, sourceId, null, status, err),
      ]);
      throw err;
    }
  }, [
    sourceId,
    meta,
    router,
    setCaption,
    enableLastSuccessfulSource,
    setLastSuccessfulSource,
    report,
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
