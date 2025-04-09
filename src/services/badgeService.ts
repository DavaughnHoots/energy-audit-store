import { Badge, UserBadge, UserLevel, LEVELS } from '../types/badges';
import { getBadgeById, BADGES } from '../data/badges';

/**
 * Service for badge-related operations
 * This is a placeholder implementation for frontend-first development
 * In the real application, this would make API calls to the backend
 */
class BadgeService {
  /**
   * Fetch all user badges from the server
   */
  async getUserBadges(userId: string): Promise<Record<string, UserBadge>> {
    // In a real implementation, this would be an API call
    // For now, return some placeholder data from localStorage
    
    try {
      const storedBadges = localStorage.getItem(`user_badges_${userId}`);
      
      if (storedBadges) {
        return JSON.parse(storedBadges);
      }
      
      // If no stored badges, return empty record
      return {};
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return {};
    }
  }
  
  /**
   * Save user badges to localStorage
   * In a real implementation, this would be an API call
   */
  async saveUserBadges(userId: string, badges: Record<string, UserBadge>): Promise<boolean> {
    try {
      localStorage.setItem(`user_badges_${userId}`, JSON.stringify(badges));
      return true;
    } catch (error) {
      console.error('Error saving user badges:', error);
      return false;
    }
  }
  
  /**
   * Update a single badge's progress
   */
  async updateBadgeProgress(
    userId: string, 
    badgeId: string, 
    progress: number, 
    earned: boolean = false
  ): Promise<boolean> {
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
      
      // Save updated badges
      await this.saveUserBadges(userId, badges);
      
      return true;
    } catch (error) {
      console.error('Error updating badge progress:', error);
      return false;
    }
  }
  
  /**
   * Calculate a user's level based on points
   */
  getUserLevel(points: number): UserLevel {
    // Default level in case the LEVELS array is empty
    const defaultLevel = {
      level: 1,
      threshold: 0,
      title: 'Level 1'
    };
    
    const defaultNextLevel = {
      level: 2,
      threshold: 100,
      title: 'Level 2'
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
   * Get recent achievements (earned badges)
   */
  async getRecentAchievements(userId: string, limit: number = 3): Promise<Badge[]> {
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
  }
}

export const badgeService = new BadgeService();
