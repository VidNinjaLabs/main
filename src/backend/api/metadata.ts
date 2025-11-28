import { febboxClient } from "@/backend/api/febbox";
import type { FebboxSource, VidNinjaSource } from "@/backend/api/types";
import { vidNinjaClient } from "@/backend/api/vidninja";

let metaDataCache: (VidNinjaSource | FebboxSource)[] | null = null;

export function setCachedMetadata(data: (VidNinjaSource | FebboxSource)[]) {
  metaDataCache = data;
}

export function getCachedMetadata(): (VidNinjaSource | FebboxSource)[] {
  return metaDataCache ?? [];
}

export async function fetchMetadata() {
  if (metaDataCache) return;
  try {
    const vidNinjaSources = await vidNinjaClient.getSources();
    const febboxSources = febboxClient.getSources();
    metaDataCache = [...vidNinjaSources, ...febboxSources];
  } catch (error) {
    console.error("Failed to fetch sources:", error);
    metaDataCache = [];
  }
}
