// backend/src/types/notification.ts

/**
 * Represents a user's notification preferences
 */
export interface NotificationPreferences {
    email: boolean;
    inApp: boolean;
    push: boolean;
    frequency: NotificationFrequency;
    categories: NotificationCategory[];
    quiet_hours?: {
      start: string; // 24-hour format, e.g., "22:00"
      end: string;   // 24-hour format, e.g., "07:00"
      timezone: string;
    };
  }
  
  /**
   * Represents a notification entity
   */
  export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    priority: NotificationPriority;
    status: NotificationStatus;
    createdAt: Date;
    scheduledFor?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    expiresAt?: Date;
    actions?: NotificationAction[];
  }
  
  /**
   * Notification delivery channel options
   */
  export type NotificationChannel = 'email' | 'inApp' | 'push';
  
  /**
   * Notification frequency settings
   */
  export type NotificationFrequency = 'instant' | 'daily' | 'weekly' | 'custom';
  
  /**
   * Priority levels for notifications
   */
  export type NotificationPriority = 'high' | 'medium' | 'low';
  
  /**
   * Status of a notification
   */
  export type NotificationStatus = 
    | 'pending'    // Not yet delivered
    | 'scheduled'  // Scheduled for future delivery
    | 'delivered'  // Successfully delivered
    | 'read'       // Read by the user
    | 'failed'     // Delivery failed
    | 'expired'    // Past expiration date
    | 'cancelled'; // Cancelled before delivery
  
  /**
   * Categories of notifications
   */
  export type NotificationCategory =
    | 'account'          // Account-related notifications
    | 'audit'            // Energy audit notifications
    | 'recommendation'   // Product/energy saving recommendations
    | 'product'          // Product-related updates
    | 'achievement'      // Gamification achievements
    | 'savings'          // Energy savings milestones
    | 'reminder'         // General reminders
    | 'system'          // System notifications
    | 'promotion'        // Marketing/promotional notifications
    | 'community';       // Community-related notifications
  
  /**
   * Specific types of notifications
   */
  export type NotificationType =
    // Account notifications
    | 'account_created'
    | 'email_verified'
    | 'password_changed'
    | 'profile_updated'
    
    // Audit notifications
    | 'audit_started'
    | 'audit_completed'
    | 'audit_reminder'
    | 'audit_review_needed'
    
    // Recommendation notifications
    | 'new_recommendation'
    | 'recommendation_reminder'
    | 'savings_opportunity'
    | 'product_price_alert'
    
    // Achievement notifications
    | 'achievement_unlocked'
    | 'level_up'
    | 'milestone_reached'
    | 'savings_milestone'
    
    // System notifications
    | 'system_maintenance'
    | 'feature_update'
    | 'privacy_update'
    | 'security_alert'
    
    // Community notifications
    | 'community_milestone'
    | 'community_challenge'
    | 'community_update';
  
  /**
   * Actions that can be attached to a notification
   */
  export interface NotificationAction {
    id: string;
    label: string;
    type: NotificationActionType;
    url?: string;
    payload?: Record<string, any>;
    completedAt?: Date;
  }
  
  /**
   * Types of actions available for notifications
   */
  export type NotificationActionType =
    | 'link'           // Navigate to a URL
    | 'button'         // Trigger an action
    | 'form'           // Open a form
    | 'dismiss'        // Dismiss the notification
    | 'acknowledge';   // Acknowledge receipt
  
  /**
   * Template context for notification rendering
   */
  export interface NotificationTemplate {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    emailSubject?: string;
    emailTemplate?: string;
    pushTemplate?: string;
    category: NotificationCategory;
    defaultPriority: NotificationPriority;
    defaultActions?: NotificationAction[];
    metadata?: {
      requiredFields: string[];
      optionalFields: string[];
      placeholders: Record<string, string>;
    };
  }
  
  /**
   * Batch notification settings
   */
  export interface NotificationBatch {
    id: string;
    type: NotificationType;
    recipients: string[];  // User IDs
    template: NotificationTemplate;
    data: Record<string, any>;
    scheduledFor?: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    error?: string;
    metadata?: Record<string, any>;
  }
  
  /**
   * Notification delivery result
   */
  export interface NotificationDeliveryResult {
    success: boolean;
    channel: NotificationChannel;
    timestamp: Date;
    error?: string;
    metadata?: Record<string, any>;
  }
  
  /**
   * Notification analytics data
   */
  export interface NotificationAnalytics {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    deliveryRate: number;
    readRate: number;
    averageReadTime: number;
    actionCompletionRate: number;
    byChannel: Record<NotificationChannel, number>;
    byType: Record<NotificationType, number>;
    byCategory: Record<NotificationCategory, number>;
  }
  
  /**
   * Error types for notification-related operations
   */
  export class NotificationError extends Error {
    constructor(
      message: string,
      public code: string,
      public details?: Record<string, any>
    ) {
      super(message);
      this.name = 'NotificationError';
    }
  }
  
  export class NotificationValidationError extends NotificationError {
    constructor(message: string, details?: Record<string, any>) {
      super(message, 'VALIDATION_ERROR', details);
      this.name = 'NotificationValidationError';
    }
  }
  
  export class NotificationDeliveryError extends NotificationError {
    constructor(message: string, details?: Record<string, any>) {
      super(message, 'DELIVERY_ERROR', details);
      this.name = 'NotificationDeliveryError';
    }
  }