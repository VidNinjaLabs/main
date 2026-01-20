import { useEffect, useRef } from "react";

import {
  saveProgress,
  throttle,
  cleanupOldEntries,
} from "@/components/player/utils/continueWatching";
import { playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";

/**
 * Progress Saver - localStorage Edition
 *
 * Saves playback progress to localStorage every 6 seconds.
 * Uses minimal storage and auto-cleans old entries.
 *
 * Features:
 * - Throttled saves (6s interval)
 * - Saves on pause/unload
 * - Auto-cleanup on mount
 * - Minimal localStorage footprint
 */
export function ProgressSaver() {
  const meta = usePlayerStore((s) => s.meta);
  const progress = usePlayerStore((s) => s.progress);
  const status = usePlayerStore((s) => s.status);
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);
  const isPaused = usePlayerStore((s) => s.mediaPlaying.isPaused);

  const dataRef = useRef({
    meta,
    progress,
    status,
    hasPlayedOnce,
    isPaused,
  });

  // Update ref on every render
  useEffect(() => {
    dataRef.current = { meta, progress, status, hasPlayedOnce, isPaused };
  }, [meta, progress, status, hasPlayedOnce, isPaused]);

  // Cleanup old entries on mount
  useEffect(() => {
    cleanupOldEntries();
  }, []);

  // Save progress function
  const saveCurrentProgress = useRef(
    throttle(() => {
      const { meta, progress, status, hasPlayedOnce } = dataRef.current;

      // Only save if:
      // - Video is playing
      // - Has played at least once
      // - Has valid meta and progress
      if (!meta || !progress) return;
      if (status !== playerStatus.PLAYING) return;
      if (!hasPlayedOnce) return;

      // Get media ID
      const mediaId =
        meta.type === "show" && meta.episode
          ? `${meta.tmdbId}-${meta.episode.tmdbId}`
          : meta.tmdbId;

      if (!mediaId) return;

      // Save to localStorage
      saveProgress(mediaId, progress.time, progress.duration);
    }, 6000), // 6 second throttle
  ).current;

  // Save on timeupdate (throttled)
  useEffect(() => {
    if (status === playerStatus.PLAYING && hasPlayedOnce) {
      saveCurrentProgress();
    }
  }, [progress.time, status, hasPlayedOnce, saveCurrentProgress]);

  // Save on pause
  useEffect(() => {
    if (isPaused && hasPlayedOnce && meta && progress) {
      const mediaId =
        meta.type === "show" && meta.episode
          ? `${meta.tmdbId}-${meta.episode.tmdbId}`
          : meta.tmdbId;

      if (mediaId) {
        saveProgress(mediaId, progress.time, progress.duration);
      }
    }
  }, [isPaused, hasPlayedOnce, meta, progress]);

  // Save on unload
  useEffect(() => {
    const handleUnload = () => {
      const { meta, progress } = dataRef.current;
      if (!meta || !progress) return;

      const mediaId =
        meta.type === "show" && meta.episode
          ? `${meta.tmdbId}-${meta.episode.tmdbId}`
          : meta.tmdbId;

      if (mediaId) {
        saveProgress(mediaId, progress.time, progress.duration);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return null;
}
