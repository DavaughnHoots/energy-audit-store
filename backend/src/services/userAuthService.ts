// src/services/userAuthService.ts

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

const SALT_ROUNDS = 12;
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

interface LoginAttempt {
  count: number;
  firstAttempt: number;
}

export class UserAuthService {
  private pool: Pool;
  private loginAttempts: Map<string, LoginAttempt>;

  constructor(pool: Pool) {
    this.pool = pool;
    this.loginAttempts = new Map();

    // Cleanup expired login attempts every hour
    setInterval(() => this.cleanupLoginAttempts(), 60 * 60 * 1000);
  }

  private cleanupLoginAttempts() {
    const now = Date.now();
    for (const [ip, attempt] of this.loginAttempts.entries()) {
      if (now - attempt.firstAttempt > LOGIN_ATTEMPT_WINDOW) {
        this.loginAttempts.delete(ip);
      }
    }
  }

  private async checkRateLimit(ip: string): Promise<void> {
    const attempt = this.loginAttempts.get(ip) || { count: 0, firstAttempt: Date.now() };
    const now = Date.now();

    // Reset if outside window
    if (now - attempt.firstAttempt > LOGIN_ATTEMPT_WINDOW) {
      attempt.count = 1;
      attempt.firstAttempt = now;
    } else {
      attempt.count++;
    }

    this.loginAttempts.set(ip, attempt);

    if (attempt.count > MAX_LOGIN_ATTEMPTS) {
      const minutesLeft = Math.ceil((LOGIN_ATTEMPT_WINDOW - (now - attempt.firstAttempt)) / 60000);
      throw new AuthError(`Too many login attempts. Please try again in ${minutesLeft} minutes.`);
    }
  }

  async registerUser(
    email: string, 
    password: string, 
    fullName: string, 
    ip: string, 
    phone?: string, 
    address?: string,
    auditId?: string
  ) {
    try {
      await this.checkRateLimit(ip);

      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      if (!validatePassword(password)) {
        throw new ValidationError(
          `Password must be at least ${MIN_LENGTH} characters long and contain uppercase, lowercase, number, and a special character (${SPECIAL_CHARS})`
        );
      }

      // Check if user already exists
      const existingUser = await this.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new AuthError('User already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Insert new user
        const result = await client.query(
          `INSERT INTO users (id, email, password_hash, full_name, phone, address, role, failed_login_attempts)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, email, full_name, role, created_at`,
          [uuidv4(), email, passwordHash, fullName, phone || null, address || null, 'user', 0]
        );

        // Generate tokens
        const { token, refreshToken } = await this.generateTokenPair(result.rows[0]);

        // Store refresh token
        await client.query(
          `INSERT INTO refresh_tokens (token, user_id, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
          [refreshToken, result.rows[0].id]
        );

        // If auditId is provided, associate it with the new user
        if (auditId) {
          await client.query(
            'UPDATE energy_audits SET user_id = $1 WHERE id = $2 AND user_id IS NULL',
            [result.rows[0].id, auditId]
          );
        }

        await client.query('COMMIT');

        return {
          user: result.rows[0],
          token,
          refreshToken,
          associatedAudit: auditId ? true : false
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loginUser(email: string, password: string, ip: string) {
    const client = await this.pool.connect();
    try {
      await this.checkRateLimit(ip);
      await client.query('BEGIN');

      // Get user by email
      const userResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = userResult.rows[0];
      if (!user) {
        throw new AuthError('Invalid email or password');
      }

      // Check if account is locked
      if (user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutTime = new Date(user.last_failed_login);
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);

        if (new Date() < lockoutTime) {
          const minutesLeft = Math.ceil((lockoutTime.getTime() - new Date().getTime()) / 60000);
          throw new AuthError(`Account is locked. Please try again in ${minutesLeft} minutes`);
        } else {
          // Reset failed attempts if lockout period has passed
          await client.query(
            'UPDATE users SET failed_login_attempts = 0 WHERE id = $1',
            [user.id]
          );
        }
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        // Increment failed login attempts
        await client.query(
          `UPDATE users
           SET failed_login_attempts = failed_login_attempts + 1,
               last_failed_login = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [user.id]
        );
        await client.query('COMMIT');
        throw new AuthError('Invalid email or password');
      }

      // Reset failed login attempts on successful login
      await client.query(
        'UPDATE users SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate new tokens
      const { token, refreshToken } = await this.generateTokenPair(user);

      // Store refresh token
      await client.query(
        `INSERT INTO refresh_tokens (token, user_id, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [refreshToken, user.id]
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
        refreshToken
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof AuthError) {
        throw error;
      }
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  async logout(token: string, refreshToken: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Invalidate refresh token
      await client.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );

      // Add access token to blacklist with its remaining TTL
      const decoded = jwt.decode(token) as { exp?: number };
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await client.query(
            `INSERT INTO token_blacklist (token, expires_at)
             VALUES ($1, NOW() + INTERVAL '${ttl} seconds')`,
            [token]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  async verifyToken(token: string | null): Promise<any> {
    try {
      if (!token) {
        return null;
      }

      // Check if token is blacklisted
      const blacklistResult = await this.pool.query(
        'SELECT 1 FROM token_blacklist WHERE token = $1 AND expires_at > NOW()',
        [token]
      );

      if (blacklistResult.rows.length > 0) {
        throw new AuthError('Token has been revoked');
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token');
      }
      throw error;
    }
  }

  private async generateTokenPair(user: any) {
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        tokenType: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    return { token, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; tokenType: string };

      if (decoded.tokenType !== 'refresh') {
        throw new AuthError('Invalid refresh token');
      }

      // Check if refresh token exists and is valid
      const tokenResult = await client.query(
        'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
        [refreshToken]
      );

      if (tokenResult.rows.length === 0) {
        throw new AuthError('Invalid or expired refresh token');
      }

      // Get user data
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        throw new AuthError('User not found');
      }

      const user = userResult.rows[0];

      // Generate new token pair
      const { token: newToken, refreshToken: newRefreshToken } = await this.generateTokenPair(user);

      // Remove old refresh token
      await client.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );

      // Store new refresh token
      await client.query(
        `INSERT INTO refresh_tokens (token, user_id, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [newRefreshToken, user.id]
      );

      await client.query('COMMIT');

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Refresh token has expired');
      }
      if (error instanceof AuthError) {
        throw error;
      }
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  async cleanupExpiredTokens() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Clean up expired refresh tokens
      await client.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');

      // Clean up expired blacklisted tokens
      await client.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to cleanup expired tokens:', error);
    } finally {
      client.release();
    }
  }
}

// Error types for better error handling
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Input validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{};\'",./<>?\\|';
const MIN_LENGTH = 8;

export const validatePassword = (password: string): boolean => {
  const passwordRegex = new RegExp(
    `^(?=.*[a-z])` + // at least one lowercase
    `(?=.*[A-Z])` + // at least one uppercase
    `(?=.*\\d)` + // at least one digit
    `(?=.*[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}])` + // at least one special char
    `[A-Za-z\\d${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]{${MIN_LENGTH},}$`
  );
  return passwordRegex.test(password);
};
