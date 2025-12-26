import { useEffect, useState } from "react";

interface Config {
  turnstileSiteKey: string;
  enablePremium: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

let cachedConfig: Config | null = null;

function getEnvConfig(): Config {
  return {
    turnstileSiteKey:
      import.meta.env.VITE_TURNSTILE_SITE_KEY ||
      import.meta.env.TURNSTILE_SITE_KEY ||
      "",
    enablePremium:
      import.meta.env.VITE_ENABLE_PREMIUM === "true" ||
      import.meta.env.ENABLE_PREMIUM === "true",
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  };
}

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (!cachedConfig) {
      cachedConfig = getEnvConfig();
      setConfig(cachedConfig);
      setLoading(false);
    }
  }, []);

  return { config, loading };
}

// Synchronous getter (use only after config is loaded)
export function getConfig(): Config | null {
  if (!cachedConfig) {
    cachedConfig = getEnvConfig();
  }
  return cachedConfig;
}

// Initialize config on app load
export async function initConfig(): Promise<Config> {
  if (!cachedConfig) {
    cachedConfig = getEnvConfig();
  }
  return Promise.resolve(cachedConfig);
}
