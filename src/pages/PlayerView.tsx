import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DetailedMeta } from "@/backend/metadata/getmeta";
import { PremiumModal } from "@/components/overlays/PremiumModal";
import { usePlayer } from "@/components/player/hooks/usePlayer";
import { usePlayerMeta } from "@/components/player/hooks/usePlayerMeta";
import { PremiumPreRoll } from "@/components/player/internals/PremiumPreRoll";
import { convertProviderCaption } from "@/components/player/utils/captions";
import { convertRunoutputToSource } from "@/components/player/utils/convertRunoutputToSource";
import { useIsAdmin } from "@/hooks/auth/useIsAdmin";
import { useIsPremium } from "@/hooks/auth/useIsPremium";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import {
  RunOutput,
  ScrapingItems,
  ScrapingSegment,
} from "@/hooks/useProviderScrape";
import { useQueryParam } from "@/hooks/useQueryParams";
import { MetaPart } from "@/pages/parts/player/MetaPart";
import { PlaybackErrorPart } from "@/pages/parts/player/PlaybackErrorPart";
import { PlayerPart } from "@/pages/parts/player/PlayerPart";
import { ResumePart } from "@/pages/parts/player/ResumePart";
import { ScrapeErrorPart } from "@/pages/parts/player/ScrapeErrorPart";
import { ScrapingPart } from "@/pages/parts/player/ScrapingPart";
import { SourceSelectPart } from "@/pages/parts/player/SourceSelectPart";
import { useLastNonPlayerLink } from "@/stores/history";
import { PlayerMeta, playerStatus } from "@/stores/player/slices/source";
import { usePreferencesStore } from "@/stores/preferences";
import { getProgressPercentage, useProgressStore } from "@/stores/progress";
import { parseTimestamp } from "@/utils/timestamp";

// ... (other imports)

// Inside PlayerView component
// ...

// ... (other imports)

export interface PlayerViewProps {
  media?: string;
  season?: string;
  episode?: string;
  isStandalone?: boolean;
}

const ENABLE_ANTI_DEBUG = false;

