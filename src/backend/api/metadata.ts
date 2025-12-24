import { febboxClient } from "@/backend/api/febbox";
import type { FebboxSource, Provider } from "@/backend/api/types";
import { backendClient } from "@/backend/api/vidninja";

// Normalized provider interface used by UI components
export interface NormalizedCacheProvider {
  id: string;
  name: string;
  rank: number;
  type: "source" | "embed";
  mediaTypes?: string[];
}

let metaDataCache: NormalizedCacheProvider[] | null = null;

/**
 * Normalizes a backend Provider (codename-based) to UI format (id/name-based)
 */
function normalizeProvider(provider: Provider): NormalizedCacheProvider {
  return {
    id: provider.codename,
    name: provider.codename,
    rank: provider.rank,
    type: provider.type,
  };
}

/**
 * Normalizes a FebboxSource to UI format
 */
function normalizeFebboxSource(source: FebboxSource): NormalizedCacheProvider {
  return {
    id: source.id,
    name: source.name,
    rank: source.rank,
    type: source.type,
    mediaTypes: source.mediaTypes,
  };
}

export function setCachedMetadata(data: NormalizedCacheProvider[]) {
  metaDataCache = data;
}

export function getCachedMetadata(): NormalizedCacheProvider[] {
  return metaDataCache ?? [];
}

export async function fetchMetadata() {
  if (metaDataCache) return;

  try {
    // Try to fetch from backend if available
    let normalizedProviders: NormalizedCacheProvider[] = [];

    try {
      const response = await backendClient.getProviders();
      const backendProviders = response.sources || [];
      normalizedProviders = backendProviders.map(normalizeProvider);
    } catch {
      // Silently fail if not configured
    }

    const febboxSources = febboxClient.getSources();
    const normalizedFebbox = febboxSources.map(normalizeFebboxSource);

    metaDataCache = [...normalizedProviders, ...normalizedFebbox];
  } catch {
    metaDataCache = [];
  }
}

export function clearMetadataCache() {
  metaDataCache = null;
}
