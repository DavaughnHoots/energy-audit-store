// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { UserAuthService, AuthError } from '../services/userAuthService.js';
import { AuthenticatedRequest, User } from '../types/auth.js';

// Version identifier for logging
const AUTH_MIDDLEWARE_VERSION = 'v1.2';

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

/**
 * Robustly extracts an access token from either
 *   – Authorization header (`Bearer <token>`)
 *   – `accessToken` cookie (fallback)
 */
function getAccessToken(req: Request): string | null {
  const rawHeader = req.headers.authorization?.trim();
  console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Raw Auth Header: "${rawHeader || 'undefined'}"`);
  
  // Only accept Bearer token if it has a non-empty token part
  if (rawHeader?.toLowerCase().startsWith('bearer ') && rawHeader.length > 7) {
    const token = rawHeader.slice(7).trim();
    if (token && token.length > 0) {
      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Token extracted from header (first 10 chars): ${token.substring(0, 10)}...`);
      return token;
    }
    console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Bearer header had empty token`);
  } else {
    console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Auth header not in Bearer format or missing`);
  }
  
  // Fallback to cookie if header gave nothing
  if (req.cookies?.accessToken && req.cookies.accessToken !== 'undefined') {
    const cookieToken = req.cookies.accessToken;
    console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Using token from cookie (first 10 chars): ${cookieToken.substring(0, 10)}...`);
    return cookieToken;
  }
  
  console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] No valid token found in header or cookie`);
  return null;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip auth for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Skipping auth for OPTIONS request`);
      return next();
    }
    
    // Check if route requires authentication
    const publicRoutes = ['/api/products', '/api/recommendations'];
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    // Log authentication attempt for debugging
    console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Authentication attempt for path: ${req.path}`);
    console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Cookies:`, req.cookies);
    console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Headers:`, {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type'],
      host: req.headers.host
    });

    // Try to get token from header or cookie
    const accessToken = getAccessToken(req);
    const refreshToken = req.cookies?.refreshToken;

    console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Access Token: ${accessToken ? 'Present' : 'Missing'}`);
    console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Refresh Token: ${refreshToken ? 'Present' : 'Missing'}`);

    if (!accessToken) {
      if (isPublicRoute) {
        console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Public route, proceeding without auth`);
        return next(); // Allow access to public routes without authentication
      }
      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] No access token found`);
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Verify access token
      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Verifying access token...`);
      const decoded = await authService.verifyToken(accessToken);
      if (decoded) {
        console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Token verified successfully for user: ${decoded.userId}`);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };

        // Check if token is close to expiring
        const tokenExp = decoded.exp ? decoded.exp * 1000 : 0;
        if (tokenExp - Date.now() < REFRESH_THRESHOLD && refreshToken) {
          console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Token near expiry, attempting refresh`);
          try {
            // Attempt to refresh tokens
            const { token: newAccessToken, refreshToken: newRefreshToken } =
              await authService.refreshToken(refreshToken);

            // Set new cookies
            res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);
            res.cookie('refreshToken', newRefreshToken, COOKIE_CONFIG);
            
            console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Tokens refreshed successfully`);
          } catch (refreshError) {
            // Log refresh error but continue with current token
            console.error(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Token refresh failed:`, refreshError);
          }
        }
      }

      next();
    } catch (error) {
      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Token verification failed:`, error);
      if (error instanceof AuthError) {
        if (refreshToken) {
          console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Attempting token refresh after verification failure`);
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
              console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Token refresh and verification successful`);
            }

            return next();
          } catch (refreshError) {
            console.error(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Token refresh failed:`, refreshError);
            // Clear cookies if refresh fails
            res.clearCookie('accessToken', COOKIE_CONFIG);
            res.clearCookie('refreshToken', COOKIE_CONFIG);
            return res.status(401).json({ error: 'Session expired' });
          }
        }
        return res.status(401).json({ error: error.message });
      }
      return next(error); // Pass error to Express error handler
    }
  } catch (error) {
    console.error(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Authentication error:`, error);
    res.clearCookie('accessToken', COOKIE_CONFIG);
    res.clearCookie('refreshToken', COOKIE_CONFIG);
    return next(error); // Pass error to Express error handler
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