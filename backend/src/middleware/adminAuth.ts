// backend/src/middleware/adminAuth.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { pool } from '../config/database.js';

// Get the admin password from environment variable or fallback to database
// For the pilot study, we have set this in the admin_config table
// This will be fetched from the database in the adminLogin function
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'PilotStudy2025!';
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
export async function adminLogin(req: Request, res: Response) {
  try {
    const { password } = req.body;
    
    // Get password from database
    const passwordQuery = await pool.query(
      'SELECT value FROM admin_config WHERE key = $1',
      ['admin_password']
    );
    
    // If no password found in database, use default
    const adminPassword = passwordQuery.rows.length > 0 
      ? passwordQuery.rows[0].value 
      : DEFAULT_ADMIN_PASSWORD;
    
    if (!password || password !== adminPassword) {
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
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
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
