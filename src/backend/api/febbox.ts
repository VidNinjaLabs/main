/* eslint-disable radix */
/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */

import {
  FebboxConfig,
  FebboxError,
  FebboxFileItem,
  FebboxQuality,
  FebboxSource,
  FebboxStream,
} from "./types";

class FebboxClient {
  private config: FebboxConfig | null = null;

  configure(config: FebboxConfig) {
    this.config = config;
  }

  private getConfig(): FebboxConfig {
    if (!this.config) {
      throw new FebboxError("Febbox client not configured");
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
    headers.set("x-auth-cookie", config.uiToken);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FebboxError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof FebboxError) {
        throw error;
      }
      throw new FebboxError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async searchContent(params: {
    title: string;
    type: "movie" | "tv";
  }): Promise<any> {
    const queryParams = new URLSearchParams({
      type: params.type,
      title: params.title,
    });

    return this.request(`/api/search?${queryParams}`);
  }

  async getFebboxId(params: { id: string; type: string }): Promise<string> {
    const queryParams = new URLSearchParams({
      id: params.id,
      type: params.type,
    });

    const response = await this.request<{ febBoxId: string }>(
      `/api/febbox/id?${queryParams}`,
    );
    return response.febBoxId;
  }

  async getFileList(params: {
    shareKey: string;
    parentId?: string;
  }): Promise<FebboxFileItem[]> {
    const queryParams = new URLSearchParams({
      shareKey: params.shareKey,
    });

    if (params.parentId) {
      queryParams.set("parent_id", params.parentId);
    }

    return this.request<FebboxFileItem[]>(`/api/febbox/files?${queryParams}`);
  }

  async getLinks(params: {
    shareKey: string;
    fid: string;
  }): Promise<FebboxQuality[]> {
    const queryParams = new URLSearchParams({
      shareKey: params.shareKey,
      fid: params.fid,
    });

    return this.request<FebboxQuality[]>(`/api/febbox/links?${queryParams}`);
  }

  async searchShowbox(title: string, type: "movie" | "show"): Promise<any> {
    const showboxType = type === "movie" ? "movie" : "tv"; // API expects 'movie' or 'tv' (or 'all')
    return this.request(
      `/api/search?title=${encodeURIComponent(title)}&type=${showboxType}`,
    );
  }

  async getShowboxMovie(id: string): Promise<any> {
    return this.request(`/api/movie/${id}`);
  }

  private isVideo(fileName: string): boolean {
    const lowerCaseFileName = fileName.toLowerCase();
    return (
      lowerCaseFileName.endsWith(".mp4") ||
      lowerCaseFileName.endsWith(".mkv") ||
      lowerCaseFileName.endsWith(".avi")
    );
  }

  async getStream(params: {
    tmdbId: string;
    type: "movie" | "show";
    title: string;
    season?: number;
    episode?: number;
  }): Promise<FebboxStream | null> {
    if (!this.config) return null;

    try {
      const showboxType = params.type === "movie" ? "1" : "2";
      let febboxId: string | null = null;

      // 1. Try to get Febbox ID (Share Key)
      try {
        const response = await this.request<{ febBoxId: string }>(
          `/api/febbox/id?id=${params.tmdbId}&type=${showboxType}`,
        );
        febboxId = response.febBoxId;
      } catch (error) {
        console.warn(
          "Failed to get Febbox ID via share link, trying fallback...",
          error,
        );
      }

      // 2. If Febbox ID found, use it (High Quality / VIP)
      if (febboxId) {
        let files = await this.getFileList({ shareKey: febboxId });
        let targetFile: FebboxFileItem | undefined;

        if (params.type === "movie") {
          targetFile = files
            .filter((f) => !f.is_dir && this.isVideo(f.file_name))
            .sort((a, b) => (b.size || 0) - (a.size || 0))[0];
        } else if (params.type === "show" && params.season && params.episode) {
          const seasonFolder = files.find(
            (f) =>
              f.is_dir &&
              (f.file_name.toLowerCase().includes(`season ${params.season}`) ||
                f.file_name.toLowerCase().includes(`s${params.season}`)),
          );

          if (seasonFolder) {
            files = await this.getFileList({
              shareKey: febboxId,
              parentId: seasonFolder.fid,
            });

            targetFile = files.find(
              (f) =>
                !f.is_dir &&
                this.isVideo(f.file_name) &&
                (f.file_name.toLowerCase().includes(`e${params.episode}`) ||
                  f.file_name
                    .toLowerCase()
                    .includes(`episode ${params.episode}`)),
            );
          }
        }

        if (targetFile) {
          const qualities = await this.getLinks({
            shareKey: febboxId,
            fid: targetFile.fid,
          });
          return this.createStream(qualities);
        }
      }

      // 3. Fallback: Use Showbox direct files (360p mostly)
      if (params.type === "movie") {
        console.log("Searching for movie on Showbox...", params.title);
        const searchResults = await this.searchShowbox(params.title, "movie");

        if (searchResults && searchResults.length > 0) {
          // Find the best match by year if possible, but for now take the first one
          // or filter by ID if we could map it.
          const movie = searchResults[0];
          const details = await this.getShowboxMovie(movie.id);

          if (details && details.file && details.file.length > 0) {
            const directFiles = details.file.filter(
              (f: any) => f.path && f.path.length > 0,
            );

            if (directFiles.length > 0) {
              const qualities: FebboxQuality[] = directFiles.map((f: any) => ({
                quality: f.quality || "360p",
                url: f.path,
                name: f.filename || "video",
                size: f.size || "",
                speed: "",
              }));

              return this.createStream(qualities);
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Febbox stream error:", error);
      return null;
    }
  }

  private createStream(qualities: FebboxQuality[]): FebboxStream {
    const bestQuality = qualities[0];

    if (!bestQuality) {
      throw new FebboxError("No quality options available");
    }

    return {
      id: `febbox-${Date.now()}`,
      type: "file",
      playlist: bestQuality.url,
      headers: {},
      flags: [],
      captions: [],
      qualities: qualities.reduce(
        (acc, q) => {
          acc[q.quality] = q;
          return acc;
        },
        {} as Record<string, FebboxQuality>,
      ),
    };
  }

  getSources(): FebboxSource[] {
    // Febbox disabled - requires Puppeteer for share key retrieval
    return [];

    /* const febboxApiUrl = conf().FEBBOX_API_URL;
    const febboxToken = conf().FEBBOX_UI_TOKEN;

    if (!febboxApiUrl || !febboxToken) {
      return [];
    }

    // Auto-configure client if not already configured
    if (!this.config) {
      this.configure({
        apiUrl: febboxApiUrl,
        uiToken: febboxToken,
      });
    }

    return [
      {
        id: "febbox",
        name: "Febbox",
        rank: 100,
        type: "source",
        mediaTypes: ["movie", "show"],
      },
    ]; */
  }
}

export const febboxClient = new FebboxClient();