export function RealPlayerView(props: PlayerViewProps) {
  const navigate = useNavigate();
  const routeParams = useParams<{
    media: string;
    episode?: string;
    season?: string;
  }>();

  // Use props if provided, otherwise fall back to route params
  const params = useMemo(
    () => ({
      media: props.media ?? routeParams.media,
      season: props.season ?? routeParams.season,
      episode: props.episode ?? routeParams.episode,
    }),
    [
      props.media,
      props.season,
      props.episode,
      routeParams.media,
      routeParams.season,
      routeParams.episode,
    ],
  );

  const [errorData, setErrorData] = useState<{
    sources: Record<string, ScrapingSegment>;
    sourceOrder: ScrapingItems[];
  } | null>(null);
  const [startAtParam] = useQueryParam("t");
  const {
    status,
    playMedia,
    reset,
    setScrapeNotFound,
    shouldStartFromBeginning,
    setShouldStartFromBeginning,
    setStatus,
  } = usePlayer();
  const { setPlayerMeta, scrapeMedia } = usePlayerMeta();
  const backUrl = useLastNonPlayerLink();
  const manualSourceSelection = usePreferencesStore(
    (s) => s.manualSourceSelection,
  );
  const setLastSuccessfulSource = usePreferencesStore(
    (s) => s.setLastSuccessfulSource,
  );
  const progressItems = useProgressStore((s) => s.items);
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  const handleBackdropLoaded = useCallback((url: string) => {
    setBackdropUrl(url);
  }, []);

  // Continuous DevTools monitoring to block API calls
  // Only enabled in production to allow development with DevTools
  useEffect(() => {
    // Skip anti-debug in development mode or if disabled
    if (import.meta.env.DEV || !ENABLE_ANTI_DEBUG) {
      return;
    }

    // Import antiDebug dynamically to avoid issues
    import("@/utils/antiDebug").then(({ antiDebug }) => {
      antiDebug.start((devToolsDetected) => {
        setIsDevToolsOpen(devToolsDetected);

        // If DevTools opens during playback, reset the player
        if (devToolsDetected && status === playerStatus.PLAYING) {
          reset();
        }
      });
    });

    return () => {
      import("@/utils/antiDebug").then(({ antiDebug }) => {
        antiDebug.stop();
      });
    };
  }, [status, reset]);

  // Auto-resume when DevTools is closed
  // This triggers a fresh scraping with new tokens
  useEffect(() => {
    // Only act if we were previously blocked and now DevTools is closed
    if (!isDevToolsOpen && status === playerStatus.IDLE) {
      // Small delay to ensure DevTools is fully closed
      const timer = setTimeout(() => {
        // Trigger a reset to restart the flow
        reset();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isDevToolsOpen, status, reset]);

  // Reset last successful source when leaving the player
  useEffect(() => {
    return () => {
      setLastSuccessfulSource(null);
    };
  }, [setLastSuccessfulSource]);

  const paramsData = JSON.stringify({
    media: params.media,
    season: params.season,
    episode: params.episode,
  });
  useEffect(() => {
    reset();
    // Reset watch party state when media changes
  }, [paramsData, reset]);

  const metaChange = useCallback(
    (meta: PlayerMeta) => {
      if (!meta) return;

      if (meta.type === "show") {
        if (props.isStandalone) {
          // Navigate to the standalone TV route
          navigate(
            `/tv/${meta.tmdbId}/${meta.season?.tmdbId}/${meta.episode?.tmdbId}`,
          );
        } else {
          navigate(
            `/media/${params.media}/${meta.season?.tmdbId}/${meta.episode?.tmdbId}`,
          );
        }
      } else if (props.isStandalone) {
        // For movies, we don't usually change metadata, but if we did:
        navigate(`/movie/${meta.tmdbId}`);
      } else {
        navigate(`/media/${params.media}`);
      }
    },
    [navigate, params, props.isStandalone],
  );

  // Check if episode is more than 80% watched
  const shouldShowResumeScreen = useCallback(
    (meta: PlayerMeta) => {
      if (!meta?.tmdbId) return false;

      const item = progressItems[meta.tmdbId];
      if (!item) return false;

      if (meta.type === "movie") {
        if (!item.progress) return false;
        const percentage = getProgressPercentage(
          item.progress.watched,
          item.progress.duration,
        );
        return percentage > 80;
      }

      if (meta.type === "show" && meta.episode?.tmdbId) {
        const episode = item.episodes?.[meta.episode.tmdbId];
        if (!episode) return false;
        const percentage = getProgressPercentage(
          episode.progress.watched,
          episode.progress.duration,
        );
        return percentage > 80;
      }

      return false;
    },
    [progressItems],
  );

  const handleMetaReceived = useCallback(
    (detailedMeta: DetailedMeta, episodeId?: string) => {
      // Don't proceed if DevTools is open - stay in loading state
      if (isDevToolsOpen) {
        return;
      }

      const playerMeta = setPlayerMeta(detailedMeta, episodeId);
      if (playerMeta && shouldShowResumeScreen(playerMeta)) {
        setStatus(playerStatus.RESUME);
      }
    },
    [shouldShowResumeScreen, setStatus, setPlayerMeta, isDevToolsOpen],
  );

  const handleResume = useCallback(() => {
    setStatus(playerStatus.SCRAPING);
  }, [setStatus]);

  const handleRestart = useCallback(() => {
    setShouldStartFromBeginning(true);
    setStatus(playerStatus.SCRAPING);
  }, [setShouldStartFromBeginning, setStatus]);

  const [showPreRoll, setShowPreRoll] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [pendingRunOutput, setPendingRunOutput] = useState<RunOutput | null>(
    null,
  );
  const isPremium = useIsPremium();
  const isAdmin = useIsAdmin();

  const handleWatchWithAds = useCallback(() => {
    setShowPreRoll(false);
    if (pendingRunOutput) {
      let startAt: number | undefined;
      if (startAtParam) startAt = parseTimestamp(startAtParam) ?? undefined;

      playMedia(
        convertRunoutputToSource(pendingRunOutput),
        convertProviderCaption(pendingRunOutput.subtitles),
        pendingRunOutput.sourceId,
        shouldStartFromBeginning ? 0 : startAt,
      );
      setShouldStartFromBeginning(false);
      setPendingRunOutput(null);
    }
  }, [
    pendingRunOutput,
    startAtParam,
    shouldStartFromBeginning,
    setShouldStartFromBeginning,
    playMedia,
  ]);

  const playAfterScrape = useCallback(
    (out: RunOutput | null) => {
      if (!out) return;

      if (
        isPremium ||
        isAdmin ||
        import.meta.env.VITE_ENABLE_PREMIUM !== "true"
      ) {
        let startAt: number | undefined;
        if (startAtParam) startAt = parseTimestamp(startAtParam) ?? undefined;

        playMedia(
          convertRunoutputToSource(out),
          convertProviderCaption(out.subtitles),
          out.sourceId,
          shouldStartFromBeginning ? 0 : startAt,
        );
        setShouldStartFromBeginning(false);
      } else {
        setPendingRunOutput(out);
        setShowPreRoll(true);
      }
    },
    [
      playMedia,
      startAtParam,
      shouldStartFromBeginning,
      setShouldStartFromBeginning,
      isPremium,
      isAdmin,
    ],
  );

  return (
    <PlayerPart
      backUrl={backUrl}
      onMetaChange={metaChange}
      backdropUrl={backdropUrl}
      isStandalone={props.isStandalone}
    >
      {showPreRoll && (
        <PremiumPreRoll
          onWatchWithAds={handleWatchWithAds}
          onGoPremium={() => setShowPremiumModal(true)}
        />
      )}

      {showPremiumModal && (
        <PremiumModal
          id="premium-modal"
          onClose={() => setShowPremiumModal(false)}
        />
      )}

      {status === playerStatus.IDLE ? (
        <MetaPart
          onGetMeta={handleMetaReceived}
          onBackdropLoaded={handleBackdropLoaded}
          backdropUrl={backdropUrl}
          media={params.media}
          season={params.season}
          episode={params.episode}
        />
      ) : null}
      {status === playerStatus.RESUME ? (
        <ResumePart
          onResume={handleResume}
          onRestart={handleRestart}
          onMetaChange={metaChange}
        />
      ) : null}
      {status === playerStatus.SCRAPING && scrapeMedia ? (
        manualSourceSelection ? (
          <SourceSelectPart media={scrapeMedia} />
        ) : (
          <ScrapingPart
            media={scrapeMedia}
            onResult={(sources, sourceOrder) => {
              setErrorData({
                sourceOrder,
                sources,
              });
              setScrapeNotFound();
            }}
            onGetStream={playAfterScrape}
          />
        )
      ) : null}
      {status === playerStatus.SCRAPE_NOT_FOUND && errorData ? (
        <ScrapeErrorPart data={errorData} />
      ) : null}
      {status === playerStatus.PLAYBACK_ERROR ? <PlaybackErrorPart /> : null}
    </PlayerPart>
  );
}

function PlayerView(props: PlayerViewProps) {
  return <RealPlayerView {...props} />;
}

export default PlayerView;
