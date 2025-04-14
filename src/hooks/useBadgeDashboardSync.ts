import { useEffect, useState } from 'react';
import { UserBadge, UserLevel, Badge } from '../types/badges';
import { badgeService } from '../services/badgeService';
import { useAuth } from './useAuth';
import { useUserBadges } from './useBadgeProgress.badge-fix';

/**
 * Enhanced hook for fetching and synchronizing badges with dashboard metrics
 * Solves issues with badge progress calculation, duplication, and dashboard sync
 * @returns Object containing badges with dashboard-synced metrics, loading state, and error
 */
export function useBadgeDashboardSync() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  // Get badges from the base hook
  const {
    userBadges,
    points,
    allBadges,
    debugInfo,
    refreshBadges
  } = useUserBadges();
  
  // Fetch dashboard data separately
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) {
        setDashboardLoading(false);
        return;
      }
      
      setDashboardLoading(true);
      setDashboardError(null);
      
      try {
        console.log('Fetching dashboard data for user:', user.id);
        
        // Fetch audit history to get the total count
        const response = await fetch(`/api/audits?userId=${user.id}&page=1&limit=1`);
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Dashboard data retrieved:', data);
        
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setDashboardError('Failed to load dashboard data. Badge progress may be inaccurate.');
      } finally {
        setDashboardLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [user?.id]);
  
  // Synchronize badges with dashboard metrics
  const syncedBadges = userBadges ? syncBadgeProgressWithDashboard(userBadges, dashboardData) : null;
  
  // Process badges to avoid duplication
  const { earnedBadges, inProgressBadges, lockedBadges } = processBadgesWithoutDuplication(syncedBadges);
  
  return {
    loading: loading || dashboardLoading,
    error: error || dashboardError,
    userBadges: syncedBadges,
    originalBadges: userBadges,
    dashboardData,
    points,
    allBadges,
    earnedBadges,
    inProgressBadges,
    lockedBadges,
    debugInfo: {
      ...debugInfo,
      dashboardData: dashboardData ? {
        auditCount: getDashboardMetric('audits', dashboardData),
        hasDashboardData: !!dashboardData
      } : null
    },
    refreshBadges: async () => {
      // Custom refresh that updates both badges and dashboard data
      if (user?.id) {
        setLoading(true);
        setDashboardLoading(true);
        
        try {
          // Refresh both sets of data in parallel
          await Promise.all([
            refreshBadges(),
            (async () => {
              const response = await fetch(`/api/audits?userId=${user.id}&page=1&limit=1`);
              if (!response.ok) {
                throw new Error(`Failed to refresh dashboard data: ${response.status}`);
              }
              const data = await response.json();
              setDashboardData(data);
            })()
          ]);
        } catch (err) {
          console.error('Error refreshing data:', err);
        } finally {
          setLoading(false);
          setDashboardLoading(false);
        }
      }
    }
  };
}

/**
 * Synchronize badge progress with actual dashboard metrics
 * @param badges User badges to update
 * @param dashboardData Dashboard data containing actual metrics
 * @returns Updated badges with correct progress values
 */
function syncBadgeProgressWithDashboard(
  badges: Record<string, UserBadge>, 
  dashboardData: any
): Record<string, UserBadge> {
  if (!badges || !dashboardData) return badges || {};
  
  // Create a copy to avoid modifying the original
  const updatedBadges = {...badges};
  
  // Get actual metrics from dashboard
  const auditCount = getDashboardMetric('audits', dashboardData);
  console.log(`📊 Found audit count: ${auditCount}`);
  
  // Update badge progress based on actual metrics
  Object.keys(updatedBadges).forEach(badgeId => {
    // Special handling for audit badges
    const isAuditBadge = badgeId.startsWith('audit-') || badgeId.startsWith('audits-');
    if (isAuditBadge) {
      const requirement = getRequirementFromBadgeId(badgeId);
      if (requirement > 0) {
        // Calculate actual progress
        const shouldBeEarned = auditCount >= requirement;
        const actualProgress = Math.min(100, Math.floor((auditCount / requirement) * 100));
        
        // Only update if there's a change needed
        if (updatedBadges[badgeId].progress !== actualProgress || updatedBadges[badgeId].earned !== shouldBeEarned) {
          console.log(`⚙️ Updating ${badgeId}: progress=${actualProgress}%, earned=${shouldBeEarned} (based on ${auditCount}/${requirement} audits)`);
          updatedBadges[badgeId].progress = actualProgress;
          updatedBadges[badgeId].earned = shouldBeEarned;
          
          // If newly earned, set earned date
          if (shouldBeEarned && !updatedBadges[badgeId].earnedDate) {
            updatedBadges[badgeId].earnedDate = new Date().toISOString();
          }
        }
      }
    }
    
    // Add handling for other badge types here (savings, improvements, etc.)
  });
  
  return updatedBadges;
}

