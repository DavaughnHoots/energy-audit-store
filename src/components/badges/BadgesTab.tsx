import React, { useState, useEffect } from 'react';
import { BADGES, getBadgeById, getBadgesByCategory } from '../../data/badges';
import { Badge, UserBadge, UserLevel, LEVELS } from '../../types/badges';
import BadgeCollection from './BadgeCollection';
import LevelProgressBar from './LevelProgressBar';
import { badgeService } from '../../services/badgeService';
import { getTokenInfo } from '../../services/tokenInfoService';

/**
 * Main tab component that displays the user's badge collection and level progress
 */
const BadgesTab: React.FC = () => {
  // State for filtering badges
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showEarned, setShowEarned] = useState<boolean>(true);
  const [showLocked, setShowLocked] = useState<boolean>(true);
  
  // State for user badges and level
  const [userBadges, setUserBadges] = useState<Record<string, UserBadge>>({});
  const [userLevel, setUserLevel] = useState<UserLevel>({
    level: 1,
    points: 0,
    nextLevelPoints: 100,
    title: 'Newcomer'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Load user badges and level on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Determine user ID from various sources
        let uid: string | null = null;
        
        // First try from localStorage user object
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const user = JSON.parse(userJson);
            uid = user.id || user.userId;
            console.log('Found user ID in localStorage:', uid);
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }
        
        // If still no user ID, try from token info
        if (!uid) {
          try {
            // Attempt to get token info from the API
            const tokenInfo = await getTokenInfo();
            console.log('Token info response:', tokenInfo);
            
            if (tokenInfo.userId || (tokenInfo.tokenInfo && tokenInfo.tokenInfo?.userId)) {
              uid = tokenInfo.userId || (tokenInfo.tokenInfo ? tokenInfo.tokenInfo.userId : null);
              console.log('Found user ID in token info:', uid);
            }
          } catch (e) {
            console.error('Error getting token info:', e);
          }
        }
        
        if (uid) {
          setUserId(uid);
          
          // Load user badges
          const badges = await badgeService.getUserBadges(uid);
          setUserBadges(badges);
          
          // Calculate user points based on badges
          let totalPoints = 0;
          Object.values(badges).forEach(badge => {
            if (badge.earned) totalPoints += 50;
            else if (badge.progress > 0) totalPoints += Math.floor(badge.progress * 0.25);
          });
          
          // Set user level based on points
          setUserLevel(badgeService.getUserLevel(totalPoints));
        } else {
          console.warn('No user ID found for badges');
          setUserBadges({});
        }
      } catch (error) {
        console.error('Error loading badge data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  // Get user's earned badges
  const earnedBadges = BADGES.filter(badge => 
    userBadges[badge.id]?.earned
  );

  // Get user's in-progress badges (not earned but have progress)
  const inProgressBadges = BADGES.filter(badge => 
    !userBadges[badge.id]?.earned && 
    (userBadges[badge.id]?.progress || 0) > 0
  );

  // Get locked badges (no progress)
  const lockedBadges = BADGES.filter(badge => 
    !userBadges[badge.id]?.earned && 
    (!userBadges[badge.id] || userBadges[badge.id]?.progress === 0)
  );

  // Filter badges based on active category
  const getFilteredBadges = (badges: Badge[]) => {
    if (activeCategory === 'all') return badges;
    return badges.filter(badge => badge.category === activeCategory);
  };

  // Calculate totals for the UI
  const totalEarned = earnedBadges.length;
  const totalLocked = lockedBadges.length;
  const totalInProgress = inProgressBadges.length;
  const totalBadges = BADGES.length;

  // Filter badge collections based on user preferences
  const filteredEarnedBadges = getFilteredBadges(earnedBadges);
  const filteredInProgressBadges = getFilteredBadges(inProgressBadges);
  const filteredLockedBadges = getFilteredBadges(lockedBadges);

  // Example recent achievement for UI
  const recentAchievement = earnedBadges.length > 0 ? earnedBadges[0] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Achievements</h1>
      
      {/* Level progress bar */}
      <div className="mb-8">
        <LevelProgressBar userLevel={userLevel} />
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
            badges={filteredEarnedBadges}
            userBadges={userBadges}
            title={`Earned Badges (${filteredEarnedBadges.length})`}
            emptyMessage="No earned badges in this category yet."
            className="mb-6"
          />
        )}
        
        {/* In-progress badges section */}
        {showLocked && filteredInProgressBadges.length > 0 && (
          <BadgeCollection
            badges={filteredInProgressBadges}
            userBadges={userBadges}
            title={`In Progress (${filteredInProgressBadges.length})`}
            emptyMessage="No badges in progress in this category."
            className="mb-6"
          />
        )}
        
        {/* Locked badges section */}
        {showLocked && filteredLockedBadges.length > 0 && (
          <BadgeCollection
            badges={filteredLockedBadges}
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
                Earned on {
                  recentAchievement && userBadges[recentAchievement.id]?.earnedDate 
                    ? new Date(userBadges[recentAchievement.id]?.earnedDate as any).toLocaleDateString() 
                    : 'recently'
                }
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
    </div>
  );
};

export default BadgesTab;
