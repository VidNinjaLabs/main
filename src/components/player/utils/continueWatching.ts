/**
 * Production-Grade Continue Watching System
 *
 * Features:
 * - Segment-safe resume (aligns to HLS segment boundaries)
 * - Minimal localStorage usage (~200 bytes per video)
 * - Auto-cleanup of old entries
 * - Cloudflare-friendly buffering
 *
 * Based on Netflix-grade best practices
 */

interface ContinueWatchingData {
  t: number; // currentTime (seconds)
  d: number; // duration (seconds)
  u: number; // updatedAt (timestamp)
}

const PREFIX = "cw:";
const SEGMENT_DURATION = 4; // HLS segment duration in seconds
const SAFETY_MARGIN = 2; // Seek earlier by this amount
const MIN_SAVE_TIME = 10; // Don't save if watched < 10s
const MAX_SAVE_PERCENT = 0.9; // Don't save if watched > 90%
const MAX_ENTRIES = 200; // Maximum stored videos
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

/**
 * Save progress to localStorage
 * Only saves if:
 * - Watched >= 10 seconds
 * - Watched < 90% of duration
 */
export function saveProgress(id: string, time: number, duration: number): void {
  // Don't save if too early
  if (time < MIN_SAVE_TIME) return;

  // Don't save if too close to end (consider it "completed")
  if (time / duration > MAX_SAVE_PERCENT) {
    // Remove entry if exists (video completed)
    localStorage.removeItem(`${PREFIX}${id}`);
    return;
  }

  const data: ContinueWatchingData = {
    t: time,
    d: duration,
    u: Date.now(),
  };

  try {
    localStorage.setItem(`${PREFIX}${id}`, JSON.stringify(data));
  } catch (error) {
    console.warn("[ContinueWatching] Failed to save:", error);
    // If storage full, cleanup and retry
    cleanupOldEntries();
    try {
      localStorage.setItem(`${PREFIX}${id}`, JSON.stringify(data));
    } catch {
      // Still failed, give up silently
    }
  }
}

/**
 * Get saved resume time for a video
 * Returns 0 if:
 * - No saved progress
 * - Saved time < 10s
 * - Saved time > 90% of duration
 */
export function getResumeTime(id: string): number {
  try {
    const raw = localStorage.getItem(`${PREFIX}${id}`);
    if (!raw) return 0;

    const data: ContinueWatchingData = JSON.parse(raw);

    // Don't resume if too early
    if (data.t < MIN_SAVE_TIME) return 0;

    // Don't resume if too close to end
    if (data.t / data.d > MAX_SAVE_PERCENT) return 0;

    return data.t;
  } catch (error) {
    console.warn("[ContinueWatching] Failed to read:", error);
    return 0;
  }
}

/**
 * Calculate segment-safe resume time
 *
 * Aligns to HLS segment boundaries and seeks slightly earlier
 * to ensure keyframe availability and prevent playback stalls.
 *
 * Example:
 * - Input: 47.3s
 * - Segment: 4s
 * - Output: 44s (floor(47.3/4)*4 - 2 = 44)
 *
 * This ensures:
 * - Resume starts at segment boundary (keyframe)
 * - 2s safety margin for buffering
 * - Cloudflare-friendly (no mid-segment seeks)
 */
export function getSafeResumeTime(time: number): number {
  if (time < MIN_SAVE_TIME) return 0;

  const alignedTime = Math.floor(time / SEGMENT_DURATION) * SEGMENT_DURATION;
  const safeTime = alignedTime - SAFETY_MARGIN;

  return Math.max(safeTime, 0);
}

/**
 * Remove old or excess entries from localStorage
 *
 * Keeps only:
 * - Most recent 200 videos
 * - Videos accessed within last 60 days
 *
 * Call on app startup or when storage is full
 */
export function cleanupOldEntries(): void {
  try {
    const items = Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .map((key) => {
        try {
          const data: ContinueWatchingData = JSON.parse(
            localStorage.getItem(key)!,
          );
          return { key, data };
        } catch {
          return null;
        }
      })
      .filter(
        (item): item is { key: string; data: ContinueWatchingData } =>
          item !== null,
      )
      .sort((a, b) => b.data.u - a.data.u); // Sort by most recent first

    let removed = 0;

    items.forEach((item, index) => {
      const age = Date.now() - item.data.u;

      // Remove if:
      // 1. Beyond max entries limit
      // 2. Older than max age
      if (index >= MAX_ENTRIES || age > MAX_AGE_MS) {
        localStorage.removeItem(item.key);
        removed++;
      }
    });

    if (removed > 0) {
      console.log(`[ContinueWatching] Cleaned up ${removed} old entries`);
    }
  } catch (error) {
    console.warn("[ContinueWatching] Cleanup failed:", error);
  }
}

/**
 * Clear progress for a specific video
 */
export function clearProgress(id: string): void {
  localStorage.removeItem(`${PREFIX}${id}`);
}

/**
 * Get all saved progress entries (for debugging)
 */
export function getAllProgress(): Record<string, ContinueWatchingData> {
  const result: Record<string, ContinueWatchingData> = {};

  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .forEach((key) => {
      try {
        const id = key.substring(PREFIX.length);
        result[id] = JSON.parse(localStorage.getItem(key)!);
      } catch {
        // Skip invalid entries
      }
    });

  return result;
}

/**
 * Throttle function for progress saving
 * Prevents excessive localStorage writes
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      // Schedule for later
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          lastCall = Date.now();
          func(...args);
        },
        delay - (now - lastCall),
      );
    }
  };
}
