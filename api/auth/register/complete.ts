import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';
import crypto from 'crypto';

interface RegisterCompleteRequest {
  namespace: string;
  publicKey: string;
  challenge: {
    code: string;
    signature: string;
  };
  device: string;
  profile: {
    colorA: string;
    colorB: string;
    icon: string;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as RegisterCompleteRequest;
    const { namespace, publicKey, challenge, device, profile } = body;

    // Validate required fields
    if (!namespace || !publicKey || !challenge || !device || !profile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: Verify signature against challenge
    // For now, we'll skip signature verification
    // In production, you should verify: verify(publicKey, challenge.code, challenge.signature)

    // Check if account already exists with this publicKey
    const existingUser = await prisma.user.findFirst({
      where: { publicKey }
    });

    if (existingUser) {
      // User exists - create new session and return
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const session = await prisma.session.create({
        data: {
          userId: existingUser.id,
          token: sessionToken,
          device,
          userAgent: req.headers['user-agent'] || '',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      return res.status(200).json({
        user: {
          id: existingUser.id,
          publicKey: existingUser.publicKey,
          namespace: existingUser.namespace,
          profile: existingUser.profile,
        },
        session: {
          id: session.id,
          userId: session.userId,
          createdAt: session.createdAt,
          accessedAt: session.accessedAt,
          device: session.device,
          userAgent: session.userAgent,
        },
        token: sessionToken,
      });
    }

    // Create new user account (backend sync only - no email/password)
    const user = await prisma.user.create({
      data: {
        publicKey,
        device,
        namespace,
        profile,
        // email and password remain null for backend-sync-only users
      },
    });

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        device,
        userAgent: req.headers['user-agent'] || '',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Return user and session data
    return res.status(201).json({
      user: {
        id: user.id,
        publicKey: user.publicKey,
        namespace: user.namespace,
        profile: user.profile,
      },
      session: {
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        accessedAt: session.accessedAt,
        device: session.device,
        userAgent: session.userAgent,
      },
      token: sessionToken,
    });
  } catch (error) {
    console.error('Register complete error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
