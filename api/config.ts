import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return public configuration
  // NEVER expose secret keys here!
  res.status(200).json({
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
    enablePremium: process.env.ENABLE_PREMIUM === 'true',
    backendUrl: process.env.BACKEND_URL || '',
    appDomain: process.env.APP_DOMAIN || '',
    // Add other PUBLIC config here
  });
}
