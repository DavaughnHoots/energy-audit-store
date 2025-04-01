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

export async function optionalTokenValidation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

  // Log token validation attempt with more details
  appLogger.debug('Optional token validation attempt:', createLogMetadata(req, {
    hasAuthHeader: !!req.headers.authorization,
    hasToken: !!token,
    path: req.path,
    method: req.method,
    cookies: Object.keys(req.cookies),
    hasAccessToken: !!req.cookies.accessToken
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
      appLogger.debug('Token is blacklisted, continuing as anonymous', createLogMetadata(req));
      return next(); // Skip blacklisted token but continue
    }

    // Enhanced debug logging
    appLogger.debug('Verifying JWT token', createLogMetadata(req, {
      token: token.substring(0, 10) + '...' // Only log first few chars for security
    }));

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    } catch (jwtError) {
      appLogger.debug('JWT verification failed', createLogMetadata(req, { 
        error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error' 
      }));
      return next(); // Continue as anonymous on JWT error
    }

    // Note: We're skipping the session check for optional validation
    // This allows valid JWT tokens to be accepted even if they're not in the sessions table

    // Add user data to request if token is valid
    req.user = {
      id: decoded.userId, // Use 'id' instead of 'userId' to match route expectations
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
