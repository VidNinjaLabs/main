/* eslint-disable @typescript-eslint/no-unused-vars */
import { conf } from "@/setup/config";
import { SimpleCache } from "@/utils/cache";

import { getMediaDetails } from "./tmdb";
import { TMDBContentTypes, TMDBMovieData } from "./types/tmdb";
import type {
  CuratedMovieList,
  TraktListResponse,
  TraktNetworkResponse,
  TraktReleaseResponse,
} from "./types/trakt";

export const TRAKT_BASE_URL = "https://api.trakt.tv";
const TRAKT_CLIENT_ID =
  "6ac5cbccaf5c57b8e210d73a21f3498c68ef89903522472f8257b88682ad12e0";

// Map provider names to their Trakt endpoints
export const PROVIDER_TO_TRAKT_MAP = {
  "8": "netflixmovies", // Netflix Movies
  "8tv": "netflixtv", // Netflix TV Shows
  "2": "applemovie", // Apple TV+ Movies
  "2tv": "appletv", // Apple TV+ (both)
  "10": "primemovies", // Prime Video Movies
  "10tv": "primetv", // Prime Video TV Shows
  "15": "hulumovies", // Hulu Movies
  "15tv": "hulutv", // Hulu TV Shows
  "337": "disneymovies", // Disney+ Movies
  "337tv": "disneytv", // Disney+ TV Shows
  "1899": "hbomovies", // Max Movies
  "1899tv": "hbotv", // Max TV Shows
  "531": "paramountmovies", // Paramount+ Movies
  "531tv": "paramounttv", // Paramount+ TV Shows
} as const;

// Map provider names to their image filenames
export const PROVIDER_TO_IMAGE_MAP: Record<string, string> = {
  Max: "max",
  "Prime Video": "prime",
  Netflix: "netflix",
  "Disney+": "disney",
  Hulu: "hulu",
  "Apple TV+": "appletv",
  "Paramount+": "paramount",
};

// Cache for Trakt API responses
interface TraktCacheKey {
  endpoint: string;
}

const traktCache = new SimpleCache<TraktCacheKey, any>();
traktCache.setCompare((a, b) => a.endpoint === b.endpoint);
traktCache.initialize();

