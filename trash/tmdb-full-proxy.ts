/**
 * Full TMDB API Proxy for Cloudflare Workers
 * Mirrors the complete TMDB v3 API with geo-unblocking
 * Compatible with existing app structure
 */

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = 'a500049f3e06109fe3e8289b06cf5685';

export default {
  async fetch(request: Request): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      
      // Extract the TMDB API path (everything after the domain)
      // Example: /3/movie/550 or /search/multi
      const tmdbPath = url.pathname;
      
      // Build the full TMDB URL
      const tmdbUrl = new URL(TMDB_BASE + tmdbPath);
      
      // Copy all query parameters from the original request
      url.searchParams.forEach((value, key) => {
        tmdbUrl.searchParams.append(key, value);
      });
      
      // Add or override the API key
      tmdbUrl.searchParams.set('api_key', TMDB_API_KEY);
      
      // Copy headers from original request (for Authorization bearer tokens)
      const headers = new Headers();
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        headers.set('Authorization', authHeader);
      }
      headers.set('Accept', 'application/json');
      
      // Make the request to TMDB
      const tmdbResponse = await fetch(tmdbUrl.toString(), {
        method: request.method,
        headers,
      });
      
      // Get the response data
      const data = await tmdbResponse.text();
      
      // Return with CORS headers
      return new Response(data, {
        status: tmdbResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
      
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
