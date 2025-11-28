/* eslint-disable no-console */
import { febboxClient } from "@/backend/api/febbox";
import { vidNinjaClient } from "@/backend/api/vidninja";
import { conf } from "@/setup/config";

export function initializeVidNinja() {
  const config = conf();

  if (!config.VIDNINJA_API_URL || !config.VIDNINJA_API_KEY) {
    console.warn(
      "VidNinja API not configured. Please set VITE_VIDNINJA_API_URL and VITE_VIDNINJA_API_KEY",
    );
    return;
  }

  vidNinjaClient.configure({
    apiUrl: config.VIDNINJA_API_URL,
    apiKey: config.VIDNINJA_API_KEY,
  });
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
