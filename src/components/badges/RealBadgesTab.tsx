import React, { useState } from 'react';
import { useUserBadges } from '../../hooks/useBadgeProgress';
import { Badge, UserLevel } from '../../types/badges';
import BadgeCollection from './BadgeCollection';
import LevelProgressBar from './LevelProgressBar';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * BadgesTab component that uses real API data
 * This component properly connects to the badge API using the useBadgeProgress hook
 */
const RealBadgesTab: React.FC = () => {
  // State for filtering badges
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showEarned, setShowEarned] = useState<boolean>(true);
  const [showLocked, setShowLocked] = useState<boolean>(true);

  // Use the badge hook to fetch real data
  const { 
    loading, 
    error, 
    allBadges, 
    earnedBadges, 
    inProgressBadges, 
    lockedBadges,
    points,
    userBadges,
    refreshBadges
  } = useUserBadges();

  // Safely check that data exists
  const safeAllBadges = allBadges || [];
  const safeUserBadges = userBadges || {};
  
  // Filter badges based on active category
  const getFilteredBadges = (badges: Badge[] | any[]) => {
    if (!badges || !Array.isArray(badges) || badges.length === 0) return [];
    if (activeCategory === 'all') return badges;
    
    return badges.filter(badge => {
      if (!badge) return false;
      
      // Check if it's a Badge object with category property (allBadges)
      if (badge.category && badge.category === activeCategory) {
        return true;
      }
      
      // Or if it's a UserBadge, find the matching badge and check its category
      if (badge.badgeId) {
        const matchingBadge = safeAllBadges.find(b => b && b.id === badge.badgeId);
        return matchingBadge ? matchingBadge.category === activeCategory : false;
      }
      
      return false;
    });
  };

  // Filter badge collections based on user preferences
  const filteredEarnedBadges = getFilteredBadges(earnedBadges);
  const filteredInProgressBadges = getFilteredBadges(inProgressBadges);
  const filteredLockedBadges = getFilteredBadges(lockedBadges);

  // Calculate totals for the UI
  const totalEarned = earnedBadges?.length || 0;
  const totalLocked = lockedBadges?.length || 0;
  const totalInProgress = inProgressBadges?.length || 0;
  const totalBadges = allBadges?.length || 0;
  
  // Find the most recent achievement - with exhaustive null checks
  const firstEarnedBadge = earnedBadges && earnedBadges.length > 0 ? earnedBadges[0] : null;
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

  // If there's an error, show an error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center items-center min-h-[300px]">
        <div className="p-6 bg-red-50 rounded-lg text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Achievements</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => refreshBadges()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Achievements</h1>
      
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

      {/* Badges collections */}
      <div className="space-y-8">
        {/* Earned badges section */}
        {showEarned && filteredEarnedBadges.length > 0 && (
          <BadgeCollection
            badges={getMatchingBadgesFromUserBadges(allBadges, filteredEarnedBadges)}
            userBadges={userBadges}
            title={`Earned Badges (${filteredEarnedBadges.length})`}
            emptyMessage="No earned badges in this category yet."
            className="mb-6"
          />
        )}
        
        {/* In-progress badges section */}
        {showLocked && filteredInProgressBadges.length > 0 && (
          <BadgeCollection
            badges={getMatchingBadgesFromUserBadges(allBadges, filteredInProgressBadges)}
            userBadges={userBadges}
            title={`In Progress (${filteredInProgressBadges.length})`}
            emptyMessage="No badges in progress in this category."
            className="mb-6"
          />
        )}
        
        {/* Locked badges section */}
        {showLocked && filteredLockedBadges.length > 0 && (
          <BadgeCollection
            badges={getMatchingBadgesFromUserBadges(allBadges, filteredLockedBadges)}
            userBadges={userBadges}
            title={`Locked (${filteredLockedBadges.length})`}
            emptyMessage="No locked badges in this category."
            className="mb-6"
          />
        )}

        {/* Empty state */}
        {filteredEarnedBadges.length === 0 && 
         filteredInProgressBadges.length === 0 && 
         filteredLockedBadges.length === 0 && (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500">No badges found with the current filters.</p>
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
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          onClick={() => refreshBadges()}
        >
          Refresh Badges
        </button>
      </div>
    </div>
  );
};

// Helper function to map UserBadge objects to their corresponding Badge objects
function getMatchingBadgesFromUserBadges(allBadges: Badge[], userBadges: any[]): Badge[] {
  return userBadges
    .map(userBadge => allBadges.find(badge => badge.id === userBadge.badgeId))
    .filter((badge): badge is Badge => badge !== undefined);
}

export default RealBadgesTab;
