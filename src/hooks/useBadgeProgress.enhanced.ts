import { useEffect, useState } from 'react';
import { UserBadge, UserLevel, Badge } from '../types/badges';
import { badgeService } from '../services/badgeService';
import { useAuth } from './useAuth';

/**
 * Enhanced hook for fetching all badges for the current user
 * Includes improved error handling and data normalization
 * @returns Object containing badges, loading state, and error
 */
export function useUserBadges() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBadges, setUserBadges] = useState<Record<string, UserBadge> | null>({});
  const [points, setPoints] = useState<UserLevel | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  useEffect(() => {
    async function fetchBadges() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching badges for user:', user.id);
        
        // Fetch badges, points, and badge definitions in parallel
        const [userBadgesResponse, userPoints, badgeDefinitions] = await Promise.all([
          badgeService.getUserBadges(user.id),
          badgeService.getUserPoints(user.id),
          badgeService.getAllBadges()
        ]);
        
        // Enhanced data validation and normalization
        let normalizedBadges = userBadgesResponse;
        
        // Store some debug info about the data structure
        const debugData = {
          originalType: typeof userBadgesResponse,
          isArray: Array.isArray(userBadgesResponse),
          keysCount: userBadgesResponse ? Object.keys(userBadgesResponse).length : 0,
          sampleKey: userBadgesResponse ? Object.keys(userBadgesResponse)[0] : null,
          sampleValue: userBadgesResponse ? 
            Object.values(userBadgesResponse)[0] || 'No values' : 
            'No userBadges'
        };
        setDebugInfo(debugData);
        
        // Handle null response
        if (!normalizedBadges) {
          console.warn('User badges response was null, using empty object');
          normalizedBadges = {};
        }
        
        // Handle array response (convert to object with ID keys)
        if (Array.isArray(normalizedBadges)) {
          console.log('Converting badges array to object structure');
          const badgeObject: Record<string, UserBadge> = {};
          normalizedBadges.forEach((badge: any) => {
            if (badge && badge.badgeId) {
              badgeObject[badge.badgeId] = badge;
            }
          });
          normalizedBadges = badgeObject;
        }
        
        // Validate each badge has required properties
        Object.keys(normalizedBadges).forEach(badgeId => {
          const badge = normalizedBadges[badgeId];
          
          // Ensure required fields exist
          if (!badge.progress && badge.progress !== 0) {
            console.warn(`Badge ${badgeId} missing progress, setting to 0`);
            normalizedBadges[badgeId].progress = 0;
          }
          
          if (badge.earned === undefined) {
            console.warn(`Badge ${badgeId} missing earned status, setting to false`);
            normalizedBadges[badgeId].earned = false;
          }
          
          // Ensure the badgeId field exists and matches the key
          if (!badge.badgeId) {
            console.warn(`Badge ${badgeId} missing badgeId, adding it`);
            normalizedBadges[badgeId].badgeId = badgeId;
          }
        });
        
        // Ensure all defined badges have entries in userBadges
        badgeDefinitions.forEach(badgeDef => {
          if (badgeDef && badgeDef.id && !normalizedBadges[badgeDef.id]) {
            console.log(`Adding missing badge ${badgeDef.id} to user badges`);
            normalizedBadges[badgeDef.id] = {
              badgeId: badgeDef.id,
              progress: 0,
              earned: false,
              visible: true
            };
          }
        });
        
        setUserBadges(normalizedBadges);
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
  
  // Normalize and categorize badges
  const earnedBadges = userBadges ? 
    Object.values(userBadges).filter(badge => badge && badge.earned === true) : 
    [];
    
  const inProgressBadges = userBadges ? 
    Object.values(userBadges).filter(badge => 
      badge && 
      badge.earned !== true && 
      ((badge.progress !== undefined && badge.progress > 0) || 
       (typeof badge.progress === 'number' && badge.progress > 0))
    ) : 
    [];
    
  const lockedBadges = userBadges ? 
    Object.values(userBadges).filter(badge => 
      badge && 
      badge.earned !== true && 
      (!badge.progress || badge.progress <= 0)
    ) : 
    [];
  
  return {
    loading,
    error,
    userBadges,
    points,
    allBadges,
    earnedBadges,
    inProgressBadges,
    lockedBadges,
    debugInfo,
    refreshBadges: async () => {
      if (user?.id) {
        setLoading(true);
        try {
          console.log('Refreshing badges for user:', user.id);
          badgeService.invalidateUserCache(user?.id);
          
          // Refetch all badge data
          const badges = await badgeService.getUserBadges(user?.id || '');
          const userPoints = await badgeService.getUserPoints(user?.id || '');
          
          // Store the debug info
          setDebugInfo({
            refreshedType: typeof badges,
            isArray: Array.isArray(badges),
            keysCount: badges ? Object.keys(badges).length : 0,
            structure: JSON.stringify(badges).substring(0, 100) + '...'
          });
          
          // Handle potential null response
          if (!badges) {
            setUserBadges({});
          } else {
            setUserBadges(badges);
          }
          
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
 * Enhanced hook for fetching a specific badge and its progress
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
        const progress = userBadges && userBadges[badgeId] ? userBadges[badgeId] : {
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
 * Enhanced hook for fetching recent achievements (earned badges)
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
