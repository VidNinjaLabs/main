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
