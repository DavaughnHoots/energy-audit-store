// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { UserAuthService, AuthError } from '../services/userAuthService.js';
import { AuthenticatedRequest, User } from '../types/auth.js';

const authService = new UserAuthService(pool);

// Constants for token refresh
const REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds

// Cookie settings
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if route requires authentication
    const publicRoutes = ['/api/products', '/api/recommendations'];
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    // Log authentication attempt for debugging
    console.log(`Authentication attempt for path: ${req.path}`);
    console.log('Cookies:', req.cookies);
    
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    console.log('Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');

    if (!accessToken) {
      if (isPublicRoute) {
        return next(); // Allow access to public routes without authentication
      }
      console.log('No access token found');
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Verify access token
      const decoded = await authService.verifyToken(accessToken);
      if (decoded) {
        console.log('Token verified successfully');
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };

        // Check if token is close to expiring
        const tokenExp = decoded.exp ? decoded.exp * 1000 : 0;
        if (tokenExp - Date.now() < REFRESH_THRESHOLD && refreshToken) {
          console.log('Token near expiry, attempting refresh');
          try {
            // Attempt to refresh tokens
            const { token: newAccessToken, refreshToken: newRefreshToken } =
              await authService.refreshToken(refreshToken);

            // Set new cookies
            res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);
            res.cookie('refreshToken', newRefreshToken, COOKIE_CONFIG);
            
            console.log('Tokens refreshed successfully');
          } catch (refreshError) {
            // Log refresh error but continue with current token
            console.error('Token refresh failed:', refreshError);
          }
        }
      }

      next();
    } catch (error) {
      console.log('Token verification failed:', error);
      if (error instanceof AuthError) {
        if (refreshToken) {
          console.log('Attempting token refresh after verification failure');
          try {
            // Attempt to refresh tokens
            const { token: newAccessToken, refreshToken: newRefreshToken } =
              await authService.refreshToken(refreshToken);

            // Set new cookies
            res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);
            res.cookie('refreshToken', newRefreshToken, COOKIE_CONFIG);

            // Verify new access token
            const decoded = await authService.verifyToken(newAccessToken);
            if (decoded) {
              req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role
              };
              console.log('Token refresh and verification successful');
            }

            return next();
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear cookies if refresh fails
            res.clearCookie('accessToken', COOKIE_CONFIG);
            res.clearCookie('refreshToken', COOKIE_CONFIG);
            return res.status(401).json({ error: 'Session expired' });
          }
        }
        return res.status(401).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.clearCookie('accessToken', COOKIE_CONFIG);
    res.clearCookie('refreshToken', COOKIE_CONFIG);
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
    ...COOKIE_CONFIG,
    httpOnly: false // Must be accessible to JavaScript
  });
  next();
};