/**
 * Process badges to prevent duplication across categories
 * Uses a prioritized approach to ensure each badge appears in exactly one category
 * @param badges User badges to process
 * @returns Categorized badges without duplication
 */
function processBadgesWithoutDuplication(badges: Record<string, UserBadge> | null) {
  // Default empty arrays
  const earnedBadges: UserBadge[] = [];
  const inProgressBadges: UserBadge[] = [];
  const lockedBadges: UserBadge[] = [];
  
  if (!badges) return { earnedBadges, inProgressBadges, lockedBadges };
  
  // Track which badges have been processed to prevent duplication
  const processedBadgeIds = new Set<string>();
  
  // Process earned badges first (highest priority)
  Object.values(badges)
    .filter(badge => badge && badge.earned === true && badge.progress > 0)
    .forEach(badge => {
      earnedBadges.push(badge);
      processedBadgeIds.add(badge.badgeId);
    });
    
  // Process in-progress badges second (those with progress that aren't earned yet)
  Object.values(badges)
    .filter(badge => 
      badge && 
      !processedBadgeIds.has(badge.badgeId) && // Skip already processed badges
      badge.earned !== true && 
      badge.progress > 0
    )
    .forEach(badge => {
      inProgressBadges.push(badge);
      processedBadgeIds.add(badge.badgeId);
    });
    
  // Process locked badges last (all remaining badges)
  Object.values(badges)
    .filter(badge => 
      badge && 
      !processedBadgeIds.has(badge.badgeId) // Skip already processed badges
    )
    .forEach(badge => {
      lockedBadges.push(badge);
      processedBadgeIds.add(badge.badgeId);
    });
  
  // Log the results
  console.log('🔄 Badge categorization complete', {
    earnedCount: earnedBadges.length,
    inProgressCount: inProgressBadges.length,
    lockedCount: lockedBadges.length,
    totalProcessed: processedBadgeIds.size,
    totalBadges: Object.keys(badges).length
  });
  
  return { earnedBadges, inProgressBadges, lockedBadges };
}

/**
 * Extract specific metrics from dashboard data
 * @param metricType Type of metric to extract (audits, savings, improvements)
 * @param dashboardData Dashboard data to extract from
 * @returns Extracted metric value or 0 if not found
 */
function getDashboardMetric(metricType: string, dashboardData: any): number {
  if (!dashboardData) return 0;
  
  switch (metricType) {
    case 'audits':
      // Extract audit count from pagination data
      return dashboardData?.pagination?.totalRecords || 0;
      
    case 'savings':
      // Extract savings amount from report data
      return dashboardData?.report?.executiveSummary?.potentialSavings || 0;
      
    case 'improvements':
      // Extract implemented recommendations count
      return dashboardData?.report?.recommendations?.filter((r: any) => 
        r.implementationDate || r.implementationCost
      ).length || 0;
      
    default:
      return 0;
  }
}

/**
 * Get badge requirement based on badge ID
 * @param badgeId Badge ID to analyze
 * @returns Numeric requirement for the badge
 */
function getRequirementFromBadgeId(badgeId: string): number {
  if (!badgeId) return 0;

  // Extract the base ID without any prefix variations
  const normalizedId = badgeId.toLowerCase()
    .replace('audits-', '') // Remove any prefix
    .replace('audit-', '')
    .replace('savings-', '')
    .replace('improvements-', '');
  
  // Match the level part of the badge ID
  switch (normalizedId) {
    // Audit badge requirements
    case 'bronze': return 5; // Bronze requires 5 audits
    case 'silver': return 15; // Silver requires 15 audits
    case 'gold': return 30; // Gold requires 30 audits
    case 'platinum': return 50; // Platinum requires 50 audits
    
    // Savings badge requirements (in dollars)
    case 'savings-bronze': return 100;
    case 'savings-silver': return 500;
    case 'savings-gold': return 1000;
    case 'savings-platinum': return 2000;
    
    // Improvements badge requirements (count of implemented recommendations)
    case 'improvements-bronze': return 1;
    case 'improvements-silver': return 5;
    case 'improvements-gold': return 10;
    case 'improvements-platinum': return 25;
    
    default: return 0;
  }
}