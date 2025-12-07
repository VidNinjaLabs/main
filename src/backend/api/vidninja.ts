import {
  VidNinjaConfig,
  VidNinjaError,
  VidNinjaSource,
  VidNinjaStatusResponse,
  VidNinjaStreamRequest,
  VidNinjaStreamResponse,
} from "./types";

class VidNinjaClient {
  private configured: boolean = false;

  configure(config: VidNinjaConfig) {
    // We no longer need to store config since we're using backend proxy
    // Just mark as configured for backward compatibility
    this.configured = true;
    console.log("VidNinja client configured to use backend proxy");
  }

  private checkConfigured() {
    if (!this.configured) {
      throw new VidNinjaError("VidNinja client not configured");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    this.checkConfigured();

    // Use backend proxy instead of direct API calls
    const apiUrl = import.meta.env.DEV ? "http://localhost:3001" : "";
    const url = `${apiUrl}/api/vidninja${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new VidNinjaError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof VidNinjaError) {
        throw error;
      }
      throw new VidNinjaError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStream(
    params: VidNinjaStreamRequest,
  ): Promise<VidNinjaStreamResponse> {
    // Call backend proxy for CDN endpoint
    const apiUrl = import.meta.env.DEV ? "http://localhost:3001" : "";

    const queryParams = new URLSearchParams({
      sourceId: params.sourceId,
      tmdbId: params.tmdbId,
      type: params.type,
    });

    if (params.season !== undefined) {
      queryParams.set("season", params.season.toString());
    }
    if (params.episode !== undefined) {
      queryParams.set("episode", params.episode.toString());
    }
    if (params.force) {
      queryParams.set("force", "true");
    }

    return this.request<VidNinjaStreamResponse>(`/cdn?${queryParams}`);
  }

  async getSources(
    tmdbId: string,
    type: "movie" | "tv",
    season?: number,
    episode?: number,
  ): Promise<VidNinjaSource[]> {
    // Call backend proxy for sources
    return this.request<VidNinjaSource[]>("/sources", {
      method: "POST",
      body: JSON.stringify({ tmdbId, type, season, episode }),
    });
  }

  async getStatus(): Promise<VidNinjaStatusResponse> {
    return this.request<VidNinjaStatusResponse>("/status");
  }
}

export const vidNinjaClient = new VidNinjaClient();
