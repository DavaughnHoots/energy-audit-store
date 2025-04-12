import { apiClient } from './apiClient';
import { Badge, UserBadge, UserLevel } from '../types/badges';

/**
 * Badge API client for making badge-specific API requests
 * Connects to backend badge endpoints
 */
export const badgeApiClient = {
  /**
   * Add timestamp to prevent 304 responses and bust cache
   */
  _addCacheBusting: (url: string): string => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  },
  /**
   * Get all badge definitions
   */
  getAllBadges: async (): Promise<Badge[]> => {
    try {
      // Add cache busting parameter
      const url = badgeApiClient._addCacheBusting('/badges');
      
      const response = await apiClient.get<{ badges: Badge[] }>(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Handle both response formats (data.badges or just badges directly)
      if (response.data && 'badges' in response.data) {
        return response.data.badges;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('Unexpected badge data format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching all badges:', error);
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Get a specific badge definition
   */
  getBadge: async (badgeId: string): Promise<Badge | null> => {
    try {
      // Add cache busting parameter
      const url = badgeApiClient._addCacheBusting(`/badges/${badgeId}`);
      
      const response = await apiClient.get<{ badge: Badge } | Badge>(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Handle both response formats
      if (response.data && 'badge' in response.data) {
        return response.data.badge;
      } else if (response.data && typeof response.data === 'object') {
        return response.data as Badge;
      }
      
      console.warn(`Unexpected badge data format for ${badgeId}:`, response.data);
      return null;
    } catch (error) {
      console.error(`Error fetching badge ${badgeId}:`, error);
      return null; // Return null instead of throwing
    }
  },
  
  /**
   * Get all badges for a user
   */
  getUserBadges: async (userId: string): Promise<Record<string, UserBadge>> => {
    try {
      // Add cache busting parameter
      const url = badgeApiClient._addCacheBusting(`/users/${userId}/badges`);
      
      const response = await apiClient.get<{ badges: Record<string, UserBadge> } | Record<string, UserBadge>>(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Handle various possible response formats
      if (response.data && typeof response.data === 'object') {
        if ('badges' in response.data) {
          return response.data.badges;
        } else if (!Array.isArray(response.data)) {
          // If it's an object but not wrapped in a 'badges' property
          return response.data as Record<string, UserBadge>;
        }
      }
      
      console.warn(`Unexpected badge data format for user ${userId}:`, response.data);
      return {}; // Return empty object if format is unexpected
    } catch (error) {
      console.error(`Error fetching badges for user ${userId}:`, error);
      return {}; // Return empty object instead of throwing
    }
  },
  
  /**
   * Get user points and level information
   */
  getUserPoints: async (userId: string): Promise<UserLevel> => {
    try {
      // Add cache busting parameter
      const url = badgeApiClient._addCacheBusting(`/users/${userId}/points`);
      
      const response = await apiClient.get<UserLevel>(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching points for user ${userId}:`, error);
      // Return default empty level object instead of throwing
      return {
        level: 0,
        points: 0,
        nextLevelPoints: 100,
        title: 'Energy Novice'
      };
    }
  },
  
  /**
   * Record a user activity that might trigger badge evaluations
   * @param userId User ID
   * @param activityType Type of activity (e.g., 'audit_completed', 'recommendation_implemented')
   * @param metadata Additional activity-specific data
   * @returns Activity record and any badge updates that resulted
   */
  recordActivity: async (
    userId: string, 
    activityType: string, 
    metadata: any
  ): Promise<{
    activity: any;
    badgeUpdates: any[];
  }> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        activity: any;
        badgeUpdates: any[];
      }>(`/users/${userId}/activities`, {
        activityType,
        metadata
      });
      
      return {
        activity: response.data.activity,
        badgeUpdates: response.data.badgeUpdates || []
      };
    } catch (error) {
      console.error(`Error recording activity for user ${userId}:`, error);
      return { activity: null, badgeUpdates: [] }; // Return empty results instead of throwing
    }
  },
  
  /**
   * Admin-only: Update badge progress directly
   * @param userId User ID
   * @param badgeId Badge ID
   * @param progress Progress value (0-100)
   * @returns Success status
   */
  updateBadgeProgress: async (
    userId: string,
    badgeId: string,
    progress: number,
    earned: boolean = false
  ): Promise<boolean> => {
    try {
      const response = await apiClient.put<{ success: boolean }>(
        `/users/${userId}/badges/${badgeId}/progress`,
        { progress, earned }
      );
      
      return response.data.success;
    } catch (error) {
      console.error(`Error updating badge progress for user ${userId}, badge ${badgeId}:`, error);
      return false; // Return failure instead of throwing
    }
  },
  
  /**
   * Admin-only: Manually trigger badge evaluation for a user
   * @param userId User ID
   * @returns Evaluation results
   */
  evaluateBadges: async (userId: string): Promise<any[]> => {
    try {
      const response = await apiClient.post<{ success: boolean; results: any[] }>(
        `/users/${userId}/evaluate-badges`
      );
      
      return response.data.results || [];
    } catch (error) {
      console.error(`Error evaluating badges for user ${userId}:`, error);
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Refresh the user's badge cache
   * @param userId User ID
   * @returns Success status
   */
  refreshBadgeCache: async (userId: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ success: boolean }>(
        `/users/${userId}/badges/refresh`
      );
      
      return response.data.success;
    } catch (error) {
      console.error(`Error refreshing badge cache for user ${userId}:`, error);
      return false; // Return failure instead of throwing
    }
  },

  /**
   * Invalidate user's badge cache to force fresh fetch
   * This is a client-side only method that doesn't hit the server
   */
  invalidateUserCache: (userId: string): void => {
    // Clear any stored badge data from localStorage
    try {
      localStorage.removeItem(`user_badges_${userId}`);
      localStorage.removeItem(`user_points_${userId}`);
      localStorage.removeItem(`badge_evaluation_${userId}`);
      console.log(`Invalidated badge cache for user ${userId}`);
    } catch (error) {
      console.error(`Error invalidating badge cache for user ${userId}:`, error);
    }
  },

  /**
   * Helper function to force refresh of all badge data
   * @param userId User ID
   */
  forceRefresh: async (userId: string): Promise<boolean> => {
    try {
      // Clear client cache
      badgeApiClient.invalidateUserCache(userId);
      
      // Request server refresh and badge evaluation
      await badgeApiClient.refreshBadgeCache(userId);
      await badgeApiClient.evaluateBadges(userId);
      
      // Fetch fresh badge data
      await badgeApiClient.getUserBadges(userId);
      await badgeApiClient.getUserPoints(userId);
      
      return true;
    } catch (error) {
      console.error(`Error performing force refresh for user ${userId}:`, error);
      return false;
    }
  }
};