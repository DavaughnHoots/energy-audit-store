import { Badge, UserBadge, UserLevel, LEVELS } from '../types/badges';
import { getBadgeById, BADGES } from '../data/badges';
import { badgeApiClient } from './badgeApiClient';

// Cache interface for badge data
interface BadgeCache {
  userBadges: {
    [userId: string]: {
      data: Record<string, UserBadge>;
      timestamp: number;
    }
  };
  userPoints: {
    [userId: string]: {
      data: UserLevel;
      timestamp: number;
    }
  };
  allBadges: {
    data: Badge[];
    timestamp: number;
  } | null;
  badgeById: {
    [badgeId: string]: {
      data: Badge;
      timestamp: number;
    }
  };
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Service for badge-related operations
 * This service connects to the backend API for badge operations
 * and provides caching and fallback mechanisms
 */
class BadgeService {
  private cache: BadgeCache = {
    userBadges: {},
    userPoints: {},
    allBadges: null,
    badgeById: {}
  };
  
  /**
   * Get all badge definitions
   */
  async getAllBadges(): Promise<Badge[]> {
    try {
      // Check cache first
      if (this.cache.allBadges && 
          Date.now() - this.cache.allBadges.timestamp < CACHE_EXPIRATION) {
        return this.cache.allBadges.data;
      }
      
      // Not in cache or expired, fetch from API
      const badges = await badgeApiClient.getAllBadges();
      
      // Update cache
      this.cache.allBadges = {
        data: badges,
        timestamp: Date.now()
      };
      
      return badges;
    } catch (error) {
      console.error('Error fetching badges:', error);
      // Fallback to local data if API fails
      return Object.values(BADGES);
    }
  }
  
  /**
   * Get a specific badge definition
   */
  async getBadge(badgeId: string): Promise<Badge | null> {
    try {
      // Check cache first
      if (this.cache.badgeById[badgeId] && 
          Date.now() - this.cache.badgeById[badgeId].timestamp < CACHE_EXPIRATION) {
        return this.cache.badgeById[badgeId].data;
      }
      
      // Not in cache or expired, fetch from API
      const badge = await badgeApiClient.getBadge(badgeId);
      
      // Update cache
      this.cache.badgeById[badgeId] = {
        data: badge,
        timestamp: Date.now()
      };
      
      return badge;
    } catch (error) {
      console.error(`Error fetching badge ${badgeId}:`, error);
      // Fallback to local data if API fails
      return getBadgeById(badgeId) || null;
    }
  }
  
  /**
   * Fetch all user badges from the API
   */
  async getUserBadges(userId: string): Promise<Record<string, UserBadge>> {
    try {
      // Check cache first
      if (this.cache.userBadges[userId] && 
          Date.now() - this.cache.userBadges[userId].timestamp < CACHE_EXPIRATION) {
        return this.cache.userBadges[userId].data;
      }
      
      // Not in cache or expired, fetch from API
      const badges = await badgeApiClient.getUserBadges(userId);
      
      // Update cache
      this.cache.userBadges[userId] = {
        data: badges,
        timestamp: Date.now()
      };
      
      return badges;
    } catch (error) {
      console.error(`Error fetching user badges for ${userId}:`, error);
      
      // Try to get from localStorage as fallback
      try {
        const storedBadges = localStorage.getItem(`user_badges_${userId}`);
        if (storedBadges) {
          return JSON.parse(storedBadges);
        }
      } catch (e) {
        // Ignore localStorage errors
      }
      
      // If all else fails, return empty object
      return {};
    }
  }
  
  /**
   * Update a single badge's progress
   * Note: In the real implementation, this would be automated by the backend
   * This is primarily for demo purposes and admin functions
   */
  async updateBadgeProgress(
    userId: string, 
    badgeId: string, 
    progress: number, 
    earned: boolean = false
  ): Promise<boolean> {
    try {
      // If direct admin update is needed, use the API endpoint
      if (this.isAdmin()) {
        const success = await badgeApiClient.updateBadgeProgress(userId, badgeId, progress);
        
        // Invalidate cache on successful update
        if (success) {
          this.invalidateUserCache(userId);
        }
        
        return success;
      }
      
      // For regular users, record activity instead of directly updating progress
      // The backend will handle badge evaluation
      const result = await badgeApiClient.recordActivity(userId, 'manual_progress_update', {
        badgeId,
        progress,
        earned
      });
      
      // Invalidate cache
      this.invalidateUserCache(userId);
      
      return result.badgeUpdates.length > 0;
    } catch (error) {
      console.error(`Error updating badge progress for user ${userId}, badge ${badgeId}:`, error);
      
      // For demo/offline fallback, update localStorage directly
      try {
        // Get current badges
        const badges = await this.getUserBadges(userId);
        
        // Update the specific badge
        badges[badgeId] = {
          ...badges[badgeId],
          badgeId,
          progress,
          earned,
          earnedDate: earned ? new Date() : undefined,
          visible: true
        };
        
        // Save in localStorage as fallback
        localStorage.setItem(`user_badges_${userId}`, JSON.stringify(badges));
        
        return true;
      } catch (e) {
        console.error('Error in fallback badge update:', e);
        return false;
      }
    }
  }
  
