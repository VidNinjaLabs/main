import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { febboxClient } from "@/backend/api/febbox";
import type {
  FebboxSource,
  VidNinjaSource,
  VidNinjaStreamResponse,
} from "@/backend/api/types";
import { vidNinjaClient } from "@/backend/api/vidninja";
import { usePreferencesStore } from "@/stores/preferences";

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

export interface RunOutput {
  sourceId: string;
  stream: VidNinjaStreamResponse["stream"][0];
}

async function getAvailableSources(): Promise<
  (VidNinjaSource | FebboxSource)[]
> {
  // Don't cache sources - we need to check Febbox token dynamically
  const vidNinjaSources = await vidNinjaClient.getSources();
  const febboxSources = febboxClient.getSources();

  return [...vidNinjaSources, ...febboxSources];
}

function useBaseScrape() {
  const [sources, setSources] = useState<Record<string, ScrapingSegment>>({});
  const [sourceOrder, setSourceOrder] = useState<ScrapingItems[]>([]);
  const [currentSource, setCurrentSource] = useState<string>();

  const initSources = useCallback(async (sourceIds: string[]) => {
    const availableSources = await getAvailableSources();

    const initialSources = sourceIds
      .map((id) => {
        const source = availableSources.find((s) => s.id === id);
        if (!source) return null;

        const out: ScrapingSegment = {
          name: source.name,
          id: source.id,
          status: "waiting",
          percentage: 0,
        };
        return out;
      })
      .filter((s): s is ScrapingSegment => s !== null)
      .reduce<Record<string, ScrapingSegment>>((a, v) => {
        a[v.id] = v;
        return a;
      }, {});

    setSources(initialSources);
    setSourceOrder(sourceIds.map((v) => ({ id: v, children: [] })));
  }, []);

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
      // Get all available sources
      const availableSources = await getAvailableSources();
      let sourceIds = availableSources.map((s) => s.id);

      // Apply user preferences for source order
      if (enableSourceOrder && preferredSourceOrder.length > 0) {
        const customOrder = preferredSourceOrder.filter(
          (id) => !disabledSources.includes(id) && sourceIds.includes(id),
        );
        const remainingSources = sourceIds.filter(
          (id) => !customOrder.includes(id) && !disabledSources.includes(id),
        );
        sourceIds = [...customOrder, ...remainingSources];
      } else {
        sourceIds = sourceIds.filter((id) => !disabledSources.includes(id));
      }

      // Prioritize last successful source if enabled
      if (enableLastSuccessfulSource && lastSuccessfulSource) {
        if (
          !disabledSources.includes(lastSuccessfulSource) &&
          sourceIds.includes(lastSuccessfulSource)
        ) {
          sourceIds = [
            lastSuccessfulSource,
            ...sourceIds.filter((id) => id !== lastSuccessfulSource),
          ];
        }
      }

      // Initialize UI
      await initSources(sourceIds);

      // Try each source in order
      for (const sourceId of sourceIds) {
        setCurrentSourceId(sourceId);
        updateSourceStatus(sourceId, "pending", 50);

        try {
          // Route to correct client based on source ID
          if (sourceId === "febbox") {
            // Use Febbox client
            const febboxStream = await febboxClient.getStream({
              tmdbId: media.tmdbId,
              type: media.type,
              title: media.title,
              season: media.season?.number,
              episode: media.episode?.number,
            });

            if (febboxStream) {
              updateSourceStatus(sourceId, "success", 100);
              return {
                sourceId,
                stream: febboxStream as any, // Cast to VidNinja stream type for compatibility
              };
            }
            updateSourceStatus(sourceId, "notfound", 100, "No streams found");
          } else {
            // Use VidNinja client
            const response = await vidNinjaClient.getStream({
              sourceId,
              tmdbId: media.tmdbId,
              type: media.type,
              season: media.season?.number,
              episode: media.episode?.number,
            });

            if (response.stream && response.stream.length > 0) {
              updateSourceStatus(sourceId, "success", 100);
              return {
                sourceId,
                stream: response.stream[0],
              };
            }
            updateSourceStatus(sourceId, "notfound", 100, "No streams found");
          }
        } catch (error: any) {
          const isNotFound = error.message?.includes("Couldn't find a stream");
          updateSourceStatus(
            sourceId,
            isNotFound ? "notfound" : "failure",
            100,
            error.message,
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
