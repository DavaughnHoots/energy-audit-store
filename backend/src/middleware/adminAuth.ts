// backend/src/middleware/adminAuth.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Secret hardcoded for the pilot study
// In a production environment, this would come from environment variables
const ADMIN_PASSWORD = 'Energy-Audit-Admin-Password-2025!';
const COOKIE_NAME = 'admin_session';
const SESSION_SECRET = 'energy-audit-admin-session-secret';

// Cookie settings
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Generate a secure session token
 */
export function generateSessionToken(password: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(password + Date.now());
  return hmac.digest('hex');
}

/**
 * Validate admin credentials and set session cookie
 */
export function adminLogin(req: Request, res: Response) {
  const { password } = req.body;
  
  if (!password || password !== ADMIN_PASSWORD) {
    // Add slight delay to prevent timing attacks
    setTimeout(() => {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }, 500);
    return;
  }

  // Create session token
  const sessionToken = generateSessionToken(password);
  
  // Set cookie
  res.cookie(COOKIE_NAME, sessionToken, COOKIE_CONFIG);
  
  return res.json({ success: true });
}

/**
 * Check if the admin is authenticated
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.cookies[COOKIE_NAME];
  
  if (!sessionToken) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  // In a real implementation, we would validate the token against a stored value
  // For the pilot study, we'll accept any non-empty token
  if (sessionToken) {
    return next();
  }
  
  return res.status(401).json({ success: false, message: 'Invalid session' });
}

/**
 * Clear admin session
 */
export function adminLogout(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, COOKIE_CONFIG);
  return res.json({ success: true });
}
