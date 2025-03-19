import rateLimit from 'express-rate-limit';
import { RequestHandler, Request, Response, NextFunction } from 'express';

/**
 * Creates a rate limiter with the specified parameters
 * 
 * @param max Maximum number of requests allowed within the window
 * @param windowMs Time window in milliseconds
 * @param skipSuccesses Whether to skip successful requests when counting against the limit
 * @returns Express request handler implementing the rate limiter
 */
const createLimiter = (
  max: number,
  windowMs: number = 15 * 60 * 1000,
  skipSuccesses: boolean = false
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true, // Skip failed requests (like 404s)
    skipSuccessfulRequests: skipSuccesses, // Skip successful requests if specified
  }) as unknown as RequestHandler;
};

// Rate limiting configurations with specific limits
export const standardLimiter = createLimiter(100); // 100 requests per 15 minutes
export const authLimiter = createLimiter(20, 5 * 60 * 1000);  // 20 requests per 5 minutes

// General API rate limiter
export const apiLimiter = createLimiter(1000);     // 1000 requests per 15 minutes

// Product-specific rate limiters - significantly increased to handle bursts of traffic
export const productsLimiter = createLimiter(6000, 5 * 60 * 1000); // 6000 requests per 5 minutes for general product routes
export const productDetailLimiter = createLimiter(1500, 1 * 60 * 1000, true); // 1500 requests per 1 minute for product detail views
export const productSearchLimiter = createLimiter(1000, 1 * 60 * 1000); // 1000 requests per minute for search operations

// Emergency disablers - for troubleshooting specific routes
export const noLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // This middleware does nothing but pass control to the next middleware
  // Used to bypass rate limiting for debugging
  next();
};
