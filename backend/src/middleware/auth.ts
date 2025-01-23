// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { UserAuthService } from '../services/userAuthService';
import { pool } from '../../backend/src/config/database';

const authService = new UserAuthService(pool);

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await authService.verifyToken(token);

    req.user = decoded as { userId: string; email: string; role: string };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const rateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) => {
  const requests = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const now = Date.now();
    const userRequests = requests.get(ip) || [];

    // Remove old requests
    const recentRequests = userRequests.filter(
      (time: number) => time > now - windowMs
    );

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later'
      });
    }

    recentRequests.push(now);
    requests.set(ip, recentRequests);

    next();
  };
};

// CSRF Protection
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const csrfToken = req.headers['x-csrf-token'];
  const storedToken = req.session?.csrfToken;

  if (!csrfToken || !storedToken || csrfToken !== storedToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};