import { getCachedMetadata } from "@/backend/api/metadata";
import type { VidNinjaSource } from "@/backend/api/types";

export function getAllProviders() {
  return {
    listSources: (): VidNinjaSource[] => getCachedMetadata(),
    listEmbeds: (): VidNinjaSource[] => [],
  };
}

export function getProviders() {
  return getAllProviders();
}
