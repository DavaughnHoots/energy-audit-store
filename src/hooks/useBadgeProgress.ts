import { useEffect, useState } from 'react';
import { UserBadge, UserLevel, Badge } from '../types/badges';
import { badgeService } from '../services/badgeService';
import { useAuth } from './useAuth';

/**
 * Hook for fetching all badges for the current user
 * @returns Object containing badges, loading state, and error
 */
export function useUserBadges() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBadges, setUserBadges] = useState<Record<string, UserBadge> | null>({});
  const [points, setPoints] = useState<UserLevel | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  
  useEffect(() => {
    async function fetchBadges() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch badges, points, and badge definitions in parallel
        const [badges, userPoints, badgeDefinitions] = await Promise.all([
          badgeService.getUserBadges(user.id),
          badgeService.getUserPoints(user.id),
          badgeService.getAllBadges()
        ]);
        
        setUserBadges(badges);
        setPoints(userPoints);
        setAllBadges(badgeDefinitions);
      } catch (err) {
        console.error('Error fetching user badges:', err);
        setError('Failed to load badges. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBadges();
  }, [user?.id]);
  
  return {
    loading,
    error,
    userBadges,
    points,
    allBadges,
    earnedBadges: userBadges ? Object.values(userBadges).filter(badge => badge.earned) : [],
    inProgressBadges: userBadges ? Object.values(userBadges).filter(badge => !badge.earned && badge.progress > 0) : [],
    lockedBadges: userBadges ? Object.values(userBadges).filter(badge => !badge.earned && badge.progress === 0) : [],
    refreshBadges: async () => {
      if (user?.id) {
        setLoading(true);
        try {
          badgeService.invalidateUserCache(user?.id);
          const badges = await badgeService.getUserBadges(user?.id || '');
          const userPoints = await badgeService.getUserPoints(user?.id || '');
          setUserBadges(badges);
          setPoints(userPoints);
        } catch (err) {
          console.error('Error refreshing badges:', err);
          setError('Failed to refresh badges.');
        } finally {
          setLoading(false);
        }
      }
    }
  };
}

/**
 * Hook for fetching a specific badge and its progress
 * @param badgeId ID of the badge to fetch
 * @returns Badge details, progress, loading state and error
 */
export function useBadgeProgress(badgeId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [badgeProgress, setBadgeProgress] = useState<UserBadge | null>(null);
  const [badgeDefinition, setBadgeDefinition] = useState<Badge | null>(null);
  
  useEffect(() => {
    if (!user?.id || !badgeId) {
      setLoading(false);
      return;
    }
    
    async function fetchBadgeProgress() {
      try {
        setLoading(true);
        setError(null);
        
        // Get user badges and badge definition
        const [userBadges, badge] = await Promise.all([
          badgeService.getUserBadges(user.id),
          badgeService.getBadge(badgeId)
        ]);
        
        // Get progress for this specific badge
        if (badge) {
          setBadgeDefinition(badge);
        }
        
        // Get user badge progress or create default progress object
        const progress = userBadges[badgeId] || {
          badgeId,
          progress: 0,
          earned: false,
          visible: true
        };
        
        setBadgeProgress(progress);
      } catch (err) {
        console.error(`Error fetching badge progress for ${badgeId}:`, err);
        setError('Failed to load badge progress. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBadgeProgress();
  }, [user?.id, badgeId]);
  
  return { loading, error, badgeProgress, badgeDefinition };
}

/**
 * Hook for fetching recent achievements (earned badges)
 * @param limit Maximum number of achievements to fetch (default: 3)
 * @returns Recent achievements, loading state and error
 */
export function useRecentAchievements(limit: number = 3) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Badge[]>([]);
  
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    async function fetchAchievements() {
      try {
        setLoading(true);
        setError(null);
        
        const recentAchievements = await badgeService.getRecentAchievements(user?.id || '', limit);
        setAchievements(recentAchievements);
      } catch (err) {
        console.error('Error fetching recent achievements:', err);
        setError('Failed to load achievements. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAchievements();
  }, [user?.id, limit]);
  
  return { loading, error, achievements };
}
