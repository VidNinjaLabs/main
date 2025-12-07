import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return public environment variables
  // These are safe to expose to the frontend
  res.status(200).json({
    TMDB_READ_API_KEY: process.env.TMDB_READ_API_KEY || '',
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || '',
  });
}
