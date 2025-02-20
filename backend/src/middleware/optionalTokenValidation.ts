// backend/src/middleware/optionalTokenValidation.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { cache } from '../config/cache';
import { AuthenticatedRequest } from '../types/auth';

interface TokenValidationError extends Error {
  code?: string;
}

// Extend Request to include user property
interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export async function optionalTokenValidation(req: RequestWithUser, res: Response, next: NextFunction) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  // If no token is present, continue without authentication
  if (!token) {
    return next();
  }

  try {
    // Check token blacklist cache
    const isBlacklisted = await cache.get(`blacklisted_token:${token}`);
    if (isBlacklisted) {
      return next(); // Skip blacklisted token but continue
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    // Check database for valid session
    const session = await pool.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (session.rows.length === 0) {
      return next(); // Skip invalid session but continue
    }

    // Add user data to request if token is valid
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    // On any token validation error, continue without authentication
    next();
  }
}
