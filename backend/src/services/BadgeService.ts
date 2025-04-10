/**
 * Badge service for handling badge-related operations
 */

import { appLogger } from '../config/logger.js';
import { pool } from '../config/database.js';
import { POINTS } from '../data/badges.js';

// Types for badge operations
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  criteria: {
    type: string;
    threshold: number;
  };
  reward?: {
    description: string;
    type: string;
    value?: string;
  };
  visibility: string;
}

export interface UserBadge {
  badgeId: string;
  progress: number;
  earned: boolean;
  earnedAt?: Date;
  visible: boolean;
}

export interface UserPoints {
  totalPoints: number;
  currentLevel: number;
  nextLevelThreshold: number;
  currentTitle: string;
}

export class BadgeService {
  // Badge definition data - imported from frontend for now
  // In a production environment, this would probably be stored in the database
  private badgeDefinitions: BadgeDefinition[] = [];
  
  constructor() {
    // Load badge definitions from frontend data
    import('../data/badges.js').then(badgeModule => {
      this.badgeDefinitions = badgeModule.BADGES;
      appLogger.info('Badge definitions loaded', { count: this.badgeDefinitions.length });
    }).catch(error => {
      appLogger.error('Failed to load badge definitions', { error });
      // Load an empty array as fallback
      this.badgeDefinitions = [];
    });
  }
  
