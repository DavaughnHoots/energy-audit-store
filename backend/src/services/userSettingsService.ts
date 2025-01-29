import { pool } from '../config/database';
import { appLogger } from '../config/logger';
import { z } from 'zod';

// Validation schemas
export const propertySettingsSchema = z.object({
  propertyType: z.enum([
    'single-family',
    'townhouse',
    'duplex',
    'mobile'
  ]),
  constructionPeriod: z.enum([
    'before-1940',
    '1940-1959',
    '1960-1979',
    '1980-1999',
    '2000-2019',
    '2020-newer'
  ]),
  stories: z.number().int().min(1).max(10),
  squareFootage: z.number().min(100).max(50000),
  ceilingHeight: z.number().optional(),
  foundation: z.enum(['basement', 'crawlspace', 'slab']).optional(),
  atticType: z.enum(['full', 'partial', 'none']).optional()
});

// TypeScript types derived from Zod schemas
export type PropertySettings = z.infer<typeof propertySettingsSchema>;

export interface UserSettings {
  userId: string;
  theme?: string;
  emailNotifications?: boolean;
  notificationPreferences?: Record<string, any>;
  propertyDetails?: PropertySettings;
}

// Custom error classes
export class UserSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserSettingsError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UserSettingsService {
  /**
   * Get user settings by user ID
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const result = await pool.query(
        `SELECT 
          user_id,
          theme,
          email_notifications,
          notification_preferences,
          property_details
        FROM user_settings 
        WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const settings = result.rows[0];
      return {
        userId: settings.user_id,
        theme: settings.theme,
        emailNotifications: settings.email_notifications,
        notificationPreferences: settings.notification_preferences,
        propertyDetails: settings.property_details
      };
    } catch (error) {
      appLogger.error('Error fetching user settings:', { error, userId });
      throw new UserSettingsError('Failed to fetch user settings');
    }
  }

  /**
   * Update property settings for a user
   */
  async updatePropertySettings(userId: string, propertyDetails: PropertySettings): Promise<void> {
    const client = await pool.connect();
    try {
      // Validate property details
      propertySettingsSchema.parse(propertyDetails);

      await client.query('BEGIN');

      // Get current settings for comparison
      const currentSettings = await client.query(
        'SELECT property_details FROM user_settings WHERE user_id = $1',
        [userId]
      );

      // Update or insert property details
      await client.query(
        `INSERT INTO user_settings (
          user_id,
          property_details,
          updated_at
        )
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
          property_details = $2,
          updated_at = CURRENT_TIMESTAMP`,
        [userId, propertyDetails]
      );

      // Log the update
      await client.query(
        `INSERT INTO user_activity_log (
          user_id,
          activity_type,
          details,
          created_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [
          userId,
          'property_settings_update',
          {
            previous: currentSettings.rows[0]?.property_details,
            new: propertyDetails
          }
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.message);
      }
      appLogger.error('Error updating property settings:', { error, userId });
      throw new UserSettingsError('Failed to update property settings');
    } finally {
      client.release();
    }
  }

  /**
   * Delete property settings for a user
   */
  async deletePropertySettings(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current settings for logging
      const currentSettings = await client.query(
        'SELECT property_details FROM user_settings WHERE user_id = $1',
        [userId]
      );

      // Remove property details
      await client.query(
        `UPDATE user_settings 
         SET property_details = NULL,
             updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1`,
        [userId]
      );

      // Log the deletion
      await client.query(
        `INSERT INTO user_activity_log (
          user_id,
          activity_type,
          details,
          created_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [
          userId,
          'property_settings_delete',
          { deleted: currentSettings.rows[0]?.property_details }
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error('Error deleting property settings:', { error, userId });
      throw new UserSettingsError('Failed to delete property settings');
    } finally {
      client.release();
    }
  }

  /**
   * Update user theme preference
   */
  async updateTheme(userId: string, theme: string): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO user_settings (
          user_id,
          theme,
          updated_at
        )
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
          theme = $2,
          updated_at = CURRENT_TIMESTAMP`,
        [userId, theme]
      );
    } catch (error) {
      appLogger.error('Error updating theme:', { error, userId });
      throw new UserSettingsError('Failed to update theme');
    }
  }

  /**
   * Update email notification preferences
   */
  async updateEmailNotifications(
    userId: string,
    emailNotifications: boolean,
    preferences?: Record<string, any>
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO user_settings (
          user_id,
          email_notifications,
          notification_preferences,
          updated_at
        )
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
          email_notifications = $2,
          notification_preferences = COALESCE($3, user_settings.notification_preferences),
          updated_at = CURRENT_TIMESTAMP`,
        [userId, emailNotifications, preferences]
      );
    } catch (error) {
      appLogger.error('Error updating email notifications:', { error, userId });
      throw new UserSettingsError('Failed to update email notifications');
    }
  }
}

// Export singleton instance
export const userSettingsService = new UserSettingsService();
