import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import prisma from '../lib/prisma';

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

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

    const data = (await response.json()) as { success: boolean };
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
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
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

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Verify Turnstile if token provided
    if (turnstileToken) {
      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid security check' });
      }
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true },
    });

    // Prevent timing attacks: always run bcrypt even if user not found
    const passwordHash = user?.password || '$2a$10$dummyhashtopreventtimingattack';
    const isValidPassword = await bcrypt.compare(password, passwordHash);

    // Check both conditions together to prevent timing attacks
    if (!user || !isValidPassword) {
      // Log failed attempt
      console.log({
        timestamp: new Date().toISOString(),
        action: 'login_failed',
        email: email.toLowerCase(),
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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

    // Log successful login
    console.log({
      timestamp: new Date().toISOString(),
      action: 'login_success',
      userId: user.id,
      email: user.email,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });

    // Return user data and token
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
