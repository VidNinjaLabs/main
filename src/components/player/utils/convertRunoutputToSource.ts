import type { VidNinjaStream } from "@/backend/api/types";
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
const allowedFileTypes = ["mp4"];

function normalizeQuality(quality: string): string {
  // Remove 'p' suffix if present (e.g., "1080p" -> "1080")
  const normalized = quality.replace(/p$/i, "");
  // Map common variations to standard values
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

export function convertRunoutputToSource(out: {
  stream: VidNinjaStream;
}): SourceSliceSource {
  if (out.stream.type === "hls") {
    return {
      type: "hls",
      url: out.stream.playlist,
      headers: out.stream.headers,
      preferredHeaders: {},
    };
  }
  if (out.stream.type === "file") {
    const qualities: Partial<Record<SourceQuality, SourceFileStream>> = {};
    if (out.stream.qualities) {
      Object.entries(out.stream.qualities).forEach((entry) => {
        const normalizedQuality = normalizeQuality(entry[0]);

        if (!isAllowedQuality(entry[0])) {
          console.warn(`unrecognized quality: ${entry[0]}`);
          return;
        }
        if (!allowedFileTypes.includes(entry[1].type)) {
          console.warn(`unrecognized file type: ${entry[1].type}`);
          return;
        }
        // Use normalized quality as the key
        qualities[normalizedQuality as SourceQuality] = {
          type: entry[1].type,
          url: entry[1].url,
        };
      });
    }
    return {
      type: "file",
      qualities,
      headers: out.stream.headers,
      preferredHeaders: {},
    };
  }
  throw new Error("unrecognized type");
}
