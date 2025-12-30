import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { useMountedState } from "react-use";

import {
  scrapePartsToProviderMetric,
  useReportProviders,
} from "@/backend/helpers/report";
import { Button } from "@/components/buttons/Button";
import { Loading } from "@/components/layout/Loading";
import {
  RunOutput,
  ScrapeMedia,
  ScrapingItems,
  ScrapingSegment,
  useScrape,
} from "@/hooks/useProviderScrape";
import { useTranslation } from "react-i18next";

import { WarningPart } from "../util/WarningPart";

export interface ScrapingProps {
  media: ScrapeMedia;
  onGetStream?: (stream: RunOutput | null) => void;
  onResult?: (
    sources: Record<string, ScrapingSegment>,
    sourceOrder: ScrapingItems[],
  ) => void;
}

export function ScrapingPart(props: ScrapingProps) {
  const { report } = useReportProviders();
  const { startScraping, sourceOrder, sources } = useScrape();
  const isMounted = useMountedState();
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failedStartScrape, setFailedStartScrape] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const resultRef = useRef({
    sourceOrder,
    sources,
  });
  useEffect(() => {
    resultRef.current = {
      sourceOrder,
      sources,
    };
  }, [sourceOrder, sources]);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const output = await startScraping(props.media);
      if (!isMounted()) return;

      // Always report provider metrics for analytics
      report(
        scrapePartsToProviderMetric(
          props.media,
          resultRef.current.sourceOrder,
          resultRef.current.sources,
        ),
      );

      // If no stream was found, call onResult to show error
      if (!output) {
        props.onResult?.(
          resultRef.current.sources,
          resultRef.current.sourceOrder,
        );
      }

      // Always call onGetStream with the result (null or stream)
      props.onGetStream?.(output);
    })().catch(() => setFailedStartScrape(true));
  }, [startScraping, props, report, isMounted]);

  if (failedStartScrape)
    return <WarningPart>{t("player.turnstile.error")}</WarningPart>;

  return (
    <div
      className="h-full w-full relative flex items-center justify-center"
      ref={containerRef}
    >
      {/* Backdrop Image */}
      {props.media.backdropPath && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={props.media.backdropPath}
            className={classNames(
              "absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-opacity duration-300",
              imageLoaded ? "opacity-30" : "opacity-0",
            )}
            onLoad={() => setImageLoaded(true)}
            alt=""
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="mb-8 scale-250">
          <Loading />
        </div>
      </div>
    </div>
  );
}

export function ScrapingPartInterruptButton() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 pb-3">
      <Button
        href="/"
        theme="secondary"
        padding="md:px-17 p-3"
        className="mt-6"
      >
        {t("notFound.goHome")}
      </Button>
      <Button
        onClick={() => window.location.reload()}
        theme="purple"
        padding="md:px-17 p-3"
        className="mt-6"
      >
        {t("notFound.reloadButton")}
      </Button>
    </div>
  );
}

export function Tips() {
  const { t } = useTranslation();
  const [_tip] = useState(() => {
    const randomIndex = Math.floor(Math.random() * 11) + 1;
    return t(`player.scraping.tips.${randomIndex}`);
  });

  return <div className="flex flex-col gap-3" />;
}
