import React, { useState } from 'react';
import { useUserBadges } from '../../hooks/useBadgeProgress.enhanced';
import { Badge, UserLevel } from '../../types/badges';
import BadgeCollection from './BadgeCollection';
import LevelProgressBar from './LevelProgressBar';
import { Loader2, AlertCircle, Bug, RefreshCw } from 'lucide-react';

/**
 * Enhanced BadgesTab component that uses robust data handling
 * This component handles potential data format inconsistencies and
 * provides better error handling and diagnostics
 */
const RealBadgesTabEnhanced: React.FC = () => {
  // State for filtering badges
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showEarned, setShowEarned] = useState<boolean>(true);
  const [showLocked, setShowLocked] = useState<boolean>(true);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // Use the enhanced badge hook to fetch real data
  const { 
    loading, 
    error, 
    allBadges, 
    earnedBadges, 
    inProgressBadges, 
    lockedBadges,
    points,
    userBadges,
    debugInfo,
    refreshBadges
  } = useUserBadges();

  // Safely check that data exists
  const safeAllBadges = Array.isArray(allBadges) ? allBadges : [];
  const safeUserBadges = userBadges || {};
  
  // Filter badges based on active category
  const getFilteredBadges = (badges: any[] | null | undefined) => {
    // Enhanced safety checks
    if (!badges || !Array.isArray(badges) || badges.length === 0) {
      console.log('No badges to filter or invalid format', badges);
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
      if (badge.badgeId) {
        const matchingBadge = safeAllBadges.find(b => b && b.id === badge.badgeId);
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
  
  // Find the most recent achievement - with exhaustive null checks
  const firstEarnedBadge = Array.isArray(earnedBadges) && earnedBadges.length > 0 ? 
    earnedBadges[0] : null;
  const firstBadgeId = firstEarnedBadge?.badgeId;
  
  const recentAchievement = firstBadgeId ? 
    // Find the corresponding badge definition for the most recent earned badge
    safeAllBadges.find(badge => badge && badge.id === firstBadgeId) || null 
    : null;

  // If we're loading, show a loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600">Loading achievements...</p>
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
            </div>
            <div>
              <p><strong>Total Badge Definitions:</strong> {totalBadges}</p>
              <p><strong>Points:</strong> {points ? points.points : 'N/A'}</p>
              <p><strong>Level:</strong> {points ? points.level : 'N/A'}</p>
              <p><strong>Debug Info:</strong> {debugInfo ? JSON.stringify(debugInfo).substring(0, 50) + '...' : 'None'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Level progress bar */}
      <div className="mb-8">
        {points && <LevelProgressBar userLevel={points} />}
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
            {filteredEarnedBadges.length > 0 ? (
              <BadgeCollection
                badges={getMatchingBadgesFromUserBadges(allBadges, filteredEarnedBadges)}
                userBadges={safeUserBadges}
                title="Earned Badges"
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
            <BadgeCollection
              badges={getMatchingBadgesFromUserBadges(allBadges, filteredInProgressBadges)}
              userBadges={safeUserBadges}
              title="In Progress Badges"
              emptyMessage="No badges in progress in this category."
              className="mb-6"
            />
          </div>
        )}
        
        {/* Locked badges section */}
        {showLocked && filteredLockedBadges.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Locked ({filteredLockedBadges.length})</h2>
            <BadgeCollection
              badges={getMatchingBadgesFromUserBadges(allBadges, filteredLockedBadges)}
              userBadges={safeUserBadges}
              title="Locked Badges"
              emptyMessage="No locked badges in this category."
              className="mb-6"
            />
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

// Helper function to map UserBadge objects to their corresponding Badge objects
// with additional safety checks
function getMatchingBadgesFromUserBadges(allBadges: Badge[] | null | undefined, userBadges: any[] | null | undefined): Badge[] {
  if (!allBadges || !Array.isArray(allBadges) || !userBadges || !Array.isArray(userBadges)) {
    console.warn('Invalid inputs to getMatchingBadgesFromUserBadges', { allBadges, userBadges });
    return [];
  }
  
  return userBadges
    .filter(userBadge => userBadge && userBadge.badgeId) // Ensure userBadge exists and has badgeId
    .map(userBadge => {
      const badge = allBadges.find(b => b && b.id === userBadge.badgeId);
      return badge || null;
    })
    .filter((badge): badge is Badge => badge !== null && badge !== undefined);
}

export default RealBadgesTabEnhanced;