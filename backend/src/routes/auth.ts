// src/routes/auth.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserAuthService } from '../services/userAuthService';
import { pool } from '../config/database';
import { authenticate, csrfProtection } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const router = express.Router();
const authService = new UserAuthService(pool);

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, address } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await authService.registerUser(email, password, fullName, phone, address);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Login user
router.post('/signin', async (req: Request, res: Response) => {
  try {
    console.log('Signin attempt:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const result = await authService.loginUser(email, password);

    // Set HTTP-only cookie with JWT
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json(result);
  } catch (error) {
    console.error('Signin error:', error);
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Logout user
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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
    const userId = req.user?.userId;
    const { fullName, phone, address } = req.body;

    const updatedUser = await authService.updateUserProfile(userId!, {
      fullName,
      phone,
      address
    });

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Request password reset
router.post('/password-reset-request', async (req: Request, res: Response) => {
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
router.post('/password-reset', async (req: Request, res: Response) => {
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
