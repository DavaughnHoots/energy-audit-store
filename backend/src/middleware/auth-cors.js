/**
 * Special CORS middleware specifically for auth routes
 * This ensures CORS headers are set before any auth checks for profile routes
 */

import { appLogger } from '../utils/logger.js';

export function authCorsMiddleware(req, res, next) {
  try {
    // Log every request to auth endpoints for debugging
    appLogger.info('Auth CORS middleware executing', {
      fullUrl: req.originalUrl,
      path: req.path,
      method: req.method,
      origin: req.headers.origin,
      isAuthRoute: true, // Already in /api/auth path
      requestId: req.id || 'no-request-id'
    });

    // Set CORS headers for auth routes
    const allowedOrigins = [
      'https://energy-audit-store-e66479ed4f2b.herokuapp.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];
    
    const origin = req.headers.origin;
    
    // Enhanced logging for origin handling
    appLogger.info('Auth CORS processing origin', {
      receivedOrigin: origin || 'no-origin',
      path: req.path,
      method: req.method,
      requestId: req.id || 'no-request-id'
    });
    
    // Always set Allow-Origin
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      appLogger.info('Setting specific origin header', {
        origin,
        path: req.path
      });
    } else if (process.env.NODE_ENV !== 'production') {
      // In dev, allow all origins
      res.setHeader('Access-Control-Allow-Origin', '*');
      appLogger.info('Setting wildcard origin (development mode)', {
        path: req.path
      });
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
    
    // Always set these headers with explicit list of headers instead of wildcard
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle OPTIONS requests immediately without further processing
    if (req.method === 'OPTIONS') {
      // Enhanced logging for OPTIONS request
      appLogger.info('OPTIONS request details', {
        path: req.path,
        headers: req.headers,
        corsResponseHeaders: {
          'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
          'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
        }
      });
      
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Force flush log to ensure we see this in logs
      try {
        appLogger.flush && appLogger.flush();
      } catch (error) {
        // Ignore flush errors
      }
      
      return res.status(200).end();
    }
      
    // For normal requests, continue to the next middleware
    next();
  } catch (error) {
    appLogger.error('Error in auth CORS middleware', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    next();
  }
}
