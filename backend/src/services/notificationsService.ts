// backend/src/services/notificationService.ts

import { Pool } from 'pg';
import { emailService } from './emailService';

interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  push: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  categories: string[];
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  readAt?: Date;
  deliveredAt?: Date;
}

export class NotificationService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create and send a new notification
   */
  async sendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get user preferences
      const prefsResult = await client.query(
        'SELECT notification_preferences FROM users WHERE id = $1',
        [userId]
      );
      
      const preferences: NotificationPreferences = prefsResult.rows[0]?.notification_preferences || {
        email: true,
        inApp: true,
        push: false,
        frequency: 'instant',
        categories: ['all']
      };

      // Create notification record
      const result = await client.query(
        `INSERT INTO notifications (
          user_id, type, title, message, metadata, priority, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id`,
        [userId, type, title, message, metadata, priority]
      );

      const notificationId = result.rows[0].id;

      // Handle delivery based on preferences
      if (preferences.inApp) {
        await this.deliverInAppNotification(notificationId, userId);
      }

      if (preferences.email && this.shouldSendEmail(type, preferences)) {
        await this.deliverEmailNotification(
          userId,
          title,
          message,
          type,
          metadata
        );
      }

      if (preferences.push) {
        await this.deliverPushNotification(
          userId,
          title,
          message,
          type,
          metadata
        );
      }

      await client.query('COMMIT');
      return notificationId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; total: number }> {
    const offset = (page - 1) * limit;

    const [notifications, count] = await Promise.all([
      this.pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      this.pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
        [userId]
      )
    ]);

    return {
      notifications: notifications.rows,
      total: parseInt(count.rows[0].count)
    };
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[], userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE notifications
       SET read_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) AND user_id = $2`,
      [notificationIds, userId]
    );
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const result = await this.pool.query(
      `UPDATE users
       SET notification_preferences = notification_preferences || $1
       WHERE id = $2
       RETURNING notification_preferences`,
      [preferences, userId]
    );

    return result.rows[0].notification_preferences;
  }

  /**
   * Send batch notifications (e.g., weekly digests)
   */
  async sendBatchNotifications(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get users with pending digest notifications
      const users = await client.query(
        `SELECT id, email, notification_preferences
         FROM users
         WHERE notification_preferences->>'frequency' = 'weekly'
         AND EXTRACT(DOW FROM CURRENT_TIMESTAMP) = 0`  // Send on Sundays
      );

      for (const user of users.rows) {
        const pendingNotifications = await client.query(
          `SELECT * FROM notifications
           WHERE user_id = $1
           AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
           AND delivered_at IS NULL`,
          [user.id]
        );

        if (pendingNotifications.rows.length > 0) {
          await this.sendDigestEmail(
            user.id,
            user.email,
            pendingNotifications.rows
          );

          // Mark notifications as delivered
          await client.query(
            `UPDATE notifications
             SET delivered_at = CURRENT_TIMESTAMP
             WHERE id = ANY($1)`,
            [pendingNotifications.rows.map(n => n.id)]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysToKeep: number = 90): Promise<void> {
    await this.pool.query(
      `DELETE FROM notifications
       WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysToKeep} days'`
    );
  }

  // Private helper methods

  private async deliverInAppNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE notifications
       SET delivered_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [notificationId]
    );
  }

  private async deliverEmailNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const userResult = await this.pool.query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const { email, full_name } = userResult.rows[0];

    switch (type) {
      case 'audit_complete':
        await emailService.sendAuditCompleteEmail(
          email,
          metadata?.auditId,
          metadata?.recommendations
        );
        break;
      case 'recommendation':
        // TODO: Implement recommendation email template
        break;
      default:
        // Send generic notification email
        await emailService.sendEmail({
          to: email,
          template: 'notification',
          data: {
            name: full_name,
            title,
            message,
            type
          }
        });
    }
  }

  private async deliverPushNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // TODO: Implement push notification delivery
    // This would integrate with a service like Firebase Cloud Messaging
    console.log('Push notification delivery not implemented yet');
  }

  private async sendDigestEmail(
    userId: string,
    email: string,
    notifications: Notification[]
  ): Promise<void> {
    await emailService.sendEmail({
      to: email,
      template: 'weekly-digest',
      data: {
        notifications,
        summary: this.generateDigestSummary(notifications)
      }
    });
  }

  private generateDigestSummary(notifications: Notification[]): any {
    // Group notifications by type and generate summary stats
    const summary = {
      total: notifications.length,
      byType: {} as Record<string, number>,
      highPriority: notifications.filter(n => n.priority === 'high').length
    };

    notifications.forEach(notification => {
      summary.byType[notification.type] = (summary.byType[notification.type] || 0) + 1;
    });

    return summary;
  }

  private shouldSendEmail(type: string, preferences: NotificationPreferences): boolean {
    if (!preferences.categories.includes('all') &&
        !preferences.categories.includes(type)) {
      return false;
    }

    return preferences.frequency === 'instant' ||
           (preferences.frequency === 'daily' && type === 'high_priority') ||
           preferences.frequency === 'weekly';
  }
}

// Error handling
export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationError';
  }
}