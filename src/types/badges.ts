/**
 * Types definitions for the gamification & badges system
 */

/**
 * Badge category types
 */
export type BadgeCategory = 'savings' | 'audits' | 'improvements' | 'education' | 'special';

/**
 * Badge tier levels
 */
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'special';

/**
 * Badge criteria types
 */
export type BadgeCriteriaType = 'savingsAmount' | 'auditCount' | 'implementedCount' | 'custom';

/**
 * Badge reward types
 */
export type BadgeRewardType = 'feature' | 'discount' | 'content' | 'recognition';

/**
 * Interface for badge criteria
 */
export interface BadgeCriteria {
  type: BadgeCriteriaType;
  threshold: number;
  customCheck?: (userData: any) => boolean;
}

/**
 * Interface for badge rewards
 */
export interface BadgeReward {
  description: string;
  type: BadgeRewardType;
  value?: string;
}

/**
 * Badge interface definition
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  criteria: BadgeCriteria;
  reward?: BadgeReward;
  visibility: 'private' | 'public';
}

/**
 * User badge status interface
 */
export interface UserBadge {
  badgeId: string;
  earned: boolean;
  progress: number; // 0-100
  earnedDate?: Date;
  visible: boolean;
}

/**
 * Collection of user badges
 */
export interface UserBadgeCollection {
  userId: string;
  badges: UserBadge[];
  lastUpdated: Date;
}

/**
 * Level constants structure
 */
export interface LevelThreshold {
  level: number;
  threshold: number;
  title?: string;
}

/**
 * User level data
 */
export interface UserLevel {
  level: number;
  points: number;
  nextLevelPoints: number;
  title: string;
}

/**
 * Points awarded for different activities
 */
export const POINTS = {
  SAVINGS_DOLLAR: 0.1,        // 0.1 points per dollar saved
  AUDIT_COMPLETED: 10,        // 10 points per audit
  RECOMMENDATION_IMPLEMENTED: 15, // 15 points per implemented change
  BADGE_EARNED: 25            // 25 points per badge earned
};

/**
 * Level definitions with thresholds
 */
export const LEVELS: LevelThreshold[] = [
  { level: 1, threshold: 0, title: 'Energy Novice' },      // Everyone starts here
  { level: 2, threshold: 100, title: 'Energy Apprentice' },   // 100 points
  { level: 3, threshold: 250, title: 'Energy Enthusiast' },   // 250 points
  { level: 4, threshold: 500, title: 'Energy Expert' },   // 500 points
  { level: 5, threshold: 1000, title: 'Energy Master' }   // 1000 points
];
