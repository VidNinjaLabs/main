import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { captchaToken } = req.body;

    // TODO: Verify captcha token if provided
    // For now, just generate a challenge

    // Generate a random challenge string
    const challenge = Buffer.from(
      Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
    ).toString('base64');

    return res.status(200).json({ challenge });
  } catch (error) {
    console.error('Register start error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