  /**
   * Get user points and level information
   */
  async getUserPoints(userId: string): Promise<UserLevel> {
    try {
      // Check cache first
      if (this.cache.userPoints[userId] && 
          Date.now() - this.cache.userPoints[userId].timestamp < CACHE_EXPIRATION) {
        return this.cache.userPoints[userId].data;
      }
      
      // Not in cache or expired, fetch from API
      const points = await badgeApiClient.getUserPoints(userId);
      
      // Update cache
      this.cache.userPoints[userId] = {
        data: points,
        timestamp: Date.now()
      };
      
      return points;
    } catch (error) {
      console.error(`Error fetching points for user ${userId}:`, error);
      
      // Fallback calculation based on locally stored badges if API fails
      try {
        const badges = await this.getUserBadges(userId);
        
        // Count earned badges to estimate points
        const earnedBadgeCount = Object.values(badges).filter(b => b.earned).length;
        const estimatedPoints = earnedBadgeCount * 25; // Rough estimate: 25 points per badge
        
        return this.calculateUserLevel(estimatedPoints);
      } catch (e) {
        // If even the fallback fails, return default
        return {
          level: 1,
          points: 0,
          nextLevelPoints: 100,
          title: 'Energy Novice'
        };
      }
    }
  }
  
  /**
   * Calculate a user's level based on points
   * Used for fallback when API is unavailable
   */
  private calculateUserLevel(points: number): UserLevel {
    // Default level in case the LEVELS array is empty
    const defaultLevel = {
      level: 1,
      threshold: 0,
      title: 'Energy Novice'
    };
    
    const defaultNextLevel = {
      level: 2,
      threshold: 100,
      title: 'Energy Apprentice'
    };
    
    // Make sure we have at least one level defined
    if (LEVELS.length === 0) {
      return {
        level: defaultLevel.level,
        points,
        nextLevelPoints: defaultNextLevel.threshold,
        title: defaultLevel.title
      };
    }
    
    // Find the highest level the user has reached
    let userLevel = LEVELS[0] || defaultLevel;
    let nextLevel = (LEVELS.length > 1 ? LEVELS[1] : LEVELS[0]) || defaultNextLevel;
    
    // Find the user's current level
    for (let i = 0; i < LEVELS.length; i++) {
      const currentLevel = LEVELS[i];
      if (currentLevel && points >= currentLevel.threshold) {
        userLevel = currentLevel;
        nextLevel = LEVELS[i + 1] || currentLevel; // If max level, use same level
      } else {
        break;
      }
    }
    
    return {
      level: userLevel.level,
      points,
      nextLevelPoints: nextLevel.threshold,
      title: userLevel.title || `Level ${userLevel.level}`
    };
  }
  
  /**
   * Record a user activity that might trigger badge evaluation
   */
  async recordActivity(
    userId: string,
    activityType: string,
    metadata: any
  ): Promise<{
    activity: any;
    badgeUpdates: any[];
  }> {
    try {
      const result = await badgeApiClient.recordActivity(userId, activityType, metadata);
      
      // Invalidate cache if badges were updated
      if (result.badgeUpdates && result.badgeUpdates.length > 0) {
        this.invalidateUserCache(userId);
      }
      
      return result;
    } catch (error) {
      console.error(`Error recording activity for user ${userId}:`, error);
      
      // Return empty result on error
      return {
        activity: null,
        badgeUpdates: []
      };
    }
  }
  
  /**
   * Get recent achievements (earned badges)
   */
  async getRecentAchievements(userId: string, limit: number = 3): Promise<Badge[]> {
    try {
      // Get user badges and all badge definitions
      const userBadges = await this.getUserBadges(userId);
      const allBadges = await this.getAllBadges();
      
      // Create a map for efficient badge lookup
      const badgeMap = allBadges.reduce((map, badge) => {
        map[badge.id] = badge;
        return map;
      }, {} as Record<string, Badge>);
      
      // Filter earned badges and sort by date
      const earnedBadges = Object.values(userBadges)
        .filter(badge => badge.earned && badge.earnedDate)
        .sort((a, b) => {
          const dateA = a.earnedDate ? new Date(a.earnedDate).getTime() : 0;
          const dateB = b.earnedDate ? new Date(b.earnedDate).getTime() : 0;
          return dateB - dateA; // Sort by most recent first
        });
      
      // Map to full badge details
      const recentBadges = earnedBadges
        .slice(0, limit)
        .map(userBadge => badgeMap[userBadge.badgeId])
        .filter(badge => !!badge); // Filter out undefined badges
      
      return recentBadges;
    } catch (error) {
      console.error(`Error getting recent achievements for user ${userId}:`, error);
      
      // Fallback to local implementation if API fails
      try {
        const badges = await this.getUserBadges(userId);
        
        // Filter earned badges and sort by date
        const earnedBadges = Object.values(badges)
          .filter(badge => badge.earned && badge.earnedDate)
          .sort((a, b) => {
            const dateA = a.earnedDate ? new Date(a.earnedDate).getTime() : 0;
            const dateB = b.earnedDate ? new Date(b.earnedDate).getTime() : 0;
            return dateB - dateA; // Sort by most recent first
          });
        
        // Get badge details for each earned badge
        const recentBadges = earnedBadges
          .slice(0, limit)
          .map(userBadge => getBadgeById(userBadge.badgeId))
          .filter((badge): badge is Badge => !!badge); // Filter out undefined badges
        
        return recentBadges;
      } catch (e) {
        return [];
      }
    }
  }
  
  /**
   * Check if the current user is an admin
   */
  private isAdmin(): boolean {
    // This would ideally check a real user role
    // For now, just return false - can be expanded later when we have proper role management
    return false;
  }
  
  /**
   * Invalidate the cache for a specific user
   */
  invalidateUserCache(userId: string): void {
    delete this.cache.userBadges[userId];
    delete this.cache.userPoints[userId];
  }
  
  /**
   * Invalidate the entire cache
   */
  invalidateCache(): void {
    this.cache = {
      userBadges: {},
      userPoints: {},
      allBadges: null,
      badgeById: {}
    };
  }
}

export const badgeService = new BadgeService();