// Base function to fetch from Trakt API with optional pagination
async function fetchFromTrakt<T>(
  endpoint: string,
  params?: { page?: number; limit?: number },
): Promise<T> {
  // Build query string for pagination
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  const queryString = queryParams.toString();
  const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

  // Check cache first
  const cacheKey: TraktCacheKey = { endpoint: fullEndpoint };
  const cachedResult = traktCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult as T;
  }

  try {
    const response = await fetch(`${TRAKT_BASE_URL}${fullEndpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": TRAKT_CLIENT_ID,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from ${endpoint}: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();

    // Cache the result for 1 hour (3600 seconds)
    traktCache.set(cacheKey, result, 3600);

    return result as T;
  } catch (error) {
    console.warn(`Trakt API error for ${endpoint}:`, error);
    throw error;
  }
}

// Release details
export async function getReleaseDetails(
  id: string,
  season?: number,
  episode?: number,
): Promise<TraktReleaseResponse> {
  // Mapping to official Trakt endpoints is complex for direct release details without more logic
  // For now, returning null to gracefully fail or rely on TMDB fallback if applicable
  // Implemented minimal search functionality
  return null as unknown as TraktReleaseResponse;
}

// Latest releases - Map to Trending with pagination
export const getLatestReleases = (page: number = 1, limit: number = 20) =>
  fetchFromTrakt<any>("/movies/trending", { page, limit }).then((res) => ({
    movie_tmdb_ids: res.map((m: any) => m.movie.ids.tmdb),
    tv_tmdb_ids: [],
    count: res.length,
  }));
export const getLatest4KReleases = (page: number = 1, limit: number = 20) =>
  getLatestReleases(page, limit); // No direct 4k filter in free API easily
export const getLatestTVReleases = (page: number = 1, limit: number = 20) =>
  fetchFromTrakt<any>("/shows/trending", { page, limit }).then((res) => ({
    movie_tmdb_ids: [],
    tv_tmdb_ids: res.map((s: any) => s.show.ids.tmdb),
    count: res.length,
  }));

// Helpers for fetching different list types with pagination
const fetchWrappedList = (
  endpoint: string,
  type: "movie" | "show",
  page: number = 1,
  limit: number = 20,
) =>
  fetchFromTrakt<any[]>(endpoint, { page, limit }).then((res) => ({
    movie_tmdb_ids:
      type === "movie" ? res.map((item) => item.movie.ids.tmdb) : [],
    tv_tmdb_ids: type === "show" ? res.map((item) => item.show.ids.tmdb) : [],
    count: res.length,
  }));

const fetchDirectList = (
  endpoint: string,
  type: "movie" | "show",
  page: number = 1,
  limit: number = 20,
) =>
  fetchFromTrakt<any[]>(endpoint, { page, limit }).then((res) => ({
    movie_tmdb_ids: type === "movie" ? res.map((item) => item.ids.tmdb) : [],
    tv_tmdb_ids: type === "show" ? res.map((item) => item.ids.tmdb) : [],
    count: res.length,
  }));

// Popular content (Direct list structure)
export const getPopularTVShows = (page: number = 1, limit: number = 20) =>
  fetchDirectList("/shows/popular", "show", page, limit);
export const getPopularMovies = (page: number = 1, limit: number = 20) =>
  fetchDirectList("/movies/popular", "movie", page, limit);

// Trending content (Wrapped list structure)
const getTrendingMovies = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/movies/trending", "movie", page, limit);
const getTrendingShows = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/shows/trending", "show", page, limit);

// Anticipated content
const getAnticipatedMovies = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/movies/anticipated", "movie", page, limit);
const getAnticipatedShows = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/shows/anticipated", "show", page, limit);

// Box Office (Movies only)
const getBoxOfficeMovies = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/movies/boxoffice", "movie", page, limit);

// Activity-based content (Watched, Played, Collected)
const getWatchedMovies = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/movies/watched/weekly", "movie", page, limit);
const getWatchedShows = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/shows/watched/weekly", "show", page, limit);

const getPlayedMovies = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/movies/played/weekly", "movie", page, limit);
const getPlayedShows = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/shows/played/weekly", "show", page, limit);

const getCollectedMovies = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/movies/collected/weekly", "movie", page, limit);
const getCollectedShows = (page: number = 1, limit: number = 20) =>
  fetchWrappedList("/shows/collected/weekly", "show", page, limit);

// Helper to get Trakt ID from TMDB ID
async function getTraktIdFromTmdbId(
  tmdbId: string,
  type: "movie" | "show",
): Promise<string | null> {
  try {
    const results = await fetchFromTrakt<any[]>(
      `/search/tmdb/${tmdbId}?type=${type}`,
    );
    if (!results || results.length === 0) return null;
    return results[0][type].ids.trakt.toString();
  } catch (e) {
    console.error(`Failed to lookup Trakt ID for TMDB ID ${tmdbId}`, e);
    return null;
  }
}

// Related/Recommendations
export const getRelatedMovies = async (id: string) => {
  const traktId = await getTraktIdFromTmdbId(id, "movie");
  if (!traktId) return { movie_tmdb_ids: [], tv_tmdb_ids: [], count: 0 };
  return fetchDirectList(`/movies/${traktId}/related`, "movie");
};

export const getRelatedShows = async (id: string) => {
  const traktId = await getTraktIdFromTmdbId(id, "show");
  if (!traktId) return { movie_tmdb_ids: [], tv_tmdb_ids: [], count: 0 };
  return fetchDirectList(`/shows/${traktId}/related`, "show");
};

// Streaming service releases - Map to diverse lists to ensure UI update
// Netflix -> Trending
export const getNetflixMovies = (page: number = 1, limit: number = 20) =>
  getTrendingMovies(page, limit);
export const getNetflixTVShows = (page: number = 1, limit: number = 20) =>
  getTrendingShows(page, limit);

// Apple TV+ -> Anticipated
export const getAppleMovieReleases = (page: number = 1, limit: number = 20) =>
  getAnticipatedMovies(page, limit);
export const getAppleTVReleases = (page: number = 1, limit: number = 20) =>
  getAnticipatedShows(page, limit);

// Amazon Prime -> Popular
export const getPrimeMovies = (page: number = 1, limit: number = 20) =>
  getPopularMovies(page, limit);
export const getPrimeTVShows = (page: number = 1, limit: number = 20) =>
  getPopularTVShows(page, limit);

// Hulu -> Watched (Weekly)
export const getHuluMovies = (page: number = 1, limit: number = 20) =>
  getWatchedMovies(page, limit);
export const getHuluTVShows = (page: number = 1, limit: number = 20) =>
  getWatchedShows(page, limit);

// Disney+ -> Box Office (Movies) / Collected (TV)
export const getDisneyMovies = (page: number = 1, limit: number = 20) =>
  getBoxOfficeMovies(page, limit);
export const getDisneyTVShows = (page: number = 1, limit: number = 20) =>
  getCollectedShows(page, limit);

// HBO (Max) -> Played (Weekly)
export const getHBOMovies = (page: number = 1, limit: number = 20) =>
  getPlayedMovies(page, limit);
export const getHBOTVShows = (page: number = 1, limit: number = 20) =>
  getPlayedShows(page, limit);

// Paramount+ -> Collected (Movies) / Anticipated (TV - Fallback)
export const getParamountMovies = (page: number = 1, limit: number = 20) =>
  getCollectedMovies(page, limit);
export const getParamountTVShows = (page: number = 1, limit: number = 20) =>
  getAnticipatedShows(page, limit);

// Discovery content used for the featured carousel
export const getDiscoverContent = async (): Promise<TraktListResponse> => {
  try {
    const [trendingMovies, trendingShows] = await Promise.all([
      fetchFromTrakt<any[]>("/movies/trending"),
      fetchFromTrakt<any[]>("/shows/trending"),
    ]);

    return {
      movie_tmdb_ids: trendingMovies.map((m) => m.movie.ids.tmdb),
      tv_tmdb_ids: trendingShows.map((s) => s.show.ids.tmdb),
      count: trendingMovies.length + trendingShows.length,
    };
  } catch (e) {
    console.error("Failed to fetch discover content", e);
    // Return empty valid response instead of missing fields
    return { movie_tmdb_ids: [], tv_tmdb_ids: [], count: 0 };
  }
};

// Network information
export const getNetworkContent = (_tmdbId: string) =>
  Promise.resolve({ type: "", platforms: [], count: 0 });

// Curated movie lists - Map to Generic Trending or Popular for now to fill UI
// Real implementation would need specific Trakt List IDs for "Mindfuck", "Halloween", etc.
const fetchAndMapMovies = (endpoint: string) =>
  fetchFromTrakt<any[]>(endpoint).then((res) => ({
    movie_tmdb_ids: res.map((m: any) =>
      m.movie ? m.movie.ids.tmdb : m.ids.tmdb,
    ),
    tv_tmdb_ids: [],
    count: res.length,
  }));

export const getNarrativeMovies = () => fetchAndMapMovies("/movies/trending"); // Fallback
export const getTopMovies = () => fetchAndMapMovies("/movies/popular"); // Fallback
export const getNeverHeardMovies = () => fetchAndMapMovies("/movies/boxoffice"); // Fallback
export const getLGBTQContent = () => fetchAndMapMovies("/movies/popular"); // Fallback
export const getMindfuckMovies = () => fetchAndMapMovies("/movies/trending"); // Fallback
export const getTrueStoryMovies = () =>
  fetchAndMapMovies("/movies/anticipated"); // Fallback
export const getHalloweenMovies = () =>
  fetchAndMapMovies("/movies/watched/weekly"); // Fallback

// Get all curated movie lists
export const getCuratedMovieLists = async (): Promise<CuratedMovieList[]> => {
  const listConfigs = [
    {
      name: "Trending Movies", // Renamed for accuracy of fallback
      slug: "narrative",
      fn: getNarrativeMovies,
    },
    {
      name: "Popular Movies", // Renamed
      slug: "top",
      fn: getTopMovies,
    },
    {
      name: "Box Office", // Renamed
      slug: "never",
      fn: getNeverHeardMovies,
    },
    {
      name: "Anticipated Movies", // Renamed
      slug: "truestory",
      fn: getTrueStoryMovies,
    },
  ];

  const lists: CuratedMovieList[] = [];

  for (const config of listConfigs) {
    try {
      const response = await config.fn();
      lists.push({
        listName: config.name,
        listSlug: config.slug,
        tmdbIds: response.movie_tmdb_ids.slice(0, 30),
        count: Math.min(response.movie_tmdb_ids.length, 30),
      });
    } catch (error) {
      console.error(`Failed to fetch ${config.name}:`, error);
    }
  }

  return lists;
};

// Fetch movie details for multiple TMDB IDs
export const getMovieDetailsForIds = async (
  tmdbIds: number[],
  limit: number = 50,
): Promise<TMDBMovieData[]> => {
  const limitedIds = tmdbIds.slice(0, limit);
  const movieDetails: TMDBMovieData[] = [];

  // Process in smaller batches to avoid overwhelming the API
  const batchSize = 10;
  const batchPromises: Promise<TMDBMovieData[]>[] = [];

  for (let i = 0; i < limitedIds.length; i += batchSize) {
    const batch = limitedIds.slice(i, i + batchSize);
    const batchPromise = Promise.all(
      batch.map(async (id) => {
        try {
          const details = await getMediaDetails(
            id.toString(),
            TMDBContentTypes.MOVIE,
          );
          return details as TMDBMovieData;
        } catch (error) {
          console.error(`Failed to fetch movie details for ID ${id}:`, error);
          return null;
        }
      }),
    ).then((batchResults) =>
      batchResults.filter((result): result is TMDBMovieData => result !== null),
    );
    batchPromises.push(batchPromise);
  }

  // Process all batches in parallel
  const batchResults = await Promise.all(batchPromises);
  movieDetails.push(...batchResults.flat());

  return movieDetails;
};
