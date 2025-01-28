// backend/src/services/userService.ts

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { AuthError } from './auth/AuthService';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  energyProfile?: EnergyProfile;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface EnergyProfile {
  utilityProvider: string;
  averageMonthlyBill: number;
  homeSize: number;
  homeType: string;
  climateZone: string;
}

interface UserPreferences {
  emailNotifications: boolean;
  theme: 'light' | 'dark';
  currency: string;
  unitSystem: 'imperial' | 'metric';
}

export class UserService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const result = await this.pool.query(
      `SELECT 
        u.id, u.email, u.full_name, u.phone, u.address,
        u.created_at, u.updated_at,
        e.utility_provider, e.average_monthly_bill,
        e.home_size, e.home_type, e.climate_zone,
        p.email_notifications, p.theme, p.currency, p.unit_system
       FROM users u
       LEFT JOIN energy_profiles e ON u.id = e.user_id
       LEFT JOIN user_preferences p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return this.mapRowToUserProfile(result.rows[0]);
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      if (updates.fullName || updates.phone || updates.address) {
        await client.query(
          `UPDATE users 
           SET full_name = COALESCE($1, full_name),
               phone = COALESCE($2, phone),
               address = COALESCE($3, address),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [updates.fullName, updates.phone, updates.address, userId]
        );
      }

      if (updates.energyProfile) {
        await client.query(
          `INSERT INTO energy_profiles (
            user_id, utility_provider, average_monthly_bill,
            home_size, home_type, climate_zone
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id) DO UPDATE SET
            utility_provider = EXCLUDED.utility_provider,
            average_monthly_bill = EXCLUDED.average_monthly_bill,
            home_size = EXCLUDED.home_size,
            home_type = EXCLUDED.home_type,
            climate_zone = EXCLUDED.climate_zone`,
          [
            userId,
            updates.energyProfile.utilityProvider,
            updates.energyProfile.averageMonthlyBill,
            updates.energyProfile.homeSize,
            updates.energyProfile.homeType,
            updates.energyProfile.climateZone
          ]
        );
      }

      if (updates.preferences) {
        await client.query(
          `INSERT INTO user_preferences (
            user_id, email_notifications, theme, currency, unit_system
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id) DO UPDATE SET
            email_notifications = EXCLUDED.email_notifications,
            theme = EXCLUDED.theme,
            currency = EXCLUDED.currency,
            unit_system = EXCLUDED.unit_system`,
          [
            userId,
            updates.preferences.emailNotifications,
            updates.preferences.theme,
            updates.preferences.currency,
            updates.preferences.unitSystem
          ]
        );
      }

      await client.query('COMMIT');
      return await this.getUserProfile(userId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const result = await this.pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AuthError('User not found');
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!validPassword) {
      throw new AuthError('Invalid current password');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await this.pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );
  }

  async trackEnergyUsage(userId: string, usage: {
    month: string;
    consumption: number;
    cost: number;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO energy_usage (
        user_id, month, consumption, cost, created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [userId, usage.month, usage.consumption, usage.cost]
    );
  }

  async getEnergyUsageHistory(userId: string, months: number = 12) {
    const result = await this.pool.query(
      `SELECT month, consumption, cost
       FROM energy_usage
       WHERE user_id = $1
       ORDER BY month DESC
       LIMIT $2`,
      [userId, months]
    );
    return result.rows;
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const result = await this.pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AuthError('User not found');
    }

    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!validPassword) {
      throw new AuthError('Invalid password');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Delete related data first
      await client.query('DELETE FROM energy_profiles WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM energy_usage WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM energy_audits WHERE user_id = $1', [userId]);
      
      // Finally delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private mapRowToUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      address: row.address,
      energyProfile: row.utility_provider ? {
        utilityProvider: row.utility_provider,
        averageMonthlyBill: row.average_monthly_bill,
        homeSize: row.home_size,
        homeType: row.home_type,
        climateZone: row.climate_zone
      } : undefined,
      preferences: {
        emailNotifications: row.email_notifications,
        theme: row.theme || 'light',
        currency: row.currency || 'USD',
        unitSystem: row.unit_system || 'imperial'
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}