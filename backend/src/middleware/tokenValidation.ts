// backend/src/middleware/tokenValidation.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { cache } from '../config/cache';

interface TokenValidationError extends Error {
  code?: string;
}

export async function validateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Check token blacklist cache first
    const isBlacklisted = await cache.get(`blacklisted_token:${token}`);
    if (isBlacklisted) {
      throw Object.assign(new Error('Token has been revoked'), { code: 'TOKEN_REVOKED' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    // Check database for valid session
    const session = await pool.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (session.rows.length === 0) {
      throw Object.assign(new Error('Invalid session'), { code: 'SESSION_INVALID' });
    }

    // Check if token needs refresh
    if (!decoded.iat) {
      throw Object.assign(new Error('Invalid token: missing iat claim'), { code: 'TOKEN_INVALID' });
    }
    const tokenAge = Math.floor((Date.now() - decoded.iat * 1000) / 1000);
    const refreshThreshold = 60 * 60; // 1 hour

    if (tokenAge > refreshThreshold) {
      const newToken = await refreshToken(decoded.userId);
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }

    // Add user data to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    const err = error as TokenValidationError;
    switch (err.code) {
      case 'TOKEN_REVOKED':
        return res.status(401).json({ error: 'Token has been revoked' });
      case 'SESSION_INVALID':
        return res.status(401).json({ error: 'Invalid session' });
      case 'TokenExpiredError':
        return res.status(401).json({ error: 'Token expired' });
      default:
        return res.status(401).json({ error: 'Invalid token' });
    }
  }
}

async function refreshToken(userId: string): Promise<string> {
  const userResult = await pool.query(
    'SELECT email, role FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];
  return jwt.sign(
    { 
      userId,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

export async function revokeToken(token: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete session
    await client.query('DELETE FROM sessions WHERE token = $1', [token]);

    // Add to blacklist cache
    await cache.set(`blacklisted_token:${token}`, true, 24 * 60 * 60);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function validateResetToken(token: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  return result.rows.length > 0;
}

export async function validateEmailToken(token: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT id FROM users WHERE verification_token = $1 AND verification_expires > NOW()',
    [token]
  );
  return result.rows.length > 0;
}

export function getTokenFromRequest(req: Request): string | null {
  return req.cookies.token || req.headers.authorization?.split(' ')[1] || null;
}
