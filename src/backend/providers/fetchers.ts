// Stub file for compatibility - VidNinja API doesn't need these fetchers

export function makeExtensionFetcher() {
  return (url: string, ops: any) => fetch(url, ops);
}

export function getLoadbalancedProxyUrl(): string | null {
  return null;
}

export function getLoadbalancedM3U8ProxyUrl(): string | null {
  return null;
}

export function getLoadbalancedProviderApiUrl(): string | null {
  return null;
}
