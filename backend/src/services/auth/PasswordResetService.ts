// backend/src/services/auth/PasswordResetService.ts

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { emailService } from '../emailService';

const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY = '1h';

export class PasswordResetService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async requestReset(email: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'SELECT id, full_name FROM users WHERE email = $1 AND email_verified = true',
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        // Return success even if email doesn't exist to prevent email enumeration
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1);

      // Delete any existing reset tokens for this user
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [userResult.rows[0].id]
      );

      // Create new reset token
      await client.query(
        `INSERT INTO password_reset_tokens (
          user_id, token, expires_at
        ) VALUES ($1, $2, $3)`,
        [userResult.rows[0].id, resetToken, resetExpires]
      );

      // Send reset email
      await emailService.sendPasswordResetEmail({
        to: email,
        token: resetToken
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get valid reset token
      const tokenResult = await client.query(
        `SELECT user_id 
         FROM password_reset_tokens 
         WHERE token = $1 AND expires_at > NOW()`,
        [token]
      );

      if (tokenResult.rows.length === 0) {
        throw new PasswordResetError('Invalid or expired reset token');
      }

      const userId = tokenResult.rows[0].user_id;

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await client.query(
        `UPDATE users 
         SET password_hash = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [passwordHash, userId]
      );

      // Delete used reset token
      await client.query(
        'DELETE FROM password_reset_tokens WHERE token = $1',
        [token]
      );

      // Invalidate all sessions for this user
      await client.query(
        'DELETE FROM sessions WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async validateResetToken(token: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    return result.rows.length > 0;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.pool.query(
      'DELETE FROM password_reset_tokens WHERE expires_at <= NOW()'
    );
  }
}

export class PasswordResetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordResetError';
  }
}