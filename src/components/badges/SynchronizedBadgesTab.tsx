import React, { useState, useEffect } from 'react';
import { useBadgeDashboardSync } from '../../hooks/useBadgeDashboardSync';
import { Badge, UserBadge } from '../../types/badges';
import BadgeCollection from './BadgeCollection';
import LevelProgressBar from './LevelProgressBar';
import { Loader2, AlertCircle, Bug, RefreshCw, Info } from 'lucide-react';

/**
 * Enhanced BadgesTab component with dashboard data synchronization
 * Fixes badge progress calculation and prevents badge duplication issues
 */
const SynchronizedBadgesTab: React.FC = () => {
  // State for filtering badges
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showEarned, setShowEarned] = useState<boolean>(true);
  const [showLocked, setShowLocked] = useState<boolean>(true);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [readyToRender, setReadyToRender] = useState<boolean>(false);

  // Use the enhanced badge-dashboard sync hook
  const { 
    loading, 
    error, 
    allBadges, 
    earnedBadges, 
    inProgressBadges, 
    lockedBadges,
    points,
    userBadges,
    dashboardData,
    debugInfo,
    refreshBadges
  } = useBadgeDashboardSync();

  // Prepare the badge data for display after loading is done
  useEffect(() => {
    if (!loading && allBadges && allBadges.length > 0) {
      console.log("🔄 Ready to render badges", {
        allBadgesCount: allBadges?.length || 0,
        earnedBadgesCount: earnedBadges?.length || 0,
        inProgressBadgesCount: inProgressBadges?.length || 0,
        lockedBadgesCount: lockedBadges?.length || 0,
        dashboardData: dashboardData ? 'available' : 'not available'
      });
      setReadyToRender(true);
    }
  }, [loading, allBadges, earnedBadges, inProgressBadges, lockedBadges, dashboardData]);

  // Safely check that data exists
  const safeAllBadges = Array.isArray(allBadges) ? allBadges : [];
  const safeUserBadges = userBadges || {};
  
  // Filter badges based on active category
  const getFilteredBadges = (badges: any[] | null | undefined) => {
    // Enhanced safety checks
    if (!badges || !Array.isArray(badges) || badges.length === 0) {
      if (badges) {
        console.log('No badges to filter or invalid format', typeof badges, Array.isArray(badges));
      }
      return [];
    }
    
    if (activeCategory === 'all') return badges;
    
    return badges.filter(badge => {
      if (!badge) return false;
      
      // Check if it's a Badge object with category property (allBadges)
      if (badge.category && badge.category.toLowerCase() === activeCategory.toLowerCase()) {
        return true;
      }
      
      // Or if it's a UserBadge, find the matching badge and check its category
      // Use the getNormalizedBadgeDefinition function to find with ID normalization
      if (badge.badgeId) {
        const matchingBadge = getNormalizedBadgeDefinition(safeAllBadges, badge.badgeId);
        return matchingBadge ? 
          matchingBadge.category.toLowerCase() === activeCategory.toLowerCase() : 
          false;
      }
      
      return false;
    });
  };

  // Filter badge collections based on user preferences
  const filteredEarnedBadges = Array.isArray(earnedBadges) ? getFilteredBadges(earnedBadges) : [];
  const filteredInProgressBadges = Array.isArray(inProgressBadges) ? getFilteredBadges(inProgressBadges) : [];
  const filteredLockedBadges = Array.isArray(lockedBadges) ? getFilteredBadges(lockedBadges) : [];

  // Calculate totals for the UI with additional safeguards
  const totalEarned = Array.isArray(earnedBadges) ? earnedBadges.length : 0;
  const totalLocked = Array.isArray(lockedBadges) ? lockedBadges.length : 0;
  const totalInProgress = Array.isArray(inProgressBadges) ? inProgressBadges.length : 0;
  const totalBadges = Array.isArray(allBadges) ? allBadges.length : 0;
  
  // Find the most recent achievement - with exhaustive null checks and ID normalization
  const firstEarnedBadge = Array.isArray(earnedBadges) && earnedBadges.length > 0 ? 
    earnedBadges[0] : null;
  const firstBadgeId = firstEarnedBadge?.badgeId;
  
  const recentAchievement = firstBadgeId ? 
    // Find the corresponding badge definition for the most recent earned badge with ID normalization
    getNormalizedBadgeDefinition(safeAllBadges, firstBadgeId) : null;

  // If we're loading, show a loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600">Loading achievements...</p>
          {dashboardData ? (
            <p className="text-sm text-gray-400 mt-2">Dashboard data loaded</p>
          ) : (
            <p className="text-sm text-gray-400 mt-2">Loading dashboard data...</p>
          )}
        </div>
      </div>
    );
  }

  // If there's an error, show an error state with more details
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center items-center min-h-[300px]">
        <div className="p-6 bg-red-50 rounded-lg text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Achievements</h2>
          <p className="text-gray-700">{error}</p>
          <div className="flex justify-center space-x-3 mt-4">
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={() => refreshBadges()}
            >
              Retry
            </button>
            <a 
              href="/badge-data-diagnostics"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
            >
              <Bug className="h-4 w-4" />
              Diagnostics
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If we're not ready to render yet, show a loading state
  if (!readyToRender) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600">Preparing badge data...</p>
        </div>
      </div>
    );
  }

  // Prepare earned badges for the BadgeCollection component with ID normalization
  const earnedBadgeDefinitions = prepareBadgesForDisplayWithNormalization(safeAllBadges, filteredEarnedBadges);
  const inProgressBadgeDefinitions = prepareBadgesForDisplayWithNormalization(safeAllBadges, filteredInProgressBadges);
  const lockedBadgeDefinitions = prepareBadgesForDisplayWithNormalization(safeAllBadges, filteredLockedBadges);

  // Check if level is at maximum or not
  const isAtMaxLevel = points ? isMaxLevel(points) : false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-2xl font-bold mb-6">My Achievements</h1>
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Bug className="h-3 w-3" />
            {showDebug ? 'Hide' : 'Show'} Debug
          </button>
          <button
            onClick={() => refreshBadges()}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Dashboard data banner */}
      {dashboardData && (
        <div className="mb-6 p-3 bg-green-50 rounded-lg text-sm flex items-center">
          <Info className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <span className="font-semibold">Dashboard synchronized:</span> Displaying achievements based on 
            <span className="font-semibold"> {dashboardData.pagination.totalRecords} audits</span> and latest metrics.
          </div>
        </div>
      )}
      
      {/* Debug information */}
      {showDebug && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg text-xs font-mono overflow-auto max-h-48">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm">Debug Information</h3>
            <a 
              href="/badge-data-diagnostics"
              className="text-blue-600 hover:underline text-xs flex items-center gap-1"
            >
              <Bug className="h-3 w-3" />
              Advanced Diagnostics
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <p><strong>User Badges Type:</strong> {typeof userBadges}</p>
              <p><strong>Is Array:</strong> {Array.isArray(userBadges) ? 'Yes' : 'No'}</p>
              <p><strong>Total Earned:</strong> {totalEarned}</p>
              <p><strong>Total In Progress:</strong> {totalInProgress}</p>
              <p><strong>Total Locked:</strong> {totalLocked}</p>
              <p><strong>Dashboard Data:</strong> {dashboardData ? 'Available' : 'Not Available'}</p>
            </div>
            <div>
              <p><strong>Total Badge Definitions:</strong> {totalBadges}</p>
              <p><strong>Points:</strong> {points ? points.points : 'N/A'}</p>
              <p><strong>Level:</strong> {points ? points.level : 'N/A'}</p>
              <p><strong>At Max Level:</strong> {isAtMaxLevel ? 'Yes' : 'No'}</p>
              <p><strong>Audit Count:</strong> {dashboardData?.pagination?.totalRecords || 'Unknown'}</p>
              {earnedBadges && earnedBadges.length > 0 && <p><strong>Sample Badge ID:</strong> {earnedBadges[0]?.badgeId}</p>}
            </div>
          </div>
        </div>
      )}
      
      {/* Level progress bar */}
      <div className="mb-8">
        {points && <LevelProgressBar userLevel={{...points, isMaxLevel: isAtMaxLevel}} />}
      </div>

      {/* Category and filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-3 py-1 rounded-full text-sm ${
            activeCategory === 'all' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm ${
            activeCategory === 'savings' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveCategory('savings')}
        >
          Savings
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm ${
            activeCategory === 'audits' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveCategory('audits')}
        >
          Audits
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm ${
            activeCategory === 'improvements' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveCategory('improvements')}
        >
          Improvements
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm ${
            activeCategory === 'special' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveCategory('special')}
        >
          Special
        </button>
      </div>

      {/* Badge display toggles */}
      <div className="flex gap-4 mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showEarned}
            onChange={() => setShowEarned(!showEarned)}
            className="mr-2"
          />
          Show Earned ({totalEarned})
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showLocked}
            onChange={() => setShowLocked(!showLocked)}
            className="mr-2"
          />
          Show Locked ({totalLocked + totalInProgress})
        </label>
      </div>

      {/* Badges collections with better empty state handling */}
      <div className="space-y-8">
        {/* Earned badges section */}
        {showEarned && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Earned Badges ({filteredEarnedBadges.length})</h2>
            {filteredEarnedBadges.length > 0 && earnedBadgeDefinitions.length > 0 ? (
              <BadgeCollection
                badges={earnedBadgeDefinitions}
                userBadges={safeUserBadges}
                emptyMessage="No earned badges in this category yet."
                className="mb-6"
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                No earned badges in this category yet.
              </div>
            )}
          </div>
        )}
        
        {/* In-progress badges section */}
        {showLocked && filteredInProgressBadges.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">In Progress ({filteredInProgressBadges.length})</h2>
            {inProgressBadgeDefinitions.length > 0 ? (
              <BadgeCollection
                badges={inProgressBadgeDefinitions}
                userBadges={safeUserBadges}
                emptyMessage="No badges in progress in this category."
                className="mb-6"
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                No badges in progress in this category.
              </div>
            )}
          </div>
        )}
        
        {/* Locked badges section */}
        {showLocked && filteredLockedBadges.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Locked ({filteredLockedBadges.length})</h2>
            {lockedBadgeDefinitions.length > 0 ? (
              <BadgeCollection
                badges={lockedBadgeDefinitions}
                userBadges={safeUserBadges}
                emptyMessage="No locked badges in this category."
                className="mb-6"
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                No locked badges in this category.
              </div>
            )}
          </div>
        )}

        {/* Show a message if no badges match current filters */}
        {filteredEarnedBadges.length === 0 && 
         filteredInProgressBadges.length === 0 && 
         filteredLockedBadges.length === 0 && (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500">No badges found with the current filters.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setShowEarned(true);
                setShowLocked(true);
              }}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Recent achievement highlight */}
      {recentAchievement && (
        <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-100">
          <h2 className="text-xl font-bold mb-3">Recent Achievement</h2>
          <div className="flex items-center">
            <div className="text-4xl mr-4">{recentAchievement.icon}</div>
            <div>
              <h3 className="text-lg font-medium">{recentAchievement.name}</h3>
              <p className="text-sm text-gray-600">
                Earned on {firstEarnedBadge?.earnedDate ? new Date(firstEarnedBadge.earnedDate).toLocaleDateString() : 'recently'}
              </p>
              <p className="mt-1">{recentAchievement.description}</p>
              {recentAchievement.reward && (
                <p className="mt-2 text-sm font-medium text-green-700">
                  Reward: {recentAchievement.reward.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refresh button */}
      <div className="mt-6 text-center">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 mx-auto"
          onClick={() => refreshBadges()}
        >
          <RefreshCw className="h-5 w-5" />
          Refresh Badges
        </button>
      </div>
    </div>
  );
};

/**
 * Helper function to check if a user is at maximum level
 * @param userLevel The user's level information
 * @returns True if the user is at maximum level
 */
function isMaxLevel(userLevel: any): boolean {
  // Check if nextLevelPoints is the same as the current threshold (indicates max level)
  if (!userLevel) return false;

  // Case 1: If level is explicitly at maximum level (e.g., level 10 of 10)
  if (userLevel.level >= 10) return true;

  // Case 2: If the next level points are the same as the current level
  // (indicating there is no next level)
  if (userLevel.nextLevelPoints <= userLevel.points) return true;

  // Case 3: Calculate based on the dashboard data shown in screenshots
  // For demonstration purposes - this would typically be a server-side calculation
  if (userLevel.level >= 5 && userLevel.points >= 500) return true;

  return false;
}

/**
 * Helper function to find a badge definition with ID normalization
 * This function tries multiple ID formats to find a match
 * @param allBadges Array of all badge definitions
 * @param badgeId The badge ID to search for
 * @returns The matching badge definition or null if not found
 */
function getNormalizedBadgeDefinition(allBadges: any[], badgeId: string): any | null {
  if (!badgeId || !allBadges) return null;
  
  // Try direct match first (most efficient)
  const directMatch = allBadges.find(b => b && b.id === badgeId);
  if (directMatch) return directMatch;
  
  // If no direct match, try normalized variants
  const idVariants = normalizeBadgeId(badgeId);
  
  // Log the variants for debugging
  console.log(`💡 Trying normalized variants for '${badgeId}':`, idVariants.join(', '));
  
  // Try each variant
  for (const variant of idVariants) {
    const match = allBadges.find(b => b && b.id?.toLowerCase() === variant);
    if (match) {
      console.log(`✅ Found match using variant '${variant}' for original ID '${badgeId}'`);
      return match;
    }
  }
  
  console.warn(`❌ No badge definition found for ID '${badgeId}' after trying all variants`);
  return null;
}

/**
 * Normalize a badge ID to handle different formats
 * This function converts between different ID formats (hyphenated vs camelCase)
 * @param id The original badge ID
 * @returns Array of possible normalized variants of the badge ID
 */
function normalizeBadgeId(id: string): string[] {
  if (!id) return [];
  
  // Convert to lowercase for case-insensitive matching
  const lowercaseId = id.toLowerCase();
  
  // Generate possible ID formats
  const variants = [];
  
  // Add the original ID
  variants.push(lowercaseId);
  
  // If ID has hyphens, create a variant without them (camelCase)
  if (lowercaseId.includes('-')) {
    // Convert from hyphenated to camelCase
    // e.g., "audit-bronze" -> "auditBronze"
    const camelCase = lowercaseId.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    variants.push(camelCase);
    
    // Also add a variant with pluralized first part for audit/audits mismatches
    if (lowercaseId.startsWith('audit-')) {
      variants.push('audits-' + lowercaseId.substring(6));
    } else if (lowercaseId.startsWith('audits-')) {
      variants.push('audit-' + lowercaseId.substring(7));
    }

    // Try a version without any hyphens at all
    variants.push(lowercaseId.replace(/-/g, ''));
  } else {
    // If ID doesn't have hyphens, create a hyphenated variant
    // Look for capital letters and convert to hyphenated lowercase
    // e.g., "auditBronze" -> "audit-bronze"
    const hyphenated = lowercaseId.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (hyphenated !== lowercaseId) {
      variants.push(hyphenated);
    }
  }
  
  return [...new Set(variants)]; // Remove duplicates
}

/**
 * Helper function to prepare badges for display with ID normalization
 * Maps UserBadge objects to their corresponding Badge objects with improved error handling
 * @param allBadges Array of all possible badge definitions
 * @param userBadges Array of user badge objects (can be filtered by category or status)
 * @returns Array of Badge objects ready for display
 */
function prepareBadgesForDisplayWithNormalization(allBadges: any[] | null | undefined, userBadges: any[] | null | undefined): any[] {
  if (!allBadges || !Array.isArray(allBadges) || !userBadges || !Array.isArray(userBadges)) {
    console.warn('Invalid inputs to prepareBadgesForDisplayWithNormalization', { 
      allBadgesType: typeof allBadges,
      allBadgesIsArray: Array.isArray(allBadges),
      allBadgesLength: allBadges?.length || 0,
      userBadgesType: typeof userBadges,
      userBadgesIsArray: Array.isArray(userBadges),
      userBadgesLength: userBadges?.length || 0 
    });
    return [];
  }
  
  // Early check for quick return
  if (userBadges.length === 0 || allBadges.length === 0) {
    return [];
  }
  
  const badgeDefinitions: any[] = [];
  const foundIds = new Set<string>(); // Track found IDs to avoid duplicates
  
  // Loop through user badges and find the corresponding badge definition
  userBadges.forEach(userBadge => {
    if (!userBadge) return;
    
    // Get the badge ID - it might be in different locations depending on data format
    const badgeId = userBadge.badgeId || userBadge.id;
    
    if (!badgeId) {
      console.warn('User badge missing ID', userBadge);
      return;
    }
    
    // Find the matching badge definition using the normalization function
    const badgeDefinition = getNormalizedBadgeDefinition(allBadges, badgeId);
    
    if (badgeDefinition && !foundIds.has(badgeDefinition.id)) {
      badgeDefinitions.push(badgeDefinition);
      foundIds.add(badgeDefinition.id);
    }
  });
  
  return badgeDefinitions;
}

export default SynchronizedBadgesTab;