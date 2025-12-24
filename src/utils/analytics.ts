/**
 * Umami Analytics Utility
 * Invisibly tracks player events for debugging and monitoring.
 *
 * Umami Endpoints to configure in your Umami dashboard:
 * - analytics-cloudclash.vercel.app (current)
 * - pulse.vidninja.pro (new)
 *
 * Allowed domains:
 * - watch.vidninja.pro (production)
 * - localhost:5173 (development)
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string | object, data?: object) => void;
      identify: (id: string, data?: object) => void;
    };
  }
}

// Event types for type safety
export type AnalyticsEvent =
  | "stream_play"
  | "stream_failure"
  | "server_switch"
  | "server_validated"
  | "quality_change"
  | "provider_select"
  | "scrape_complete"
  | "playback_start"
  | "playback_error"
  | "playback_end";

export interface StreamPlayData {
  provider: string;
  server: string;
  tmdbId: string;
  type: "movie" | "show";
  quality?: string;
}

export interface StreamFailureData {
  provider: string;
  server: string;
  status?: number;
  error: string;
  url?: string;
}

export interface ServerSwitchData {
  from: string;
  to: string;
  reason: "failure" | "manual" | "auto";
}

export interface ServerValidatedData {
  server: string;
  valid: boolean;
  status?: number;
  latency_ms?: number;
}

export interface QualityChangeData {
  from: string;
  to: string;
  manual: boolean;
}

export interface ProviderSelectData {
  provider: string;
  success: boolean;
  servers_count?: number;
  duration_ms?: number;
}

export interface ScrapeCompleteData {
  provider: string;
  success: boolean;
  duration_ms: number;
  servers_found?: number;
}

export interface PlaybackData {
  tmdbId: string;
  type: "movie" | "show";
  provider?: string;
  server?: string;
  quality?: string;
  error?: string;
  watched_seconds?: number;
}

type EventDataMap = {
  stream_play: StreamPlayData;
  stream_failure: StreamFailureData;
  server_switch: ServerSwitchData;
  server_validated: ServerValidatedData;
  quality_change: QualityChangeData;
  provider_select: ProviderSelectData;
  scrape_complete: ScrapeCompleteData;
  playback_start: PlaybackData;
  playback_error: PlaybackData;
  playback_end: PlaybackData;
};

/**
 * Analytics singleton for tracking player events
 */
export const analytics = {
  /**
   * Track an event with optional data
   * Uses Umami if available, otherwise logs to console in dev
   */
  track<T extends AnalyticsEvent>(event: T, data?: EventDataMap[T]): void {
    // Add timestamp to all events
    const eventData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    // Send to Umami if available
    if (typeof window !== "undefined" && window.umami) {
      window.umami.track(event, eventData);
    }

    // Log in development for debugging
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[Analytics] ${event}`, eventData);
    }
  },

  /**
   * Identify a user session (optional)
   */
  identify(userId: string, data?: object): void {
    if (typeof window !== "undefined" && window.umami) {
      window.umami.identify(userId, data);
    }
  },
};

export default analytics;
