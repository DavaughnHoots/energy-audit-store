// src/routes/emailVerification.ts
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Send verification email
router.post('/send-verification', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const verifyToken = uuidv4();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      `UPDATE users
       SET email_verify_token = $1,
           email_verify_expires = $2
       WHERE id = $3`,
      [verifyToken, verifyExpires, userId]
    );

    // TODO: Integrate with email service
    const verificationLink = `${process.env.APP_URL}/verify-email/${verifyToken}`;

    if (process.env.NODE_ENV === 'development') {
      res.json({ verificationLink });
    } else {
      res.json({ message: 'Verification email sent' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           email_verify_token = NULL,
           email_verify_expires = NULL
       WHERE email_verify_token = $1
       AND email_verify_expires > CURRENT_TIMESTAMP
       RETURNING id`,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Check verification status
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ verified: result.rows[0].email_verified });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check verification status' });
  }
});

export default router;
