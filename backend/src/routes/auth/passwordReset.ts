// backend/src/routes/auth/passwordReset.ts

import express from 'express';
import { PasswordResetService } from '../../services/auth/PasswordResetService';
import { pool } from '../../config/database.js';
import { rateLimiter } from '../../middleware/security';
import { validateRequest } from '../../middleware/validators';
import { z } from 'zod';

const router = express.Router();
const passwordResetService = new PasswordResetService(pool);

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(64, 'Invalid token format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

// Request password reset
router.post('/request-reset',
  rateLimiter,
  validateRequest(requestResetSchema),
  async (req, res) => {
    try {
      await passwordResetService.requestReset(req.body.email);
      res.json({ 
        message: 'If an account exists with this email, a reset link will be sent'
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to process reset request' 
      });
    }
  }
);

// Validate reset token
router.get('/validate-token/:token', async (req, res) => {
  try {
    const isValid = await passwordResetService.validateResetToken(req.params.token);
    res.json({ isValid });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to validate token' 
    });
  }
});

// Reset password
router.post('/reset',
  rateLimiter,
  validateRequest(resetPasswordSchema),
  async (req, res) => {
    try {
      await passwordResetService.resetPassword(
        req.body.token,
        req.body.password
      );
      res.json({ 
        message: 'Password reset successful' 
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'PasswordResetError') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Failed to reset password' 
        });
      }
    }
  }
);

// Handle expired token cleanup
setInterval(async () => {
  try {
    await passwordResetService.cleanupExpiredTokens();
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
  }
}, 60 * 60 * 1000); // Run every hour

export default router;
