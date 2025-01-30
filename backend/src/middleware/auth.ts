// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/database';

import { AuthenticatedRequest, User } from '../types/auth';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    // Check if session exists and is valid
    const session = await pool.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (session.rows.length === 0) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Session expired' });
    }

    // Check if token is close to expiring (less than 1 hour remaining)
    const expiresAt = new Date(session.rows[0].expires_at);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    if (expiresAt < oneHourFromNow) {
      // Token is close to expiring, set header to trigger refresh
      res.setHeader('X-Token-Expired', 'true');
    }

    // Add user data to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    res.clearCookie('token');
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Rate limiting middleware
export const rateLimiter = (windowMs: number, max: number) => rateLimit({
  windowMs,
  max,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// Session validation
export const validateSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({
        error: 'No authentication token provided',
        details: 'Please ensure you are logged in and your session is valid'
      });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    console.log('Validating session token:', token.substring(0, 10) + '...');

    // First verify the JWT is valid
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError);
      res.clearCookie('token');
      return res.status(401).json({
        error: 'Invalid token',
        details: 'Your session token is invalid or has been tampered with'
      });
    }

    // Then check if session exists in database
    const session = await pool.query(
      'SELECT * FROM sessions WHERE token = $1 AND user_id = $2',
      [token, decoded.userId]
    );

    if (session.rows.length === 0) {
      console.log('No session found for token and user');
      res.clearCookie('token');
      return res.status(401).json({
        error: 'Invalid session',
        details: 'No active session found for this token'
      });
    }

    const sessionData = session.rows[0];
    const now = new Date();
    const expiresAt = new Date(sessionData.expires_at);

    if (expiresAt < now) {
      console.log('Session expired at:', expiresAt, 'Current time:', now);
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
      res.clearCookie('token');
      return res.status(401).json({
        error: 'Session expired',
        details: 'Your session has expired. Please log in again'
      });
    }

    // Add user data to request
    const user: User = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    req.user = user;

    console.log('Session validated successfully for user:', user.email);
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ error: 'Session validation failed' });
  }
};

// CSRF protection
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies['XSRF-TOKEN'];

  if (!token || token !== req.headers['x-xsrf-token']) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  next();
};
