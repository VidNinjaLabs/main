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

  try {
    // Try to fetch from VidNinja if available
    let vidNinjaSources: VidNinjaSource[] = [];

    try {
      const { vidNinjaClient } = await import("@/backend/api/vidninja");
      vidNinjaSources = await vidNinjaClient.getProviders();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("VidNinja not configured or unavailable:", error);
    }

    const febboxSources = febboxClient.getSources();
    metaDataCache = [...vidNinjaSources, ...febboxSources];
  } catch (error) {
    console.error("Failed to fetch sources:", error);
    metaDataCache = [];
  }
}

export function clearMetadataCache() {
  metaDataCache = null;
}
