/* eslint-disable no-console */
import { febboxClient } from "@/backend/api/febbox";
import { backendClient } from "@/backend/api/vidninja";
import { conf } from "@/setup/config";

/**
 * Initialize the backend client with the configured URL.
 * Uses VITE_VIDNINJA_API_URL as the backend base URL.
 */
export function initializeVidNinja() {
  const backendUrl = import.meta.env.VITE_VIDNINJA_API_URL;

  if (!backendUrl) {
    console.warn("Backend URL not configured (VITE_VIDNINJA_API_URL)");
    return;
  }

  backendClient.configure({
    baseUrl: backendUrl,
  });

  console.log("Backend client initialized with URL:", backendUrl);
}

/**
 * Initialize Febbox client (secondary provider)
 */
export function initializeFebbox() {
  const config = conf();

  if (!config.FEBBOX_API_URL) {
    console.warn("Febbox API URL not configured");
    return;
  }

  if (!config.FEBBOX_UI_TOKEN) {
    console.log("Febbox token not set - source will not be available");
    return;
  }

  febboxClient.configure({
    apiUrl: config.FEBBOX_API_URL,
    uiToken: config.FEBBOX_UI_TOKEN,
  });

  console.log("Febbox client initialized");
}
