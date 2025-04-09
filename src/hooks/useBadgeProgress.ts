import { useEffect, useState } from 'react';
import { BADGES } from '../data/badges';
import { Badge, UserBadge, POINTS } from '../types/badges';

/**
 * Custom hook to calculate badge progress based on user stats
 * This is a placeholder implementation for frontend-first development
 * In the real application, this would query the backend API
 */
export function useBadgeProgress(userData: {
  savings?: number;
  auditCount?: number;
  implementedCount?: number;
  additionalStats?: Record<string, any>;
}) {
  const [userBadges, setUserBadges] = useState<Record<string, UserBadge>>({});
  
  useEffect(() => {
    const calculateProgress = () => {
      const badges: Record<string, UserBadge> = {};
      
      BADGES.forEach(badge => {
        let progress = 0;
        let earned = false;
        
        // Calculate progress based on criteria type
        switch (badge.criteria.type) {
          case 'savingsAmount':
            progress = Math.min(
              Math.floor((userData.savings || 0) / badge.criteria.threshold * 100),
              100
            );
            earned = (userData.savings || 0) >= badge.criteria.threshold;
            break;
            
          case 'auditCount':
            progress = Math.min(
              Math.floor((userData.auditCount || 0) / badge.criteria.threshold * 100),
              100
            );
            earned = (userData.auditCount || 0) >= badge.criteria.threshold;
            break;
            
          case 'implementedCount':
            progress = Math.min(
              Math.floor((userData.implementedCount || 0) / badge.criteria.threshold * 100),
              100
            );
            earned = (userData.implementedCount || 0) >= badge.criteria.threshold;
            break;
            
          case 'custom':
            if (badge.criteria.customCheck) {
              earned = badge.criteria.customCheck(userData);
              progress = earned ? 100 : 0;
            }
            break;
        }
        
        badges[badge.id] = {
          badgeId: badge.id,
          earned,
          progress,
          earnedDate: earned ? new Date() : undefined,
          visible: true
        };
      });
      
      setUserBadges(badges);
    };
    
    calculateProgress();
  }, [userData]);
  
  /**
   * Calculate user points based on current progress and achievements
   */
  const calculatePoints = () => {
    let totalPoints = 0;
    
    // Points from savings
    if (userData.savings) {
      totalPoints += userData.savings * POINTS.SAVINGS_DOLLAR;
    }
    
    // Points from audits
    if (userData.auditCount) {
      totalPoints += userData.auditCount * POINTS.AUDIT_COMPLETED;
    }
    
    // Points from implemented recommendations
    if (userData.implementedCount) {
      totalPoints += userData.implementedCount * POINTS.RECOMMENDATION_IMPLEMENTED;
    }
    
    // Points from earned badges
    Object.values(userBadges).forEach(badge => {
      if (badge.earned) {
        totalPoints += POINTS.BADGE_EARNED;
      }
    });
    
    return Math.floor(totalPoints);
  };
  
  return {
    userBadges,
    totalPoints: calculatePoints(),
    earnedBadges: Object.values(userBadges).filter(badge => badge.earned),
    inProgressBadges: Object.values(userBadges).filter(badge => !badge.earned && badge.progress > 0),
    lockedBadges: Object.values(userBadges).filter(badge => !badge.earned && badge.progress === 0)
  };
}
