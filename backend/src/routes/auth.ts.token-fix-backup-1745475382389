// src/routes/auth.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserAuthService, AuthError, ValidationError } from '../services/userAuthService.js';
import { pool } from '../config/database.js';
import { authenticate, csrfProtection, generateCsrfToken } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';

// Cookie configuration
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
};

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();
const authService = new UserAuthService(pool);

// CSRF token endpoint
router.get('/csrf-token', generateCsrfToken, (req: Request, res: Response) => {
  res.json({ message: 'CSRF token generated' });
});

// Register new user
router.post('/register', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
      const result = await authService.registerUser(email, password, fullName);
      res.status(201).json({ message: 'User registered successfully', userId: result.userId });
    } catch (authError) {
      if (authError instanceof ValidationError) {
        return res.status(400).json({ error: authError.message });
      }
      if (authError instanceof AuthError) {
        return res.status(409).json({ error: authError.message });
      }
      throw authError;
    }
  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user - with alias support for both /login and /signin
router.post('/signin', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const result = await authService.loginUser(email, password);

      // Set HTTP-only cookies
      res.cookie('accessToken', result.accessToken, {
        ...COOKIE_CONFIG,
        maxAge: ACCESS_TOKEN_EXPIRY
      });

      res.cookie('refreshToken', result.refreshToken, {
        ...COOKIE_CONFIG,
        maxAge: REFRESH_TOKEN_EXPIRY
      });

      // Generate CSRF token
      generateCsrfToken(req, res, () => {});

      // Return user info and tokens for iOS compatibility
      res.json({
        message: 'Login successful',
        user: {
          id: result.userId,
          email: result.email,
          fullName: result.fullName,
          role: result.role
        },
        token: result.accessToken,       // Added for iOS compatibility
        refreshToken: result.refreshToken  // Added for iOS compatibility
      });
    } catch (authError) {
      if (authError instanceof AuthError) {
        return res.status(401).json({ error: authError.message });
      }
      throw authError;
    }
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout user
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('accessToken', COOKIE_CONFIG);
  res.clearCookie('refreshToken', COOKIE_CONFIG);
  res.json({ message: 'Logout successful' });
});

// Refresh tokens
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    try {
      const result = await authService.refreshToken(refreshToken);

      // Validate that we have an access token before proceeding
      if (!result || !result.accessToken) {
        console.error('Error: UserAuthService.refreshToken did not return a valid accessToken');
        return res.status(500).json({ error: 'Failed to generate new access token' });
      }

      // Set HTTP-only cookies
      res.cookie('accessToken', result.accessToken, {
        ...COOKIE_CONFIG,
        maxAge: ACCESS_TOKEN_EXPIRY
      });

      res.cookie('refreshToken', result.refreshToken, {
        ...COOKIE_CONFIG,
        maxAge: REFRESH_TOKEN_EXPIRY
      });

      // Generate CSRF token
      generateCsrfToken(req, res, () => {});

      // Log the response structure for debugging
      console.log('Token refresh response structure:', { 
        includesToken: Boolean(result.accessToken),
        includesRefreshToken: Boolean(result.refreshToken)
      });

      // Return tokens in response body along with message
      // This allows frontend to store tokens in localStorage as backup
      const responseBody = { 
        message: 'Tokens refreshed successfully',
        token: result.accessToken,
        refreshToken: result.refreshToken
      };
      
      // Log the response keys for debugging
      console.log('Token refresh response keys:', Object.keys(responseBody).join(', '));
      
      res.json(responseBody);
    } catch (authError) {
      console.error('AuthError during token refresh:', 
        authError instanceof Error ? authError.message : String(authError)
      );
      
      if (authError instanceof AuthError) {
        res.clearCookie('accessToken', COOKIE_CONFIG);
        res.clearCookie('refreshToken', COOKIE_CONFIG);
        return res.status(401).json({ error: authError.message });
      }
      throw authError;
    }
  } catch (error) {
    console.error('Token refresh error:', 
      error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error)
    );
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'UnknownError'
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log('Profile request received, user ID from request:', userId);
    
    if (!userId) {
      console.error('No user ID found in authenticated request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      console.log('Executing database query for user profile...');
      const result = await pool.query(
        'SELECT id, email, full_name, phone, address, role FROM users WHERE id = $1',
        [userId]
      );
      
      console.log('Database query completed. Row count:', result.rows.length);
      
      if (result.rows.length === 0) {
        console.error('User not found in database for ID:', userId);
        return res.status(404).json({ 
          error: 'User not found',
          message: 'The requested user profile could not be found'
        });
      }
      
      // Set cache control headers to prevent 304 responses
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Format the user data consistently
      const userData = {
        id: result.rows[0].id, // Add id field to match frontend expectations
        userId: result.rows[0].id, // Keep userId for backward compatibility
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        phone: result.rows[0].phone || '',
        address: result.rows[0].address || '',
        role: result.rows[0].role || 'user'
      };
      
      // Generate CSRF token when getting profile
      generateCsrfToken(req, res, () => {});

      // Log the response data for debugging
      console.log('Sending profile data:', JSON.stringify(userData));
      
      // Always return a 200 with fresh data
      return res.json(userData);
    } catch (dbError) {
      console.error('Database error in profile fetch:', dbError instanceof Error ? dbError.message : String(dbError));
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to fetch user profile from database'
      });
    }
  } catch (error) {
    console.error('Profile fetch error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching the profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticate, csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { fullName, phone, address } = req.body;
    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, full_name, phone, address, role, updated_at`,
      [fullName || null, phone || null, address || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Refresh CSRF token after profile update
    generateCsrfToken(req, res, () => {});

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Request password reset
router.post('/password-reset-request', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Return success even if email doesn't exist to prevent email enumeration
      return res.json({ message: 'If an account exists, a reset link will be sent' });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, email]
    );

    // TODO: Send email with reset link
    // For now, just return the token in development
    if (process.env.NODE_ENV === 'development') {
      res.json({ resetToken });
    } else {
      res.json({ message: 'If an account exists, a reset link will be sent' });
    }
  } catch (error) {
    console.error('Password reset request error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/password-reset', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = result.rows[0].id;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
      [passwordHash, userId]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;