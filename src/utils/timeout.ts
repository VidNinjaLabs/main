/**
 * Utility functions for async operations with timeout
 */

/**
 * Wrap a promise with a timeout
 * @param promise The promise to wrap
 * @param ms Timeout in milliseconds
 * @param errorMessage Optional error message
 * @returns The promise result or throws on timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage = "Operation timed out",
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(errorMessage));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Default timeouts for various operations
 */
export const TIMEOUTS = {
  /** Timeout for scraping a single provider */
  PROVIDER_SCRAPE: 15000, // 15 seconds
  /** Timeout for fetching provider list */
  PROVIDER_LIST: 10000, // 10 seconds
  /** Timeout for authentication */
  AUTH: 10000, // 10 seconds
} as const;
