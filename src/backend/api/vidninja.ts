/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-catch */
import type {
  BackendConfig,
  HealthDetailedResponse,
  HealthResponse,
  ProvidersResponse,
  ServerTimeResponse,
  SessionResponse,
  StreamResponse,
  ValidateResponse,
} from "./types";

const TOKEN_STORAGE_KEY = "jwt_token";

class BackendClient {
  [x: string]: any;
  private baseUrl: string = "";

  private configured: boolean = false;

  configure(config: BackendConfig) {
    this.baseUrl = config.baseUrl;
    this.configured = true;
  }

  private checkConfigured() {
    if (!this.configured) {
      throw new Error("Backend client not configured");
    }
  }

  // ==========================================================================
  // Token Management
  // ==========================================================================

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      return {
        "Content-Type": "application/json",
      };
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // ==========================================================================
  // Authentication Endpoints
  // ==========================================================================

  /**
   * POST /auth/session
   * Create a new session and get JWT token
   */
  async createSession(): Promise<SessionResponse> {
    this.checkConfigured();

    try {
      const response = await fetch(`${this.baseUrl}/auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Store the token (backend returns it in 'cache' field)
      const token = data.cache || data.token;
      if (token) {
        this.setToken(token);
      }

      return {
        token,
        sessionId: data.sessionId,
        visitId: data.visitId,
        expiresAt: 0, // Backend doesn't return this, we'll decode from JWT
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /auth/validate
   * Validate an existing JWT token
   */
  async validateToken(): Promise<ValidateResponse> {
    this.checkConfigured();

    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Validation error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // ==========================================================================
  // Streaming Endpoints
  // ==========================================================================

  /**
   * GET /stream/movie/:tmdbId
   * Get stream URLs for a movie
   */
  async scrapeMovie(
    tmdbId: string,
    provider?: string,
    session?: string,
    select?: string,
  ): Promise<StreamResponse> {
    this.checkConfigured();

    // Ensure we have a valid token
    await this.ensureAuthenticated();

    // URL for new backend structure: /media/movie/:id
    let url = `${this.baseUrl}/media/movie/${tmdbId}`;
    if (provider) {
      // Backend expects 'server' parameter for the provider ALIAS
      url += `?server=${encodeURIComponent(provider)}`;
    }
    // session/select are legacy/unused in current backend
    if (session) {
      // Keep for legacy compat if needed, but backend ignores it
      // url += ...
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Try to parse error response for session info
        try {
          const data = await response.json();
          if (data.session || data.error) {
            // Return data even if status is error (e.g. 404 with list of failed providers)
            // We throw if it's a critical error without data, but if we have data we might want to return it
            // for the UI to handle (e.g. "No streams found" but showing the list)
            if (response.status === 404 && data.session) {
              return data as StreamResponse;
            }
            throw new Error(data.error || `Scrape error: ${response.status}`);
          }
        } catch (e) {
          // ignore json parse error
        }
        const errorText = await response.text();
        throw new Error(`Scrape error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /stream/tv/:tmdbId/:season/:episode
   * Get stream URLs for a TV show episode
   */
  async scrapeShow(
    tmdbId: string,
    season: number,
    episode: number,
    provider?: string,
    session?: string,
    select?: string,
  ): Promise<StreamResponse> {
    this.checkConfigured();

    // Ensure we have a valid token
    await this.ensureAuthenticated();

    // URL for new backend structure: /media/show/:id/:season/:episode
    let url = `${this.baseUrl}/media/show/${tmdbId}/${season}/${episode}`;
    if (provider) {
      // Backend expects 'server' parameter
      url += `?server=${encodeURIComponent(provider)}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Try to parse error response for session info
        try {
          const data = await response.json();
          if (data.session || data.error) {
            if (response.status === 404 && data.session) {
              return data as StreamResponse;
            }
            throw new Error(data.error || `Scrape error: ${response.status}`);
          }
        } catch (e) {
          // ignore
        }
        const errorText = await response.text();
        throw new Error(`Scrape error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // ==========================================================================
  // Provider Endpoints
  // ==========================================================================

  /**
   * GET /providers
   * Get list of available providers
   */
  async getProviders(): Promise<ProvidersResponse> {
    this.checkConfigured();

    // Ensure we have a valid token
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/providers`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Providers error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Backend now returns array of providers directly: [{id, name}, ...]
      // Frontend expects: { sources: [...], embeds: [...] }
      if (Array.isArray(data)) {
        return {
          sources: data,
          embeds: [],
        };
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /status
   * Get provider status information (stub for now)
   */
  async getStatus(): Promise<Record<string, any>> {
    this.checkConfigured();

    // Stub implementation - returns empty object
    // Can be implemented when backend endpoint is available
    return {};
  }

  // ==========================================================================
  // Health Endpoints
  // ==========================================================================

  /**
   * GET /health
   * Basic health check
   */
  async getHealth(): Promise<HealthResponse> {
    this.checkConfigured();

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Health error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /health/detailed
   * Detailed health check with component status
   */
  async getHealthDetailed(): Promise<HealthDetailedResponse> {
    this.checkConfigured();

    try {
      const response = await fetch(`${this.baseUrl}/health/detailed`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Health error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /api/server-time
   * Get server time for clock synchronization
   */
  async getServerTime(): Promise<ServerTimeResponse> {
    this.checkConfigured();

    try {
      const response = await fetch(`${this.baseUrl}/api/server-time`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server time error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Ensures we have a valid authentication token.
   * Creates a new session if no token exists or token is expired.
   */
  async ensureAuthenticated(): Promise<void> {
    const token = this.getToken();

    if (!token || this.isTokenExpired()) {
      // No token or expired, create new session
      this.clearToken();
      await this.createSession();
    }
  }

  /**
   * Check if token is expired by decoding JWT
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}

// Export singleton instance
export const backendClient = new BackendClient();

// Legacy export for compatibility
export const vidNinjaClient = backendClient;
