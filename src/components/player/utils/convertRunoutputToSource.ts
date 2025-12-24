import type { RunOutput } from "@/hooks/useProviderScrape";
import {
  SourceFileStream,
  SourceQuality,
  SourceSliceSource,
} from "@/stores/player/utils/qualities";

const allowedQualitiesMap: Record<SourceQuality, SourceQuality> = {
  "4k": "4k",
  "1080": "1080",
  "480": "480",
  "360": "360",
  "720": "720",
  unknown: "unknown",
};
const allowedQualities = Object.keys(allowedQualitiesMap);

function normalizeQuality(quality: string): string {
  const normalized = quality.replace(/p$/i, "");
  const qualityMap: Record<string, string> = {
    "2160": "4k",
    "2160p": "4k",
    "1080": "1080",
    "1080p": "1080",
    "720": "720",
    "720p": "720",
    "480": "480",
    "480p": "480",
    "360": "360",
    "360p": "360",
  };
  return qualityMap[quality] || qualityMap[normalized] || normalized;
}

function isAllowedQuality(inp: string): inp is SourceQuality {
  const normalized = normalizeQuality(inp);
  return allowedQualities.includes(normalized);
}

/**
 * Converts RunOutput to SourceSliceSource for the player.
 * Uses the pre-validated `url` field (best server already selected).
 */
export function convertRunoutputToSource(out: RunOutput): SourceSliceSource {
  // Use the pre-validated URL from server selection
  const streamUrl = out.url;

  // Use streamType from backend
  if (out.streamType === "hls") {
    return {
      type: "hls",
      url: streamUrl,
      headers: out.headers,
      preferredHeaders: {},
    };
  }

  // For file-based streams, try to extract quality info from server name
  const qualities: Partial<Record<SourceQuality, SourceFileStream>> = {};

  // Try to extract quality from selected server name
  const qualityMatch = out.selectedServer.match(/(\d{3,4})p?/i);
  if (qualityMatch && isAllowedQuality(qualityMatch[1])) {
    const quality = normalizeQuality(qualityMatch[1]) as SourceQuality;
    qualities[quality] = {
      type: "mp4",
      url: streamUrl,
    };
  } else {
    qualities.unknown = {
      type: "mp4",
      url: streamUrl,
    };
  }

  return {
    type: "file",
    qualities,
    headers: out.headers,
    preferredHeaders: {},
  };
}
