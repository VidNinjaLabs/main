import { useEffect, useRef } from "react";

import { usePlayerStore } from "@/stores/player/store";
import { useProgressStore } from "@/stores/progress";

/**
 * Auto-resume hook - automatically seeks to saved progress on video load
 * No popup, just instant resume with visual feedback via blinking play button
 */
export function useAutoResume() {
  const meta = usePlayerStore((s) => s.meta);
  const display = usePlayerStore((s) => s.display);
  const progressItems = useProgressStore((s) => s.items);
  const setHasResumed = usePlayerStore((s) => s.setHasResumed);
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);

  const hasAttemptedResume = useRef(false);

  useEffect(() => {
    // Only attempt resume once per video load
    if (hasAttemptedResume.current) return;
    if (!meta || !display) return;
    if (hasPlayedOnce) return; // Don't resume if already playing

    // Get saved progress for this media
    const mediaId = meta.tmdbId;
    const savedItem = progressItems[mediaId];

    if (!savedItem) return;

    // For shows, get episode progress
    let savedProgress: { watched: number; duration: number } | null = null;

    if (meta.type === "show" && meta.episode) {
      const episodeId = meta.episode.tmdbId;
      const episode = savedItem.episodes?.[episodeId];
      if (episode?.progress) {
        savedProgress = episode.progress;
      }
    } else if (meta.type === "movie" && savedItem.progress) {
      savedProgress = savedItem.progress;
    }

    if (!savedProgress) return;

    const { watched, duration } = savedProgress;

    // Only resume if:
    // 1. Watched at least 10 seconds
    // 2. Not within last 30 seconds of video
    const MIN_WATCH_TIME = 10;
    const END_THRESHOLD = 30;

    if (watched < MIN_WATCH_TIME) return;
    if (duration - watched < END_THRESHOLD) return;

    // Instantly seek to saved position
    console.log(`[Auto-Resume] Seeking to ${watched}s`);
    display.setTime(watched);

    // Set flag for blinking play button
    setHasResumed(true);

    hasAttemptedResume.current = true;
  }, [meta, display, progressItems, setHasResumed, hasPlayedOnce]);

  // Reset flag when video changes
  useEffect(() => {
    hasAttemptedResume.current = false;
  }, [meta?.tmdbId, meta?.episode?.tmdbId]);
}
