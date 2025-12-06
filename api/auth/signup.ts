import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Verify Cloudflare Turnstile token
async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  // Skip verification if secret key is not configured
  if (!secretKey) {
    console.log('Turnstile verification skipped - no secret key configured');
    return true;
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data = await response.json() as { success: boolean };
    return data.success;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, turnstileToken } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Verify Turnstile if token provided
    if (turnstileToken) {
      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid security check' });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'USER',
        isPremium: false,
      },
    });

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Return user data and token
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
