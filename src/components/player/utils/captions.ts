import DOMPurify from "dompurify";
import { convert, detect, parse } from "subsrt-ts";
import { ContentCaption } from "subsrt-ts/dist/types/handler";

import type { SubtitleTrack } from "@/backend/api/types";
import { CaptionListItem } from "@/stores/player/slices/source";

export type CaptionCueType = ContentCaption;
export const sanitize = DOMPurify.sanitize;

export function captionIsVisible(
  start: number,
  end: number,
  delay: number,
  currentTime: number,
) {
  const delayedStart = start / 1000 + delay;
  const delayedEnd = end / 1000 + delay;
  return (
    Math.max(0, delayedStart) <= currentTime &&
    Math.max(0, delayedEnd) >= currentTime
  );
}

export function makeQueId(index: number, start: number, end: number): string {
  return `${index}-${start}-${end}`;
}

export function convertSubtitlesToVtt(text: string): string {
  const textTrimmed = text.trim();
  if (textTrimmed === "") {
    throw new Error("Given text is empty");
  }
  const vtt = convert(textTrimmed, "vtt");
  if (detect(vtt) === "") {
    throw new Error("Invalid subtitle format");
  }
  return vtt;
}

export function convertSubtitlesToSrt(text: string): string {
  const textTrimmed = text.trim();
  if (textTrimmed === "") {
    throw new Error("Given text is empty");
  }
  const srt = convert(textTrimmed, "srt");
  if (detect(srt) === "") {
    throw new Error("Invalid subtitle format");
  }
  return srt;
}

export function filterDuplicateCaptionCues(cues: ContentCaption[]) {
  return cues.reduce((acc: ContentCaption[], cap: ContentCaption) => {
    const lastCap = acc[acc.length - 1];
    const isSameAsLast =
      lastCap?.start === cap.start &&
      lastCap?.end === cap.end &&
      lastCap?.content === cap.content;
    if (lastCap === undefined || !isSameAsLast) {
      acc.push(cap);
    }
    return acc;
  }, []);
}

export function parseVttSubtitles(vtt: string) {
  return parse(vtt).filter((cue) => cue.type === "caption") as CaptionCueType[];
}

export function parseSubtitles(
  text: string,
  _language?: string,
): CaptionCueType[] {
  const vtt = convertSubtitlesToVtt(text);
  return parseVttSubtitles(vtt);
}

function stringToBase64(input: string): string {
  return btoa(String.fromCodePoint(...new TextEncoder().encode(input)));
}

export function convertSubtitlesToSrtDataurl(text: string): string {
  return `data:application/x-subrip;base64,${stringToBase64(
    convertSubtitlesToSrt(text),
  )}`;
}

export function convertSubtitlesToObjectUrl(text: string): string {
  return URL.createObjectURL(
    new Blob([convertSubtitlesToVtt(text)], {
      type: "text/vtt",
    }),
  );
}

/**
 * Converts the new SubtitleTrack format to CaptionListItem
 * New format has: id, language, languageName, url, format, source, hearingImpaired
 */
export function convertProviderCaption(
  subtitles: SubtitleTrack[] | undefined,
): CaptionListItem[] {
  if (!subtitles) return [];

  // DEBUG: Log how many subtitles we received from backend
  console.log(
    `[convertProviderCaption] Received ${subtitles.length} subtitles from backend:`,
  );
  console.log(
    subtitles.map((s) => ({
      id: s.id,
      lang: s.language,
      name: s.languageName,
    })),
  );

  const result = subtitles.map((v, index) => ({
    // Generate truly unique ID by combining multiple properties
    // This ensures no deduplication even if multiple tracks share the same language
    id: `${v.id}-${v.source || "unknown"}-${v.hearingImpaired ? "hi" : "normal"}-${index}`,
    language: v.language,
    url: v.url,
    type: v.format === "srt" ? "srt" : "vtt",
    needsProxy: false,
    opensubtitles: undefined,
    display: v.languageName,
    media: undefined,
    isHearingImpaired: v.hearingImpaired,
    source: v.source,
    encoding: undefined,
  }));

  console.log(
    `[convertProviderCaption] Converted to ${result.length} caption list items`,
  );
  return result;
}
