/* eslint-disable max-classes-per-file */
// VidNinja API Type Definitions
export interface VidNinjaQuality {
  type: "mp4";
  url: string;
}

export interface VidNinjaCaption {
  id: string;
  language: string;
  url: string;
  type?: string;
}

export interface VidNinjaStream {
  id: string;
  type: "hls" | "file";
  playlist: string;
  headers: Record<string, string>;
  proxyDepth?: number;
  flags: string[];
  captions: VidNinjaCaption[];
  qualities?: Record<string, VidNinjaQuality>;
  // Stream metadata for multi-language/multi-server support
  language?: string; // ISO 639-1 language code (e.g., "en", "hi", "ta")
  label?: string; // Human-readable display name (e.g., "AllMovies (Hindi)")
  quality?: string; // Quality/server identifier (e.g., "HD", "LS-25", "GS-25")
}

export interface VidNinjaStreamResponse {
  stream: VidNinjaStream[];
  embeds: any[];
}

export interface VidNinjaSource {
  id: string;
  name: string;
  rank: number;
  type: "source" | "embed";
  mediaTypes?: string[];
}

export interface VidNinjaProviderStatus {
  status: "operational" | "degraded" | "offline" | "untested";
  latency: number;
  uptime: number;
}

export interface VidNinjaStatusResponse {
  [providerId: string]: VidNinjaProviderStatus;
}

export interface VidNinjaSourcesRequest {
  tmdbId: string;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
}

// /sources endpoint returns array directly, not {sources: [...]}
export type VidNinjaSourcesResponse = VidNinjaSource[];

export interface VidNinjaStreamRequest {
  sourceId: string;
  tmdbId: string;
  type: "movie" | "tv"; // API expects 'tv' not 'show'
  season?: number;
  episode?: number;
  force?: boolean;
}

export interface VidNinjaConfig {
  url: string;
  apiKey: string;
}

export class VidNinjaError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "VidNinjaError";
  }
}

// Febbox Types
export interface FebboxConfig {
  apiUrl: string;
  uiToken: string;
}

export interface FebboxFileItem {
  fid: string;
  file_name: string;
  is_dir: boolean;
  size?: number;
}

export interface FebboxQuality {
  url: string;
  quality: string;
  name: string;
  speed: string;
  size: string;
}

export interface FebboxStream {
  id: string;
  type: "file";
  playlist: string;
  headers: Record<string, string>;
  flags: string[];
  captions: [];
  qualities?: Record<string, FebboxQuality>;
}

export interface FebboxSource {
  id: "febbox";
  name: "Febbox";
  rank: number;
  type: "source";
  mediaTypes?: string[];
}

export class FebboxError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "FebboxError";
  }
}
