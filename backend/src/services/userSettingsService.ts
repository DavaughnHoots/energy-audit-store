// src/services/userSettingsService.ts

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

export class UserSettingsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getUserSettings(userId: string) {
    try {
      const result = await this.pool.query(
        `SELECT u.full_name, u.phone, u.address, s.email_notifications, s.theme
         FROM users u
         LEFT JOIN user_settings s ON u.id = s.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch user settings: ${error.message}`);
      }
      throw new Error('Failed to fetch user settings');
    }
  }

  async updateUserSettings(userId: string, updates: {
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
        throw new Error(`Settings update failed: ${error.message}`);
      }
      throw new Error('Settings update failed');
    }
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return bcrypt.compare(password, result.rows[0].password_hash);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Password verification failed: ${error.message}`);
      }
      throw new Error('Password verification failed');
    }
  }
}
