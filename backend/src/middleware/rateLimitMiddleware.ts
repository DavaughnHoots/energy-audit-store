import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

const createLimiter = (max: number, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true, // Skip failed requests (like 404s)
  }) as unknown as RequestHandler;
};

// Rate limiting configurations with specific limits
export const standardLimiter = createLimiter(100); // 100 requests per 15 minutes
export const authLimiter = createLimiter(20, 5 * 60 * 1000);  // 20 requests per 5 minutes
export const apiLimiter = createLimiter(1000);     // 1000 requests per 15 minutes (increased from 300)
export const productsLimiter = createLimiter(1500, 5 * 60 * 1000); // 1500 requests per 5 minutes specifically for products
