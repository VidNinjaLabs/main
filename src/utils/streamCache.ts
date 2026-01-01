/* eslint-disable no-console */
/**
 * Stream URL Cache
 * Caches stream data in localStorage to reduce loading times for replayed content.
 */

import { RunOutput } from "@/hooks/useProviderScrape";

const CACHE_PREFIX = "stream-cache-v2:";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

interface CachedStream {
  data: RunOutput;
  timestamp: number;
}

/**
 * Generate cache key for a stream
 */
function getCacheKey(
  tmdbId: string,
  type: "movie" | "show",
  sourceId: string,
  season?: number,
  episode?: number,
): string {
  if (type === "show" && season !== undefined && episode !== undefined) {
    return `${CACHE_PREFIX}${tmdbId}:${type}:${sourceId}:s${season}e${episode}`;
  }
  return `${CACHE_PREFIX}${tmdbId}:${type}:${sourceId}`;
}

/**
 * Get cached stream if available and not expired
 */
export function getCachedStream(
  tmdbId: string,
  type: "movie" | "show",
  sourceId: string,
  season?: number,
  episode?: number,
): RunOutput | null {
  try {
    const key = getCacheKey(tmdbId, type, sourceId, season, episode);
    const cached = localStorage.getItem(key);

    if (!cached) return null;

    const parsed: CachedStream = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    // Check if cache is expired
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      console.log(`[StreamCache] Cache expired for ${key}`);
      return null;
    }

    console.log(
      `[StreamCache] Cache HIT for ${key} (age: ${Math.round(age / 1000)}s)`,
    );
    return parsed.data;
  } catch (err) {
    console.error("[StreamCache] Error reading cache:", err);
    return null;
  }
}

/**
 * Cache stream data
 */
export function setCachedStream(
  tmdbId: string,
  type: "movie" | "show",
  sourceId: string,
  data: RunOutput,
  season?: number,
  episode?: number,
): void {
  try {
    const key = getCacheKey(tmdbId, type, sourceId, season, episode);
    const cached: CachedStream = {
      data,
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(cached));
    console.log(`[StreamCache] Cached stream for ${key}`);
  } catch (err) {
    console.error("[StreamCache] Error writing cache:", err);
  }
}

/**
 * Clear all cached streams
 */
export function clearStreamCache(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_PREFIX),
    );
    keys.forEach((key) => localStorage.removeItem(key));
    console.log(`[StreamCache] Cleared ${keys.length} cached streams`);
  } catch (err) {
    console.error("[StreamCache] Error clearing cache:", err);
  }
}

/**
 * Clear cached stream for specific content
 */
export function clearCachedStream(
  tmdbId: string,
  type: "movie" | "show",
  sourceId: string,
  season?: number,
  episode?: number,
): void {
  try {
    const key = getCacheKey(tmdbId, type, sourceId, season, episode);
    localStorage.removeItem(key);
    console.log(`[StreamCache] Cleared cache for ${key}`);
  } catch (err) {
    console.error("[StreamCache] Error clearing cache:", err);
  }
}
