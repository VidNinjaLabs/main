/* eslint-disable no-console */
import { febboxClient } from "@/backend/api/febbox";
import { vidNinjaClient } from "@/backend/api/vidninja";
import { conf } from "@/setup/config";

export function initializeVidNinja() {
  // No longer need to pass API key to frontend
  // Backend proxy handles authentication
  vidNinjaClient.configure({
    apiUrl: "", // Not used anymore, kept for compatibility
    apiKey: "", // Not used anymore, kept for compatibility
  });

  console.log("VidNinja client initialized (using backend proxy)");
}

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
