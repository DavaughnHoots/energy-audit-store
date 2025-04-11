/**
 * Special CORS middleware specifically for auth-token routes
 * This ensures CORS headers are set before any auth checks
 */

import { appLogger } from '../utils/logger.js';

export function authTokenCorsMiddleware(req, res, next) {
  try {
    // Log every request to auth-token endpoints for debugging
    appLogger.info('Auth-token CORS middleware executing', {
      path: req.path,
      method: req.method,
      origin: req.headers.origin,
      isAuthTokenRoute: req.path.includes('/auth-token'),
      requestId: req.id || 'no-request-id'
    });

    // Set CORS headers for ALL routes, but especially for auth-token
    const allowedOrigins = [
      'https://energy-audit-store-e66479ed4f2b.herokuapp.com',
      'https://energy-audit-store.herokuapp.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];
    
    const origin = req.headers.origin;
    
    // Always set Allow-Origin
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV !== 'production') {
      // In dev, allow all origins
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      // In production with unknown origin, use the first allowed origin
      // This is technically not correct but better than nothing
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
      appLogger.warn('Using default origin for unknown request origin', {
        defaultOrigin: allowedOrigins[0],
        requestOrigin: origin,
        path: req.path
      });
    }
    
    // Always set these headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle OPTIONS requests immediately without further processing
    if (req.method === 'OPTIONS') {
      appLogger.info('Responding to OPTIONS request', {
        path: req.path,
        origin: req.headers.origin,
        headers: {
          'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
          'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
        }
      });
      
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      return res.status(200).end();
    }
    
    // For normal requests, continue to the next middleware
    next();
  } catch (error) {
    appLogger.error('Error in auth-token CORS middleware', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    next();
  }
}
