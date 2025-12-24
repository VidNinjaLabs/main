/**
 * Server Selector
 * Selects the best server from available options.
 *
 * Note: HEAD request validation was removed because most HLS proxies
 * don't support CORS for HEAD requests. Instead, we select the first
 * server and let the HLS player handle failover on actual playback errors.
 *
 * The analytics tracking helps identify which servers are failing in production.
 */

import analytics from "@/utils/analytics";

export interface SelectedServer {
  server: string;
  url: string;
}

/**
 * Select the best server from available options.
 * For now, simply returns the first server.
 * The HLS player will handle failover if this server fails.
 */
export function selectBestServer(
  servers: Record<string, string>,
): SelectedServer | null {
  const serverEntries = Object.entries(servers);

  if (serverEntries.length === 0) {
    analytics.track("stream_failure", {
      provider: "unknown",
      server: "none",
      error: "No servers available",
    });
    return null;
  }

  const [server, url] = serverEntries[0];

  // Log available servers for debugging
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(
      `[ServerSelector] Selected: ${server}, Available: ${serverEntries.map(([s]) => s).join(", ")}`,
    );
  }

  return { server, url };
}

/**
 * Get remaining servers after current one fails
 * Used for failover during playback
 */
export function getRemainingServers(
  servers: Record<string, string>,
  currentServer: string,
): SelectedServer[] {
  const entries = Object.entries(servers);
  const currentIndex = entries.findIndex(([name]) => name === currentServer);

  if (currentIndex === -1) {
    // Current server not found, return all servers
    return entries.map(([server, url]) => ({ server, url }));
  }

  // Return servers after the current one
  return entries
    .slice(currentIndex + 1)
    .map(([server, url]) => ({ server, url }));
}

/**
 * Track a server failure for analytics
 */
export function trackServerFailure(
  provider: string,
  server: string,
  error: string,
  status?: number,
): void {
  analytics.track("stream_failure", {
    provider,
    server,
    status: status ?? 0,
    error,
  });
}
