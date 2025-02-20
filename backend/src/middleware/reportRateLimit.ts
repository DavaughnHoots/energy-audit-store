import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { appLogger } from '../config/logger';

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Create a rate limiter instance for report generation
const reportLimiter = new RateLimiterMemory({
  points: 5, // Number of reports allowed
  duration: 3600, // Per hour (in seconds)
  blockDuration: 3600, // Block for 1 hour if limit exceeded
});

// Create a separate limiter for concurrent report generation
const concurrentLimiter = new RateLimiterMemory({
  points: 2, // Maximum concurrent report generations
  duration: 1, // Per second
  blockDuration: 10, // Block for 10 seconds if limit exceeded
});

interface RateLimitError extends Error {
  msBeforeNext?: number;
}

export const reportRateLimit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Check hourly limit
    await reportLimiter.consume(userId);
    
    // Check concurrent limit
    await concurrentLimiter.consume(userId);

    // Add cleanup when request ends
    res.on('finish', async () => {
      try {
        await concurrentLimiter.delete(userId);
      } catch (err) {
        const error = err as Error;
        appLogger.error('Error cleaning up rate limiter:', { 
          error: error.message,
          userId 
        });
      }
    });

    next();
  } catch (err) {
    const error = err as RateLimitError;
    const retryAfter = Math.floor((error.msBeforeNext || 3600000) / 1000);
    
    appLogger.warn('Rate limit exceeded for report generation:', {
      userId,
      retryAfter,
      error: error.message
    });

    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Too many report generation requests',
      retryAfter,
      message: `Please try again in ${Math.ceil(retryAfter / 60)} minutes`
    });
  }
};

// Middleware to track active report generations
const activeReports = new Map<string, number>();

export const trackReportGeneration = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const currentActive = activeReports.get(userId) || 0;
  
  if (currentActive >= 2) {
    return res.status(429).json({
      error: 'Too many concurrent report generations',
      message: 'Please wait for your other reports to complete'
    });
  }

  activeReports.set(userId, currentActive + 1);

  // Clean up when request ends
  res.on('finish', () => {
    const active = activeReports.get(userId) || 0;
    if (active > 0) {
      activeReports.set(userId, active - 1);
    }
  });

  next();
};

// Export combined middleware
export const reportGenerationLimiter = [reportRateLimit, trackReportGeneration];
