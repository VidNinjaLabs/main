import type { VidNinjaSource } from "@/backend/api/types";
import { vidNinjaClient } from "@/backend/api/vidninja";

let metaDataCache: VidNinjaSource[] | null = null;

export function setCachedMetadata(data: VidNinjaSource[]) {
  metaDataCache = data;
}

export function getCachedMetadata(): VidNinjaSource[] {
  return metaDataCache ?? [];
}

export async function fetchMetadata() {
  if (metaDataCache) return;
  try {
    const data = await vidNinjaClient.getSources();
    metaDataCache = data;
  } catch (error) {
    console.error("Failed to fetch VidNinja sources:", error);
    metaDataCache = [];
  }
}
