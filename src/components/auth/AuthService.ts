import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { emailService } from './emailService';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || '';
const TOKEN_EXPIRY = '24h';

export class AuthService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async signup({ email, password, fullName, phone, address }: SignupData): Promise<AuthResult> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check for existing user
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new AuthError('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Insert user
      const result = await client.query(
        `INSERT INTO users (
          email, password_hash, full_name, phone, address,
          verification_token, verification_expires
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, full_name, created_at`,
        [email, hashedPassword, fullName, phone, address, verificationToken, tokenExpiry]
      );

      await client.query('COMMIT');

      // Send verification email
      await emailService.sendVerificationEmail(
        email,
        verificationToken,
        fullName
      );

      // Generate auth token
      const token = this.generateToken(result.rows[0]);

      return {
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          fullName: result.rows[0].full_name
        },
        token
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async signin({ email, password }: SigninData): Promise<AuthResult> {
    const result = await this.pool.query(
      `SELECT * FROM users 
       WHERE email = $1 AND verified = true`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AuthError('Invalid email or password');
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new AuthError('Invalid email or password');
    }

    // Update last login
    await this.pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      token
    };
  }

  async verifyEmail(token: string): Promise<void> {
    const result = await this.pool.query(
      `UPDATE users 
       SET verified = true,
           verification_token = NULL,
           verification_expires = NULL
       WHERE verification_token = $1
       AND verification_expires > CURRENT_TIMESTAMP
       RETURNING id`,
      [token]
    );

    if (result.rowCount === 0) {
      throw new AuthError('Invalid or expired verification token');
    }
  }

  async resetPasswordRequest(email: string): Promise<void> {
    const result = await this.pool.query(
      'SELECT id, full_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return; // Don't reveal if email exists
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.pool.query(
      `UPDATE users 
       SET reset_token = $1,
           reset_expires = $2
       WHERE email = $3`,
      [resetToken, tokenExpiry, email]
    );

    await emailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await this.pool.query(
      `UPDATE users 
       SET password_hash = $1,
           reset_token = NULL,
           reset_expires = NULL
       WHERE reset_token = $2
       AND reset_expires > CURRENT_TIMESTAMP
       RETURNING id`,
      [hashedPassword, token]
    );

    if (result.rowCount === 0) {
      throw new AuthError('Invalid or expired reset token');
    }
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    const result = await this.pool.query(
      `SELECT full_name, email, phone, address
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AuthError('User not found');
    }

    return result.rows[0];
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const allowedFields = ['full_name', 'phone', 'address'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(settings)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new AuthError('No valid fields to update');
    }

    values.push(userId);

    const result = await this.pool.query(
      `UPDATE users
       SET ${updates.join(', ')},
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING full_name, email, phone, address`,
      values
    );

    return result.rows[0];
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new AuthError('Invalid token');
    }
  }

  private generateToken(user: UserData): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
  }
}

// Types
interface SignupData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
}

interface SigninData {
  email: string;
  password: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  token: string;
}

interface UserSettings {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
}

// Error handling
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}