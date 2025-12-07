import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get VidNinja credentials from environment (NOT exposed to frontend)
  const apiUrl = process.env.VIDNINJA_API_URL;
  const apiKey = process.env.VIDNINJA_API_KEY;

  if (!apiUrl || !apiKey) {
    return res.status(500).json({ 
      error: 'VidNinja API not configured on server' 
    });
  }

  try {
    // Forward the request to VidNinja API
    const { tmdbId, type, season, episode } = req.body;

    // Validate input
    if (!tmdbId || !type) {
      return res.status(400).json({ 
        error: 'Missing required parameters: tmdbId and type' 
      });
    }

    // Build VidNinja API URL
    let vidninjaUrl = `${apiUrl}/sources`;
    const params = new URLSearchParams({
      tmdbId: tmdbId.toString(),
      type,
    });

    if (season) params.append('season', season.toString());
    if (episode) params.append('episode', episode.toString());

    // Make request to VidNinja API
    const response = await fetch(`${vidninjaUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`VidNinja API error: ${response.status}`);
    }

    const data = await response.json();

    // Return the sources to frontend
    return res.status(200).json(data);
  } catch (error) {
    console.error('VidNinja proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch sources from VidNinja' 
    });
  }
}
