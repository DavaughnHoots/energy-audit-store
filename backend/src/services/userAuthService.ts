// src/services/userAuthService.ts

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export class UserAuthService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async registerUser(email: string, password: string, fullName: string, phone?: string, address?: string) {
    try {
      // Check if user already exists
      const existingUser = await this.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert new user with default role
      const result = await this.pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, phone, address, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, full_name, role, created_at`,
        [uuidv4(), email, passwordHash, fullName, phone, address, 'user']
      );

      // Generate JWT token
      const token = this.generateToken(result.rows[0]);

      return {
        user: result.rows[0],
        token
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Registration failed: ${error.message}`);
      }
      throw new Error('Registration failed');
    }
  }

  async loginUser(email: string, password: string) {
    try {
      console.log('Attempting to find user:', email);
      // Get user by email
      const result = await this.pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];
      console.log('User found:', user ? 'yes' : 'no');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      console.log('Verifying password...');
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log('Password valid:', isValid);

      if (!isValid) {
        throw new Error('Invalid password');
      }

      // Update last login
      await this.pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate token
      const token = this.generateToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        },
        token
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Login failed: ${error.message}`);
      }
      throw new Error('Login failed');
    }
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async updateUserProfile(userId: string, updates: {
    fullName?: string;
    phone?: string;
    address?: string;
  }) {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.fullName) {
        setClause.push(`full_name = $${paramCount}`);
        values.push(updates.fullName);
        paramCount++;
      }

      if (updates.phone) {
        setClause.push(`phone = $${paramCount}`);
        values.push(updates.phone);
        paramCount++;
      }

      if (updates.address) {
        setClause.push(`address = $${paramCount}`);
        values.push(updates.address);
        paramCount++;
      }

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      values.push(userId);

      const query = `
        UPDATE users
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING id, email, full_name, phone, address, role, updated_at
      `;

      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Profile update failed: ${error.message}`);
      }
      throw new Error('Profile update failed');
    }
  }

  private generateToken(user: any) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};
