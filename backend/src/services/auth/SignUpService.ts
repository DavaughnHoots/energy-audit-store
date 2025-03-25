// backend/src/services/auth/SignUpService.ts

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { emailService } from '../emailService.js';

const SALT_ROUNDS = 12;
const VERIFICATION_EXPIRY = '24h';

export class SignUpService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async signUp(userData: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    address?: string;
  }) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Check for existing user
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new SignUpError('Email already registered');
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24);

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

      // Insert user
      const result = await client.query(
        `INSERT INTO users (
          email, password_hash, full_name, phone, address,
          verification_token, verification_expires
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, full_name`,
        [
          userData.email.toLowerCase(),
          passwordHash,
          userData.fullName,
          userData.phone || null,
          userData.address || null,
          verificationToken,
          verificationExpiry
        ]
      );

      // Send verification email
      await emailService.sendVerificationEmail({
        to: userData.email,
        token: verificationToken,
        name: userData.fullName
      });

      await client.query('COMMIT');

      return {
        userId: result.rows[0].id,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        verificationToken
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyEmail(token: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE users 
         SET email_verified = true,
             verification_token = NULL,
             verification_expires = NULL,
             updated_at = NOW()
         WHERE verification_token = $1
         AND verification_expires > NOW()
         RETURNING id, email`,
        [token]
      );

      if (result.rows.length === 0) {
        throw new SignUpError('Invalid or expired verification token');
      }

      await client.query('COMMIT');

      return {
        userId: result.rows[0].id,
        email: result.rows[0].email
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async resendVerification(email: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'SELECT id, full_name, email_verified FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        throw new SignUpError('User not found');
      }

      if (userResult.rows[0].email_verified) {
        throw new SignUpError('Email already verified');
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24);

      await client.query(
        `UPDATE users 
         SET verification_token = $1,
             verification_expires = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [verificationToken, verificationExpiry, userResult.rows[0].id]
      );

      await emailService.sendVerificationEmail({
        to: email,
        token: verificationToken,
        name: userResult.rows[0].full_name
      });

      await client.query('COMMIT');

      return {
        userId: userResult.rows[0].id,
        email: email,
        verificationToken
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export class SignUpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignUpError';
  }
}