  /**
   * Get all badge definitions
   */
  async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    return this.badgeDefinitions;
  }
  
  /**
   * Get a specific badge definition by ID
   */
  async getBadgeDefinition(badgeId: string): Promise<BadgeDefinition | undefined> {
    return this.badgeDefinitions.find(badge => badge.id === badgeId);
  }
  
  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string): Promise<Record<string, UserBadge>> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT badge_id, progress, earned, earned_at, visible
        FROM user_badges
        WHERE user_id = $1
      `, [userId]);
      
      // Convert to a record object for easier frontend consumption
      const badges: Record<string, UserBadge> = {};
      result.rows.forEach(row => {
        badges[row.badge_id] = {
          badgeId: row.badge_id,
          progress: row.progress,
          earned: row.earned,
          earnedAt: row.earned_at,
          visible: row.visible
        };
      });
      
      return badges;
    } catch (error) {
      appLogger.error('Error fetching user badges', { error, userId });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get user points and level data
   */
  async getUserPoints(userId: string): Promise<UserPoints> {
    const client = await pool.connect();
    try {
      // Get user points from database
      const result = await client.query(`
        SELECT total_points, current_level
        FROM user_points
        WHERE user_id = $1
      `, [userId]);
      
      // If user doesn't have points record yet, create one
      if (result.rows.length === 0) {
        await this.initializeUserPoints(userId);
        return {
          totalPoints: 0,
          currentLevel: 1,
          nextLevelThreshold: 100,
          currentTitle: 'Energy Novice'
        };
      }
      
      // Get level information from frontend data
      const { LEVELS } = await import('../data/badges.js');
      const userLevel = result.rows[0].current_level;
      const totalPoints = result.rows[0].total_points;
      
      // Find the current level and next level threshold
      const currentLevelData = LEVELS.find(level => level.level === userLevel) || { 
        level: 1, 
        threshold: 0, 
        title: 'Energy Novice' 
      };
      
      // Find the next level threshold
      const nextLevelData = LEVELS.find(level => level.level === userLevel + 1) || { 
        level: userLevel + 1, 
        threshold: totalPoints + 100,
        title: `Level ${userLevel + 1}`
      };
      
      return {
        totalPoints,
        currentLevel: userLevel,
        nextLevelThreshold: nextLevelData.threshold,
        currentTitle: currentLevelData.title || `Level ${userLevel}`
      };
    } catch (error) {
      appLogger.error('Error fetching user points', { error, userId });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Initialize user points record if it doesn't exist
   */
  private async initializeUserPoints(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO user_points (user_id, total_points, current_level)
        VALUES ($1, 0, 1)
        ON CONFLICT (user_id) DO NOTHING
      `, [userId]);
    } catch (error) {
      appLogger.error('Error initializing user points', { error, userId });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Update badge progress for a user
   */
  async updateBadgeProgress(
    userId: string, 
    badgeId: string, 
    progress: number
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      // Check if this badge exists
      const badgeDefinition = await this.getBadgeDefinition(badgeId);
      if (!badgeDefinition) {
        return false;
      }
      
      // Determine if the badge is earned
      const earned = progress >= 100;
      const earnedAt = earned ? new Date() : null;
      
      // Start transaction
      await client.query('BEGIN');
      
      // Check if the user already has this badge
      const existingBadge = await client.query(`
        SELECT id, earned, progress
        FROM user_badges
        WHERE user_id = $1 AND badge_id = $2
      `, [userId, badgeId]);
      
      // Variables to track state
      let wasNewlyEarned = false;
      let pointsAwarded = 0;
      
      if (existingBadge.rows.length === 0) {
        // Insert new badge record
        await client.query(`
          INSERT INTO user_badges 
          (user_id, badge_id, progress, earned, earned_at, visible)
          VALUES ($1, $2, $3, $4, $5, true)
        `, [userId, badgeId, progress, earned, earnedAt]);
        
        // If badge was earned on first update, count as newly earned
        wasNewlyEarned = earned;
      } else {
        // Update existing badge
        const wasPreviouslyEarned = existingBadge.rows[0].earned;
        
        // Only update if new progress is higher
        if (progress > existingBadge.rows[0].progress) {
          await client.query(`
            UPDATE user_badges
            SET progress = $3, 
                earned = $4,
                earned_at = CASE WHEN $4 = true AND earned = false THEN CURRENT_TIMESTAMP ELSE earned_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND badge_id = $2
          `, [userId, badgeId, progress, earned]);
        }
        
        // Track if badge was newly earned
        wasNewlyEarned = earned && !wasPreviouslyEarned;
      }
      
      // If badge was newly earned, award points and create event
      if (wasNewlyEarned) {
        pointsAwarded = POINTS.BADGE_EARNED || 25;
        
        // Record badge award event
        await client.query(`
          INSERT INTO badge_award_events
          (user_id, badge_id, points_awarded)
          VALUES ($1, $2, $3)
        `, [userId, badgeId, pointsAwarded]);
        
        // Update user's total points
        await client.query(`
          INSERT INTO user_points (user_id, total_points, current_level)
          VALUES ($1, $2, 1)
          ON CONFLICT (user_id)
          DO UPDATE SET
            total_points = user_points.total_points + $2,
            updated_at = CURRENT_TIMESTAMP
        `, [userId, pointsAwarded]);
        
        // Check if user leveled up
        await this.checkAndUpdateUserLevel(client, userId);
      }
      
      await client.query('COMMIT');
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error('Error updating badge progress', { error, userId, badgeId });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Check and update user level based on points
   */
  private async checkAndUpdateUserLevel(client: any, userId: string): Promise<void> {
    try {
      // Get user's current points
      const pointsResult = await client.query(`
        SELECT total_points, current_level
        FROM user_points
        WHERE user_id = $1
      `, [userId]);
      
      if (pointsResult.rows.length === 0) {
        return;
      }
      
      const totalPoints = pointsResult.rows[0].total_points;
      const currentLevel = pointsResult.rows[0].current_level;
      
      // Get level thresholds from frontend data
      const { LEVELS } = await import('../data/badges.js');
      
      // Find the highest level the user qualifies for
      let newLevel = currentLevel;
      for (const level of LEVELS) {
        if (totalPoints >= level.threshold && level.level > newLevel) {
          newLevel = level.level;
        }
      }
      
      // If user leveled up, update their level
      if (newLevel > currentLevel) {
        await client.query(`
          UPDATE user_points
          SET current_level = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
        `, [userId, newLevel]);
        
        appLogger.info('User leveled up', { userId, prevLevel: currentLevel, newLevel });
      }
    } catch (error) {
      appLogger.error('Error checking user level', { error, userId });
      throw error;
    }
  }
  
  /**
   * Record a user activity that might trigger badge evaluation
   */
  async recordActivity(
    userId: string, 
    activityType: string, 
    metadata: Record<string, any>
  ): Promise<any> {
    const client = await pool.connect();
    try {
      // Insert activity record
      const result = await client.query(`
        INSERT INTO user_activities
        (user_id, activity_type, metadata)
        VALUES ($1, $2, $3)
        RETURNING id, activity_type, created_at
      `, [userId, activityType, JSON.stringify(metadata)]);
      
      return result.rows[0];
    } catch (error) {
      appLogger.error('Error recording user activity', { error, userId, activityType });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Evaluate badges relevant to a specific activity type
   */
  async evaluateRelevantBadges(userId: string, activityType: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      const results = [];
      
      // Map activity types to criteria types
      const criteriaTypeMap: Record<string, string> = {
        'audit_completed': 'auditCount',
        'recommendation_implemented': 'implementedCount',
        'savings_updated': 'savingsAmount'
      };
      
      const criteriaType = criteriaTypeMap[activityType] || activityType;
      
      // Get badges with matching criteria type
      const relevantBadges = this.badgeDefinitions.filter(
        badge => badge.criteria.type === criteriaType
      );
      
      // Evaluate each relevant badge
      for (const badge of relevantBadges) {
        let progress = 0;
        
        switch (criteriaType) {
          case 'auditCount':
            progress = await this.calculateAuditCountProgress(client, userId, badge.criteria.threshold);
            break;
          case 'implementedCount':
            progress = await this.calculateImplementedCountProgress(client, userId, badge.criteria.threshold);
            break;
          case 'savingsAmount':
            progress = await this.calculateSavingsProgress(client, userId, badge.criteria.threshold);
            break;
          default:
            progress = 0;
        }
        
        // Update badge progress
        if (progress > 0) {
          const updateResult = await this.updateBadgeProgress(userId, badge.id, progress);
          results.push({
            badgeId: badge.id,
            progress,
            updated: updateResult
          });
        }
      }
      
      return results;
    } catch (error) {
      appLogger.error('Error evaluating badges', { error, userId, activityType });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Calculate progress percentage for audit count criteria
   */
  private async calculateAuditCountProgress(
    client: any, 
    userId: string, 
    threshold: number
  ): Promise<number> {
    try {
      // Count completed audits
      const result = await client.query(`
        SELECT COUNT(*) as audit_count
        FROM energy_audits
        WHERE user_id = $1 AND status = 'completed'
      `, [userId]);
      
      const auditCount = parseInt(result.rows[0].audit_count) || 0;
      
      // Calculate progress percentage
      const progress = Math.min(Math.floor((auditCount / threshold) * 100), 100);
      return progress;
    } catch (error) {
      appLogger.error('Error calculating audit count progress', { error, userId });
      return 0;
    }
  }
  
  /**
   * Calculate progress percentage for implemented recommendations
   */
  private async calculateImplementedCountProgress(
    client: any, 
    userId: string, 
    threshold: number
  ): Promise<number> {
    try {
      // Count implemented recommendations
      const result = await client.query(`
        SELECT COUNT(*) as implemented_count
        FROM audit_recommendations ar
        JOIN energy_audits ea ON ar.audit_id = ea.id
        WHERE ea.user_id = $1 AND ar.implementation_status = 'implemented'
      `, [userId]);
      
      const implementedCount = parseInt(result.rows[0].implemented_count) || 0;
      
      // Calculate progress percentage
      const progress = Math.min(Math.floor((implementedCount / threshold) * 100), 100);
      return progress;
    } catch (error) {
      appLogger.error('Error calculating implemented count progress', { error, userId });
      return 0;
    }
  }
  
  /**
   * Calculate progress percentage for savings amount
   */
  private async calculateSavingsProgress(
    client: any, 
    userId: string, 
    threshold: number
  ): Promise<number> {
    try {
      // Sum actual savings from implemented recommendations
      const result = await client.query(`
        SELECT SUM(actual_savings) as total_savings
        FROM audit_recommendations ar
        JOIN energy_audits ea ON ar.audit_id = ea.id
        WHERE ea.user_id = $1 AND ar.actual_savings IS NOT NULL
      `, [userId]);
      
      const totalSavings = parseFloat(result.rows[0].total_savings) || 0;
      
      // Calculate progress percentage
      const progress = Math.min(Math.floor((totalSavings / threshold) * 100), 100);
      return progress;
    } catch (error) {
      appLogger.error('Error calculating savings progress', { error, userId });
      return 0;
    }
  }
  
  /**
   * Evaluate all badges for a user
   * This is typically used for manual evaluation or testing
   */
  async evaluateAllBadges(userId: string): Promise<any[]> {
    const results = [];
    const criteriaTypes = ['auditCount', 'implementedCount', 'savingsAmount'];
    
    for (const criteriaType of criteriaTypes) {
      // Map criteria types to activity types
      const activityType = {
        'auditCount': 'audit_completed',
        'implementedCount': 'recommendation_implemented',
        'savingsAmount': 'savings_updated'
      }[criteriaType] || criteriaType;
      
      // Evaluate badges for this activity type
      const typeResults = await this.evaluateRelevantBadges(userId, activityType);
      results.push(...typeResults);
    }
    
    return results;
  }
}
