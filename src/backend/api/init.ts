/* eslint-disable no-console */
import { febboxClient } from "@/backend/api/febbox";
import { vidNinjaClient } from "@/backend/api/vidninja";
import { conf } from "@/setup/config";

export function initializeVidNinja() {
  const vidninjaUrl = import.meta.env.VITE_VIDNINJA_API_URL;
  const vidninjaApiKey = import.meta.env.VITE_VIDNINJA_API_KEY;

  if (!vidninjaUrl) {
    return;
  }

  if (!vidninjaApiKey) {
    return;
  }

  vidNinjaClient.configure({
    url: vidninjaUrl,
    apiKey: vidninjaApiKey,
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
