import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

const router = express.Router();

/**
 * Custom middleware to apply CORS headers to all routes in this router
 * Specifically for token-info route which has CORS issues
 */
router.use((req, res, next) => {
  appLogger.info('AUTH-TOKEN specific middleware executed', {
    path: req.path,
    origin: req.headers.origin,
    method: req.method,
    cookies: req.cookies ? Object.keys(req.cookies).length : 0
  });
  
  // Set CORS headers for all responses
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://energy-audit-store-e66479ed4f2b.herokuapp.com', 'https://energy-audit-store.herokuapp.com'] 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
  
  const origin = req.headers.origin;
  
  // Always set these headers regardless of origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, use wildcard
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // In production with unrecognized origin, use first allowed origin
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    appLogger.warn('Using fallback origin in auth-token route', {
      requestOrigin: origin,
      usingOrigin: allowedOrigins[0]
    });
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Log headers for debugging
    appLogger.info('AUTH-TOKEN OPTIONS - Sending response headers', {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
    });
    
    return res.status(200).end();
  }
  
  next();
});

/**
 * Route to provide token information to the frontend
 * This is needed because HttpOnly cookies can't be directly accessed by JavaScript
 */
router.get('/token-info', (req, res, next) => {
  // Add detailed logging for debugging
  appLogger.info('GET /token-info request received', {
    origin: req.headers.origin,
    method: req.method,
    path: req.path,
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host
    }
  });
  
  // Set CORS headers again just to be extra sure
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // Now proceed to authentication
  authenticate(req, res, next);
}, (req, res) => {
  try {
    // Extract the access token and refresh token from cookies
    const { accessToken, refreshToken } = req.cookies;
    
    // Log token state
    appLogger.info('Token state in /token-info route', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      user: (req as any).user ? 'present' : 'missing',
      corsHeaders: {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
      }
    });
    
    // If we don't have tokens in cookies, return empty
    if (!accessToken && !refreshToken) {
      return res.json({
        hasAccessToken: false,
        hasRefreshToken: false,
        userId: null,
        tokenInfo: null
      });
    }

    // Get the user from the request (added by authenticate middleware)
    const user = (req as any).user;

    // Return token info to the frontend
    return res.json({
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      userId: user?.id,
      tokenInfo: {
        userId: user?.id,
        email: user?.email,
        role: user?.role,
        exp: user?.exp
      }
    });
  } catch (error) {
    appLogger.error('Error in token-info endpoint', {
      error,
      stack: (error as Error).stack,
      path: req.path,
      origin: req.headers.origin
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;