import type { PaginatedTraktResponse, TraktListResponse } from "./types/trakt";

// Pagination utility
export function paginateResults(
  results: TraktListResponse,
  page: number,
  pageSize: number = 20,
  contentType: "movie" | "tv" | "both" = "both",
): PaginatedTraktResponse {
  // Add null/undefined checks
  if (!results) {
    console.warn("Trakt API returned null or undefined results");
    return {
      tmdb_ids: [],
      hasMore: false,
      totalCount: 0,
    };
  }

  let tmdbIds: number[];

  if (contentType === "movie") {
    tmdbIds = results.movie_tmdb_ids || [];
  } else if (contentType === "tv") {
    tmdbIds = results.tv_tmdb_ids || [];
  } else {
    // For 'both', combine movies and TV shows with null checks
    const movieIds = results.movie_tmdb_ids || [];
    const tvIds = results.tv_tmdb_ids || [];
    tmdbIds = [...movieIds, ...tvIds];
  }

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedIds = tmdbIds.slice(startIndex, endIndex);

  return {
    tmdb_ids: paginatedIds,
    hasMore: endIndex < tmdbIds.length,
    totalCount: tmdbIds.length,
  };
}
