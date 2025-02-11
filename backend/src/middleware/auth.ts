// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { UserAuthService, AuthError } from '../services/userAuthService';
import { AuthenticatedRequest, User } from '../types/auth';

const authService = new UserAuthService(pool);

// Constants for token refresh
const REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Verify access token
      const decoded = await authService.verifyToken(accessToken);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      // Check if token is close to expiring
      const tokenExp = decoded.exp ? decoded.exp * 1000 : 0;
      if (tokenExp - Date.now() < REFRESH_THRESHOLD && refreshToken) {
        try {
          // Attempt to refresh tokens
          const { token: newAccessToken, refreshToken: newRefreshToken } =
            await authService.refreshToken(refreshToken);

          // Set new cookies
          res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          });

          res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          });
        } catch (refreshError) {
          // Log refresh error but continue with current token
          console.error('Token refresh failed:', refreshError);
        }
      }

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        if (refreshToken) {
          try {
            // Attempt to refresh tokens
            const { token: newAccessToken, refreshToken: newRefreshToken } =
              await authService.refreshToken(refreshToken);

            // Set new cookies
            res.cookie('accessToken', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            });

            res.cookie('refreshToken', newRefreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            });

            // Verify new access token
            const decoded = await authService.verifyToken(newAccessToken);
            req.user = {
              id: decoded.userId,
              email: decoded.email,
              role: decoded.role
            };

            return next();
          } catch (refreshError) {
            // Clear cookies if refresh fails
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(401).json({ error: 'Session expired' });
          }
        }
        return res.status(401).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
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

// CSRF protection
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF check for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];

  if (!token || !headerToken || token !== headerToken) {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token'
    });
  }

  next();
};

// Generate CSRF token
export const generateCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = jwt.sign({}, process.env.JWT_SECRET!, { expiresIn: '1h' });
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  next();
};
