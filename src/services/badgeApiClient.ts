import { apiClient } from './apiClient';
import { Badge, UserBadge, UserLevel } from '../types/badges';

/**
 * Badge API client for making badge-specific API requests
 * Connects to backend badge endpoints
 */
export const badgeApiClient = {
  /**
   * Get all badge definitions
   */
  getAllBadges: async (): Promise<Badge[]> => {
    try {
      const response = await apiClient.get<{ badges: Badge[] }>('/badges');
      return response.data.badges;
    } catch (error) {
      console.error('Error fetching all badges:', error);
      throw error;
    }
  },

  /**
   * Get a specific badge definition
   */
  getBadge: async (badgeId: string): Promise<Badge> => {
    try {
      const response = await apiClient.get<{ badge: Badge }>(`/badges/${badgeId}`);
      return response.data.badge;
    } catch (error) {
      console.error(`Error fetching badge ${badgeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get all badges for a user
   */
  getUserBadges: async (userId: string): Promise<Record<string, UserBadge>> => {
    try {
      const response = await apiClient.get<{ badges: Record<string, UserBadge> }>(`/users/${userId}/badges`);
      return response.data.badges;
    } catch (error) {
      console.error(`Error fetching badges for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get user points and level information
   */
  getUserPoints: async (userId: string): Promise<UserLevel> => {
    try {
      const response = await apiClient.get<UserLevel>(`/users/${userId}/points`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching points for user ${userId}:`, error);
      throw error;
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
      throw error;
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
    progress: number
  ): Promise<boolean> => {
    try {
      const response = await apiClient.put<{ success: boolean }>(
        `/users/${userId}/badges/${badgeId}/progress`,
        { progress }
      );
      
      return response.data.success;
    } catch (error) {
      console.error(`Error updating badge progress for user ${userId}, badge ${badgeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Admin-only: Manually trigger badge evaluation for a user
   * @param userId User ID
   * @returns Evaluation results
   */
  evaluateBadges: async (userId: string): Promise<any> => {
    try {
      const response = await apiClient.post<{ success: boolean; results: any }>(
        `/users/${userId}/evaluate-badges`
      );
      
      return response.data.results;
    } catch (error) {
      console.error(`Error evaluating badges for user ${userId}:`, error);
      throw error;
    }
  }
};
