// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

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
      return res.status(401).json({ error: 'Session expired' });
    }

    // Add user data to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
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

// Rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts. Please try again later.' }
});

// Session validation
export const validateSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    const session = await pool.query(
      'SELECT * FROM sessions WHERE token = $1',
      [token]
    );

    if (session.rows.length === 0) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (new Date(session.rows[0].expires_at) < new Date()) {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
      res.clearCookie('token');
      return res.status(401).json({ error: 'Session expired' });
    }

    next();
  } catch (error) {
    next(error);
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