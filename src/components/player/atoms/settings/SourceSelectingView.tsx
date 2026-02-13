import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { getCachedMetadata } from "@/backend/api/metadata";
import { Loading } from "@/components/layout/Loading";
import { useSourceScraping } from "@/components/player/hooks/useSourceSelection";
import { Menu } from "@/components/player/internals/ContextMenu";
import { SelectableLink } from "@/components/player/internals/ContextMenu/Links";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

export interface SourceSelectionViewProps {
  id: string;
  onChoose?: (id: string) => void;
}

export interface EmbedSelectionViewProps {
  id: string;
  sourceId: string | null;
}

// Legacy EmbedSelectionView - kept for compatibility but rarely used
export function EmbedSelectionView({ sourceId, id }: EmbedSelectionViewProps) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const { run, watching, notfound, loading, items, errored } =
    useSourceScraping(sourceId, id);

  const sourceName = useMemo(() => {
    if (!sourceId) return "...";
    const sourceMeta = getCachedMetadata().find((s) => s.id === sourceId);
    return sourceMeta?.name ?? "...";
  }, [sourceId]);

  const lastSourceId = useRef<string | null>(null);
  useEffect(() => {
    if (lastSourceId.current === sourceId) return;
    lastSourceId.current = sourceId;
    if (!sourceId) return;
    run();
  }, [run, sourceId]);

  let content: ReactNode = null;
  if (loading)
    content = (
      <Menu.TextDisplay noIcon>
        <Loading />
      </Menu.TextDisplay>
    );
  else if (notfound)
    content = (
      <Menu.TextDisplay
        title={t("player.menus.sources.noStream.title") ?? undefined}
      >
        {t("player.menus.sources.noStream.text")}
      </Menu.TextDisplay>
    );
  else if (errored)
    content = (
      <Menu.TextDisplay
        title={t("player.menus.sources.failed.title") ?? undefined}
      >
        {t("player.menus.sources.failed.text")}
      </Menu.TextDisplay>
    );
  else if (watching) content = null;
  else if (items) {
    content = (
      <Menu.TextDisplay>
        {t("player.menus.sources.noEmbeds.text")}
      </Menu.TextDisplay>
    );
  }

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/source")}>
        {sourceName}
      </Menu.BackLink>
      <Menu.Section>{content}</Menu.Section>
    </>
  );
}

export function SourceSelectionView({
  id,
  onChoose,
}: SourceSelectionViewProps) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const metaType = usePlayerStore((s) => s.meta?.type);
  const currentSourceId = usePlayerStore((s) => s.sourceId);
  const preferredSourceOrder = usePreferencesStore((s) => s.sourceOrder);
  const enableSourceOrder = usePreferencesStore((s) => s.enableSourceOrder);
  const lastSuccessfulSource = usePreferencesStore(
    (s) => s.lastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );
  const disabledSources = usePreferencesStore((s) => s.disabledSources);
  const providerNames = usePreferencesStore((s) => s.providerNames);

  // Track which source is currently loading
  const [loadingSourceId, setLoadingSourceId] = useState<string | null>(null);
  const [errorSourceId, setErrorSourceId] = useState<string | null>(null);
  const lastFetchedSourceId = useRef<string | null>(null);

  const performPlay = usePlayerStore((s) => s.play);
  const performPause = usePlayerStore((s) => s.pause);
  const setIsLoading = usePlayerStore((s) => s.setIsLoading);

  // Use scraping hook for the selected source
  const { run, loading, errored } = useSourceScraping(loadingSourceId, id);

  // Start scraping when a source is selected
  useEffect(() => {
    if (loadingSourceId && lastFetchedSourceId.current !== loadingSourceId) {
      lastFetchedSourceId.current = loadingSourceId; // Mark as fetched immediately
      setErrorSourceId(null);
      run()
        .then(() => {
          setLoadingSourceId(null);
          setIsLoading(false);
        })
        .catch(() => {
          setErrorSourceId(loadingSourceId);
          setLoadingSourceId(null);
          setIsLoading(false);
          performPlay();
        });
    }
  }, [loadingSourceId, run, performPlay, setIsLoading]);

  // Handle errors
  useEffect(() => {
    if (errored && loadingSourceId) {
      setErrorSourceId(loadingSourceId);
      setLoadingSourceId(null);
      setIsLoading(false);
    }
  }, [errored, loadingSourceId, setIsLoading]);

  const sources = useMemo(() => {
    if (!metaType) return [];
    const allSources = getCachedMetadata()
      .filter((v) => v.type === "source")
      .filter((v) => !v.mediaTypes || v.mediaTypes.includes(metaType))
      .filter((v) => !disabledSources.includes(v.id));

    if (!enableSourceOrder || preferredSourceOrder.length === 0) {
      if (enableLastSuccessfulSource && lastSuccessfulSource) {
        const lastSourceIndex = allSources.findIndex(
          (s) => s.id === lastSuccessfulSource,
        );
        if (lastSourceIndex !== -1) {
          const lastSource = allSources.splice(lastSourceIndex, 1)[0];
          return [lastSource, ...allSources];
        }
      }
      return allSources;
    }

    const orderedSources = [];
    const remainingSources = [...allSources];

    if (enableLastSuccessfulSource && lastSuccessfulSource) {
      const lastSourceIndex = remainingSources.findIndex(
        (s) => s.id === lastSuccessfulSource,
      );
      if (lastSourceIndex !== -1) {
        orderedSources.push(remainingSources[lastSourceIndex]);
        remainingSources.splice(lastSourceIndex, 1);
      }
    }

    for (const sourceId of preferredSourceOrder) {
      const sourceIndex = remainingSources.findIndex((s) => s.id === sourceId);
      if (sourceIndex !== -1) {
        orderedSources.push(remainingSources[sourceIndex]);
        remainingSources.splice(sourceIndex, 1);
      }
    }

    orderedSources.push(...remainingSources);
    return orderedSources;
  }, [
    metaType,
    preferredSourceOrder,
    enableSourceOrder,
    disabledSources,
    lastSuccessfulSource,
    enableLastSuccessfulSource,
  ]);

  const handleSourceClick = (sourceId: string) => {
    if (loadingSourceId === sourceId) return;
    onChoose?.(sourceId);
    performPause();
    setIsLoading(true);
    setLoadingSourceId(sourceId);
    setErrorSourceId(null);
  };
}
