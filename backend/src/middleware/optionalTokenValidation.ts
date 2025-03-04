// backend/src/middleware/optionalTokenValidation.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

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

  // Log token validation attempt
  appLogger.debug('Token validation attempt:', createLogMetadata(req, {
    hasAuthHeader: !!req.headers.authorization,
    hasToken: !!token,
    path: req.path,
    method: req.method
  }));

  // If no token is present, continue without authentication
  if (!token) {
    appLogger.debug('No token present, continuing as anonymous', createLogMetadata(req));
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

    appLogger.debug('User authenticated:', createLogMetadata(req, { 
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }));

    next();
  } catch (error) {
    // On any token validation error, continue without authentication
    appLogger.debug('Token validation error, continuing as anonymous:', createLogMetadata(req, { error }));
    next();
  }
}
