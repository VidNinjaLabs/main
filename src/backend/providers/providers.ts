import { getCachedMetadata } from "@/backend/api/metadata";
import type { FebboxSource, VidNinjaSource } from "@/backend/api/types";

export function getAllProviders() {
  return {
    listSources: (): (VidNinjaSource | FebboxSource)[] => getCachedMetadata(),
    listEmbeds: (): VidNinjaSource[] => [],
  };
}

export function getProviders() {
  return getAllProviders();
}
