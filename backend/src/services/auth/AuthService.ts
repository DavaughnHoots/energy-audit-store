// backend/src/services/auth/AuthService.ts

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from '../emailService';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const SESSION_EXPIRY = '24h';

export class AuthService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async signIn(email: string, password: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get user and verify password
      const userResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        throw new AuthError('Invalid credentials');
      }

      const user = userResult.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        throw new AuthError('Invalid credentials');
      }

      if (!user.email_verified) {
        throw new AuthError('Email not verified', 'EMAIL_NOT_VERIFIED');
      }

      // Generate session token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: SESSION_EXPIRY }
      );

      // Create session
      const sessionId = uuidv4();
      await client.query(
        `INSERT INTO sessions (
          id, user_id, token, expires_at
        ) VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
        [sessionId, user.id, token]
      );

      // Update last login
      await client.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      await client.query('COMMIT');

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        },
        token,
        sessionId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async signOut(sessionId: string) {
    await this.pool.query(
      'DELETE FROM sessions WHERE id = $1',
      [sessionId]
    );
  }

  async validateSession(sessionId: string) {
    const result = await this.pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()',
      [sessionId]
    );
    return result.rows.length > 0;
  }

  async refreshSession(sessionId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const session = await client.query(
        'SELECT * FROM sessions WHERE id = $1',
        [sessionId]
      );

      if (session.rows.length === 0) {
        throw new AuthError('Invalid session');
      }

      const newToken = jwt.sign(
        {
          userId: session.rows[0].user_id,
          sessionId: sessionId
        },
        JWT_SECRET,
        { expiresIn: SESSION_EXPIRY }
      );

      await client.query(
        `UPDATE sessions 
         SET token = $1, 
             expires_at = NOW() + INTERVAL '24 hours'
         WHERE id = $2`,
        [newToken, sessionId]
      );

      await client.query('COMMIT');
      return newToken;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyPasswordResetToken(token: string) {
    const result = await this.pool.query(
      `SELECT user_id FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    return result.rows.length > 0;
  }

  async resetPassword(token: string, newPassword: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const tokenResult = await client.query(
        `SELECT user_id FROM password_reset_tokens
         WHERE token = $1 AND expires_at > NOW()`,
        [token]
      );

      if (tokenResult.rows.length === 0) {
        throw new AuthError('Invalid or expired token');
      }

      const userId = tokenResult.rows[0].user_id;
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, userId]
      );

      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
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
}

export class AuthError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export const authService = new AuthService(new Pool());