/* eslint-disable max-classes-per-file */
// CloudClash Backend API Type Definitions
// Based on actual backend responses

// =============================================================================
// Authentication Types
// =============================================================================

export interface SessionResponse {
  token: string;
  sessionId: string;
  visitId: string;
  expiresAt: number;
}

export interface ValidateResponse {
  valid: boolean;
  sessionId: string;
}

// =============================================================================
// Provider Types (matches actual /providers response)
// =============================================================================

export interface Provider {
  id: string; // Now the Alias
  name: string; // Now the Alias
  codename?: string; // Legacy
  rank?: number; // Removed in obfuscation
  type?: "source" | "embed"; // Removed in obfuscation
}

export interface ProvidersResponse {
  sources: Provider[];
  embeds: Provider[];
}

// =============================================================================
// Streaming Types (matches actual /scrape response)
// =============================================================================

export interface SubtitleTrack {
  id: string;
  language: string;
  languageName: string;
  url: string;
  format: string;
  source: string;
  hearingImpaired: boolean;
}

export interface VidNinjaStream {
  type: "hls" | "file";
  playlist?: string;
  qualities?: Record<string, { url: string }>;
  headers?: Record<string, string>;
}

export interface StreamResponse {
  type: "hls" | "file" | "cloudflare-hls";
  servers: Record<string, string>;
  manifestUrl?: string; // New: for cloudflare-hls type
  sessionId?: string; // New: session ID for manifest
  provider?: string; // New: selected provider from backend
  subtitles?: SubtitleTrack[]; // Legacy
  captions?: any[]; // Allow any for now, or match backend Caption type
  streamUrl: string; // The signed manifest URL
  success: boolean;
  headers?: Record<string, string>;
  session?: string;
  selectedProvider?: number;
  availableProviders?: {
    index: number;
    name: string;
    status: string;
  }[];
}

// =============================================================================
// Health Types
// =============================================================================

export interface HealthResponse {
  status: "ok" | "error";
  timestamp: number;
}

export interface HealthDetailedResponse {
  status: "ok" | "error";
  timestamp: number;
  uptime: number;
  jwt: {
    status: "ok" | "error";
    secret_loaded: boolean;
  };
  encryption: {
    status: "ok" | "error";
    secret_loaded: boolean;
  };
  worker: {
    status: "ok" | "error";
    url_configured: boolean;
  };
  tmdb: {
    status: "ok" | "error";
    proxy_configured: boolean;
  };
}

export interface ServerTimeResponse {
  serverTime: number;
  timezone: string;
  iso: string;
}

// =============================================================================
// Configuration
// =============================================================================

export interface BackendConfig {
  baseUrl: string;
}

// =============================================================================
// Error Classes
// =============================================================================

export class BackendError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

export class AuthError extends BackendError {
  constructor(message: string) {
    super(message, 401);
    this.name = "AuthError";
  }
}

export class StreamNotFoundError extends BackendError {
  constructor(message: string = "Stream not found") {
    super(message, 404);
    this.name = "StreamNotFoundError";
  }
}

// =============================================================================
// Legacy Types (for Febbox compatibility)
// =============================================================================

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
