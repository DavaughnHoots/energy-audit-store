// src/routes/auth.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserAuthService, AuthError, ValidationError } from '../services/userAuthService';
import { pool } from '../config/database';
import { authenticate, csrfProtection } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';

// Cookie configuration
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
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

// Register new user
router.post('/register', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, address } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await authService.registerUser(email, password, fullName, req.ip || '127.0.0.1', phone, address);
    // Set cookies
    res.cookie('accessToken', result.token, {
      ...COOKIE_CONFIG,
      maxAge: ACCESS_TOKEN_EXPIRY
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: REFRESH_TOKEN_EXPIRY
    });

    // Send user data without tokens
    const { token, refreshToken, ...userData } = result;
    res.status(201).json({ user: userData });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof AuthError) {
      res.status(401).json({ error: error.message });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Login user
router.post('/signin', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Cleanup expired tokens
    await authService.cleanupExpiredTokens();

    const result = await authService.loginUser(email, password, req.ip || '127.0.0.1');

    // Set cookies
    res.cookie('accessToken', result.token, {
      ...COOKIE_CONFIG,
      maxAge: ACCESS_TOKEN_EXPIRY
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: REFRESH_TOKEN_EXPIRY
    });

    // Send user data without tokens
    const { token, refreshToken, ...userData } = result;
    res.json({ user: userData });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(401).json({ error: error.message });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Logout user
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (accessToken && refreshToken) {
      await authService.logout(accessToken, refreshToken);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if blacklisting failed
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(500).json({ error: 'Logout failed, but cookies have been cleared' });
  }
});

// Refresh token
router.post('/refresh', authRateLimit, async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const result = await authService.refreshToken(refreshToken);

    // Set new cookies
    res.cookie('accessToken', result.token, {
      ...COOKIE_CONFIG,
      maxAge: ACCESS_TOKEN_EXPIRY
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: REFRESH_TOKEN_EXPIRY
    });

    res.json({ message: 'Tokens refreshed successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      'SELECT id, email, full_name, phone, address, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
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

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
