import {
  VidNinjaConfig,
  VidNinjaError,
  VidNinjaSource,
  VidNinjaStatusResponse,
  VidNinjaStreamRequest,
  VidNinjaStreamResponse,
} from "./types";

class VidNinjaClient {
  private config: VidNinjaConfig | null = null;

  configure(config: VidNinjaConfig) {
    this.config = config;
  }

  private getConfig(): VidNinjaConfig {
    if (!this.config) {
      throw new VidNinjaError("VidNinja client not configured");
    }
    return this.config;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const config = this.getConfig();
    const url = `${config.apiUrl}${endpoint}`;

    const headers = new Headers(options.headers);
    headers.set("x-api-key", config.apiKey);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
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

  async getSources(): Promise<VidNinjaSource[]> {
    return this.request<VidNinjaSource[]>("/sources");
  }

  async getStatus(): Promise<VidNinjaStatusResponse> {
    return this.request<VidNinjaStatusResponse>("/status");
  }
}

export const vidNinjaClient = new VidNinjaClient();
