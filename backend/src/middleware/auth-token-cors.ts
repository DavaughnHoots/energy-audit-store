/**
 * Special CORS middleware specifically for auth-token routes
 * This ensures CORS headers are set before any auth checks
 * Enhanced with detailed logging for debugging
 */

import { Request, Response, NextFunction } from 'express';
import { appLogger } from '../utils/logger.js';

export function authTokenCorsMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Enhanced request logging with timing information
    const requestTime = new Date();
    appLogger.info('AUTH-TOKEN CORS MIDDLEWARE START', {
      timestamp: requestTime.toISOString(),
      path: req.path,
      method: req.method,
      origin: req.headers.origin,
      host: req.headers.host,
      cookie: !!req.headers.cookie,
      requestId: req.id || 'no-request-id',
      allHeaders: JSON.stringify(req.headers),
      nodeEnv: process.env.NODE_ENV || 'undefined',
      requestUrl: req.url
    });

    // Set CORS headers for ALL routes
    const allowedOrigins = [
      'https://energy-audit-store-e66479ed4f2b.herokuapp.com',
      'https://energy-audit-store.herokuapp.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];
    
    const origin = req.headers.origin;
    
    // Debugging mode - always log origins for this route
    appLogger.info('AUTH-TOKEN CORS checking origin', {
      receivedOrigin: origin,
      allowedOrigins: allowedOrigins,
      originInAllowed: origin ? allowedOrigins.includes(origin) : false,
      isProduction: process.env.NODE_ENV === 'production',
      path: req.path
    });
    
    // FOR TESTING: During this debugging phase, we're going to be extra permissive with CORS
    // We'll log detailed information about what's happening while still allowing the request
    if (origin) {
      // If we have an origin, use it - even if not in our allowed list
      // This is more permissive than normal but helps with debugging
      res.setHeader('Access-Control-Allow-Origin', origin);
      appLogger.info('AUTH-TOKEN CORS accepting origin for debugging', { origin });
    } else {
      // No origin header - use a default one
      res.setHeader('Access-Control-Allow-Origin', '*');
      appLogger.info('AUTH-TOKEN CORS using wildcard origin (no origin in request)');
    }
    
    // Super-permissive headers during debugging
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Log the response headers we're setting
    appLogger.info('AUTH-TOKEN CORS headers being set', {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
      'Access-Control-Max-Age': res.getHeader('Access-Control-Max-Age')
    });
    
    // Handle OPTIONS requests immediately without further processing
    if (req.method === 'OPTIONS') {
      appLogger.info('AUTH-TOKEN CORS OPTIONS REQUEST - responding immediately', {
        path: req.path,
        origin: req.headers.origin,
        headers: JSON.stringify(req.headers)
      });
      
      return res.status(200).end();
    }
    
    // For normal requests, continue to the next middleware
    appLogger.info('AUTH-TOKEN CORS MIDDLEWARE END - continuing to next middleware', {
      method: req.method,
      path: req.path,
      processingTime: new Date().getTime() - requestTime.getTime() + 'ms'
    });
    
    next();
  } catch (error) {
    // Enhanced error logging
    appLogger.error('AUTH-TOKEN CORS MIDDLEWARE ERROR', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      path: req.path,
      method: req.method,
      headers: JSON.stringify(req.headers)
    });
    
    // Even if there's an error, set basic CORS headers to improve chance of success
    try {
      if (req.headers.origin) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      appLogger.info('AUTH-TOKEN CORS emergency headers set after error');
    } catch (headerError) {
      appLogger.error('Failed to set emergency CORS headers', { error: headerError });
    }
    
    // Continue to next middleware even if there was an error
    next();
  }
}
