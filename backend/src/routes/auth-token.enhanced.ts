import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

const router = express.Router();

/**
 * Custom middleware to apply CORS headers to all routes in this router
 * Enhanced with detailed logging for debugging purposes
 */
router.use((req, res, next) => {
  const requestTime = new Date();
  appLogger.info('AUTH-TOKEN-ROUTER specific middleware START', {
    timestamp: requestTime.toISOString(),
    path: req.path,
    origin: req.headers.origin,
    method: req.method,
    cookies: req.cookies ? Object.keys(req.cookies).length : 0,
    allHeaders: JSON.stringify(req.headers),
    url: req.url,
    nodeEnv: process.env.NODE_ENV || 'undefined'
  });
  
  // DEBUGGING MODE: Set CORS headers extremely permissively for troubleshooting
  // This is NOT for production use, only for identifying the exact issue
  const origin = req.headers.origin;
  
  // Log origin info for debugging
  appLogger.info('AUTH-TOKEN-ROUTER handling origin', {
    receivedOrigin: origin || 'none',
    isOptionsRequest: req.method === 'OPTIONS',
    corsHeadersAlreadySet: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
    }
  });
  
  // For debugging purposes, accept ANY origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    appLogger.info('AUTH-TOKEN-ROUTER using provided origin', { origin });
  } else {
    // No origin header
    res.setHeader('Access-Control-Allow-Origin', '*');
    appLogger.info('AUTH-TOKEN-ROUTER using wildcard origin (no origin in request)');
  }
  
  // Set extremely permissive CORS headers for debugging
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Log the headers we're setting
  appLogger.info('AUTH-TOKEN-ROUTER CORS headers being set', {
    'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
    'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
  });
  
  // Handle OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    appLogger.info('AUTH-TOKEN-ROUTER - OPTIONS request - responding immediately', {
      corsHeadersBeforeSend: {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
      }
    });
    
    return res.status(200).end();
  }
  
  // Log the time spent in this middleware
  appLogger.info('AUTH-TOKEN-ROUTER specific middleware END', {
    processingTime: new Date().getTime() - requestTime.getTime() + 'ms'
  });
  
  next();
});

/**
 * Route to provide token information to the frontend
 * This is needed because HttpOnly cookies can't be directly accessed by JavaScript
 */
router.get('/token-info', (req, res, next) => {
  // Add detailed logging for debugging
  appLogger.info('GET /token-info request START', {
    origin: req.headers.origin,
    method: req.method,
    path: req.path,
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    allHeaders: JSON.stringify(req.headers),
    corsHeaders: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
    }
  });
  
  // Force CORS headers again directly on this route
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  appLogger.info('GET /token-info - proceeding to authentication');
  
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
      const response = {
        hasAccessToken: false,
        hasRefreshToken: false,
        userId: null,
        tokenInfo: null
      };
      
      appLogger.info('No tokens found, returning empty response', { response });
      return res.json(response);
    }

    // Get the user from the request (added by authenticate middleware)
    const user = (req as any).user;
    
    const response = {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      userId: user?.id,
      tokenInfo: {
        userId: user?.id,
        email: user?.email,
        role: user?.role,
        exp: user?.exp
      }
    };

    // Return token info to the frontend
    appLogger.info('Returning token info response', {
      userId: user?.id,
      hasTokens: {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken
      }
    });
    
    return res.json(response);
  } catch (error) {
    appLogger.error('Error in token-info endpoint', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      path: req.path,
      origin: req.headers.origin
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;