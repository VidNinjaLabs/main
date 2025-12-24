import {
  NormalizedCacheProvider,
  getCachedMetadata,
} from "@/backend/api/metadata";

export function getAllProviders() {
  return {
    listSources: (): NormalizedCacheProvider[] => getCachedMetadata(),
    listEmbeds: (): NormalizedCacheProvider[] => [],
  };
}

export function getProviders() {
  return getAllProviders();
}
