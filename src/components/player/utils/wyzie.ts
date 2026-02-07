import { type SubtitleData } from "wyzie-lib";

import { backendClient } from "@/backend/api/vidninja";
import { CaptionListItem, PlayerMeta } from "@/stores/player/slices/source";

export async function fetchWyzieSubtitles(
  meta: PlayerMeta,
): Promise<CaptionListItem[]> {
  try {
    if (!meta.tmdbId) return [];

    const params: any = {
      tmdbId: meta.tmdbId,
      format: "srt",
      language: "en",
    };

    if (meta.type === "show" && meta.season && meta.episode) {
      params.season = meta.season.number;
      params.episode = meta.episode.number;
    }

    const data: SubtitleData[] = await backendClient.getSubtitles(params);

    if (!Array.isArray(data)) {
      // eslint-disable-next-line no-console
      console.error("Wyzie response is not an array:", data);
      return [];
    }

    return data.map((item, index) => ({
      id: `wyzie-${index}-${item.url}`,
      language: "en",
      url: item.url,
      type: "srt",
      // Use proxy for download as well to avoid CORS on the file URL
      needsProxy: true,
      display: item.display || "English (Wyzie)",
      source: "wyzie",
      isHearingImpaired: false,
    }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Wyzie fetch failed", e);
    return [];
  }
}
