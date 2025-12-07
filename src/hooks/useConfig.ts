import { useEffect, useState } from "react";

interface Config {
  turnstileSiteKey: string;
  enablePremium: boolean;
  backendUrl: string;
  appDomain: string;
}

let cachedConfig: Config | null = null;
let configPromise: Promise<Config> | null = null;

async function fetchConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (configPromise) {
    return configPromise;
  }

  const apiUrl = import.meta.env.DEV
    ? "http://localhost:3001/api/config"
    : "/api/config";

  configPromise = fetch(apiUrl)
    .then((res) => res.json())
    .then((data) => {
      cachedConfig = data;
      return data;
    })
    .catch((error) => {
      console.error("Failed to fetch config:", error);
      // Return defaults on error
      return {
        turnstileSiteKey: "",
        enablePremium: false,
        backendUrl: "",
        appDomain: "",
      };
    })
    .finally(() => {
      configPromise = null;
    });

  return configPromise;
}

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (!cachedConfig) {
      fetchConfig().then((data) => {
        setConfig(data);
        setLoading(false);
      });
    }
  }, []);

  return { config, loading };
}

// Synchronous getter (use only after config is loaded)
export function getConfig(): Config | null {
  return cachedConfig;
}

// Initialize config on app load
export async function initConfig(): Promise<Config> {
  return fetchConfig();
}
