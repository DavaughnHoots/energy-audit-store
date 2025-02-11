import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// General API rate limiter - 100 requests per minute per IP
const apiLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
});

// Stricter auth endpoints rate limiter - 5 requests per minute per IP
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of points
  duration: 60, // Per 60 seconds
});

// Rate limit by IP address
const getRateLimitMiddleware = (limiter: RateLimiterMemory) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip;
      await limiter.consume(ip);
      next();
    } catch (error) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Please try again later',
        retryAfter: Math.ceil((error as any).msBeforeNext / 1000) || 60
      });
    }
  };
};

export const apiRateLimit = getRateLimitMiddleware(apiLimiter);
export const authRateLimit = getRateLimitMiddleware(authLimiter);

// Specific rate limiters for different endpoints
const createEndpointLimiter = (points: number, duration: number) => {
  const limiter = new RateLimiterMemory({
    points,
    duration,
  });
  return getRateLimitMiddleware(limiter);
};

export const createCustomRateLimit = {
  // 20 requests per minute
  moderate: () => createEndpointLimiter(20, 60),
  // 50 requests per minute
  standard: () => createEndpointLimiter(50, 60),
  // 200 requests per minute
  high: () => createEndpointLimiter(200, 60),
  // Custom configuration
  custom: (points: number, duration: number) => createEndpointLimiter(points, duration),
};
