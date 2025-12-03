import { Suspense } from "react";
import { lazyWithPreload } from "react-lazy-with-preload";
import { useParams } from "react-router-dom";

const PlayerView = lazyWithPreload(() => import("@/pages/PlayerView"));

/**
 * Standalone Movie Player
 * Route: /movie/:tmdbId
 * Keeps the URL as /movie/:tmdbId in the browser
 */
export function StandaloneMoviePlayer() {
  const { tmdbId } = useParams<{ tmdbId: string }>();

  if (!tmdbId) return null;

  // We need to trick the PlayerView into thinking it's on the /media route
  // by creating a custom Route that provides the correct params
  return (
    <Suspense fallback={null}>
      <PlayerView media={`tmdb-movie-${tmdbId}`} isStandalone />
    </Suspense>
  );
}

/**
 * Standalone TV Show Player
 * Route: /tv/:tmdbId/:season/:episode
 * Keeps the URL as /tv/:tmdbId/:season/:episode in the browser
 */
export function StandaloneTVPlayer() {
  const { tmdbId, season, episode } = useParams<{
    tmdbId: string;
    season: string;
    episode: string;
  }>();

  if (!tmdbId || !season || !episode) return null;

  return (
    <Suspense fallback={null}>
      <PlayerView
        media={`tmdb-tv-${tmdbId}`}
        season={season}
        episode={episode}
        isStandalone
      />
    </Suspense>
  );
}
