/**
 * TMDB Metadata Proxy Worker
 * Simple API to fetch TMDB metadata without exposing TMDB structure
 * Handles authentication and geo-unblocking automatically
 * 
 * Usage:
 * - Movie: /?type=movie&id=550
 * - TV Show: /?type=show&id=1396&season=1&episode=1
 */

const TMDB_BASE = 'https://api.themoviedb.org';
const TMDB_API_KEY = 'a500049f3e06109fe3e8289b06cf5685';

export default {
  async fetch(request: Request): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const url = new URL(request.url);
      const type = url.searchParams.get('type'); // 'movie' or 'show'
      const id = url.searchParams.get('id');     // TMDB ID
      const season = url.searchParams.get('season');
      const episode = url.searchParams.get('episode');

      if (!type || !id) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required parameters',
            usage: 'Movie: /?type=movie&id=550 | Show: /?type=show&id=1396&season=1&episode=1'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      let tmdbData: any = {};

      // Fetch movie data
      if (type === 'movie') {
        const movieUrl = `${TMDB_BASE}/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
        const movieRes = await fetch(movieUrl);
        const movie: any = await movieRes.json();

        if (!movieRes.ok || movie.success === false) {
          throw new Error(movie.status_message || 'TMDB API error');
        }

        tmdbData = {
          type: 'movie',
          title: movie.title,
          releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
          tmdbId: id,
          imdbId: movie.imdb_id,
        };
      }
      // Fetch TV show data
      else if (type === 'show') {
        // Fetch series data
        const seriesUrl = `${TMDB_BASE}/3/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
        const seriesRes = await fetch(seriesUrl);
        const series: any = await seriesRes.json();

        if (!seriesRes.ok || series.success === false) {
          throw new Error(series.status_message || 'TMDB API error');
        }

        tmdbData = {
          type: 'show',
          title: series.name,
          releaseYear: series.first_air_date ? parseInt(series.first_air_date.split('-')[0]) : null,
          tmdbId: id,
          imdbId: series.external_ids?.imdb_id,
        };

        // Fetch season data if requested
        if (season) {
          const seasonUrl = `${TMDB_BASE}/3/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`;
          const seasonRes = await fetch(seasonUrl);
          const seasonData: any = await seasonRes.json();

          if (seasonRes.ok && seasonData.success !== false) {
            tmdbData.season = {
              number: seasonData.season_number,
              tmdbId: seasonData.id,
            };
          }
        }

        // Fetch episode data if requested
        if (season && episode) {
          const episodeUrl = `${TMDB_BASE}/3/tv/${id}/season/${season}/episode/${episode}?api_key=${TMDB_API_KEY}`;
          const episodeRes = await fetch(episodeUrl);
          const episodeData: any = await episodeRes.json();

          if (episodeRes.ok && episodeData.success !== false) {
            tmdbData.episode = {
              number: episodeData.episode_number,
              tmdbId: episodeData.id,
            };
          }
        }
      }
      else {
        return new Response(
          JSON.stringify({ error: 'Invalid type. Must be "movie" or "show"' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(tmdbData),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error: any) {
      return new Response(
        JSON.stringify({ 
          error: 'Proxy error', 
          message: error.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  },
};
