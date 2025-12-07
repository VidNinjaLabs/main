import type {
  VidNinjaConfig,
  VidNinjaSourcesRequest,
  VidNinjaSourcesResponse,
  VidNinjaStreamRequest,
  VidNinjaStreamResponse,
} from "./types";

class VidNinjaClient {
  private apiUrl: string = "";

  private apiKey: string = "";

  private configured: boolean = false;

  configure(config: VidNinjaConfig) {
    this.apiUrl = config.url;
    this.apiKey = config.apiKey;
    this.configured = true;
  }

  private checkConfigured() {
    if (!this.configured) {
      throw new Error("VidNinja client not configured");
    }
  }

  async getSources(
    params: VidNinjaSourcesRequest,
  ): Promise<VidNinjaSourcesResponse> {
    this.checkConfigured();


    const queryParams = new URLSearchParams({
      tmdbId: params.tmdbId.toString(),
      type: params.type,
    });

    if (params.season) queryParams.append("season", params.season.toString());
    if (params.episode)
      queryParams.append("episode", params.episode.toString());

    const fullUrl = `${this.apiUrl}/sources?${queryParams}`;

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `VidNinja API error: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {

      throw error;
    }
  }

  async getStream(
    params: VidNinjaStreamRequest,
  ): Promise<VidNinjaStreamResponse> {
    this.checkConfigured();


    const queryParams = new URLSearchParams({
      sourceId: params.sourceId,
      tmdbId: params.tmdbId,
      type: params.type,
    });

    if (params.season) queryParams.append("season", params.season.toString());
    if (params.episode)
      queryParams.append("episode", params.episode.toString());

    const fullUrl = `${this.apiUrl}/cdn?${queryParams}`;

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `VidNinja API error: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {

      throw error;
    }
  }
}

export const vidNinjaClient = new VidNinjaClient();
