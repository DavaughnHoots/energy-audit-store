// backend/src/middleware/security.ts

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pool } from '../config/database';

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests. Please try again later.' }
});

export const auditLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 audits per day
  message: { error: 'Daily audit limit reached.' }
});

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests. Please try again later.' }
});

// IP blocking middleware
export const ipBlocker = async (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  
  const result = await pool.query(
    'SELECT * FROM blocked_ips WHERE ip = $1 AND blocked_until > NOW()',
    [clientIP]
  );

  if (result.rows.length > 0) {
    return res.status(403).json({ 
      error: 'Access denied',
      blockedUntil: result.rows[0].blocked_until
    });
  }

  next();
};

// Security headers
export const securityHeaders = [
  helmet(),
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL || 'http://localhost:5000'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  }),
  helmet.dnsPrefetchControl({ allow: false }),
  helmet.frameguard({ action: 'deny' }),
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }),
  helmet.referrerPolicy({ policy: 'same-origin' })
];

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim().replace(/[<>]/g, '');
      }
    });
  }
  next();
};

// Brute force protection
interface FailedAttempt {
  count: number;
  firstAttempt: Date;
  blockedUntil?: Date;
}

const failedAttempts = new Map<string, FailedAttempt>();

export const bruteForceProtection = async (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  const attempt = failedAttempts.get(clientIP) || { count: 0, firstAttempt: new Date() };

  if (attempt.blockedUntil && attempt.blockedUntil > new Date()) {
    return res.status(403).json({
      error: 'Account locked',
      blockedUntil: attempt.blockedUntil
    });
  }

  // Reset if outside window
  if (Date.now() - attempt.firstAttempt.getTime() > 15 * 60 * 1000) {
    failedAttempts.delete(clientIP);
  }

  req.on('end', () => {
    if (res.statusCode === 401) {
      attempt.count++;
      
      if (attempt.count >= 5) {
        attempt.blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        
        // Log to database
        pool.query(
          'INSERT INTO blocked_ips (ip, blocked_until) VALUES ($1, $2)',
          [clientIP, attempt.blockedUntil]
        ).catch(console.error);
      }
      
      failedAttempts.set(clientIP, attempt);
    }
  });

  next();
};

// CORS configuration
export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600
};

// SQL injection protection
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlInjectionPattern = /('|--|;|\/\*|\*\/|xp_|UNION|SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE)/i;
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string' && sqlInjectionPattern.test(value)) {
      return true;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => checkValue(v));
    }
    return false;
  };

  if (checkValue(req.query) || checkValue(req.body)) {
    return res.status(403).json({ error: 'Invalid input detected' });
  }

  next();
};