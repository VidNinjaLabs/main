import { febboxClient } from "@/backend/api/febbox";
import type { FebboxSource, VidNinjaSource } from "@/backend/api/types";

let metaDataCache: (VidNinjaSource | FebboxSource)[] | null = null;

export function setCachedMetadata(data: (VidNinjaSource | FebboxSource)[]) {
  metaDataCache = data;
}

export function getCachedMetadata(): (VidNinjaSource | FebboxSource)[] {
  return metaDataCache ?? [];
}

export async function fetchMetadata() {
  if (metaDataCache) return;
  // Fetch VidNinja sources if configured
  try {
    // Note: This is a general metadata fetch, we don't have specific tmdbId here
    // So we'll skip VidNinja sources in this context
    // VidNinja sources should be fetched per-media item
    const vidNinjaSources: any[] = [];
    const febboxSources = febboxClient.getSources();
    metaDataCache = [...vidNinjaSources, ...febboxSources];
  } catch (error) {
    console.error("Failed to fetch sources:", error);
    metaDataCache = [];
  }
}
