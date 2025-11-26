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
  responseTime: number;
  uptime: number;
}

export interface VidNinjaStatusResponse {
  [providerId: string]: VidNinjaProviderStatus;
}

export interface VidNinjaStreamRequest {
  sourceId: string;
  tmdbId: string;
  type: "movie" | "show";
  season?: number;
  episode?: number;
  force?: boolean;
}

export interface VidNinjaConfig {
  apiUrl: string;
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
