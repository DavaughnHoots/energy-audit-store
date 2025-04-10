import React, { useState } from 'react';
import { BADGES, getBadgeById, getBadgesByCategory } from '../../data/badges';
import { Badge, UserBadge, UserLevel, LEVELS } from '../../types/badges';
import BadgeCollection from './BadgeCollection';
import LevelProgressBar from './LevelProgressBar';

// Placeholder user data for frontend-first development
// This will be replaced with real API data later
const PLACEHOLDER_USER_BADGES: Record<string, UserBadge> = {
  'savings-bronze': {
    badgeId: 'savings-bronze',
    earned: true,
    progress: 100,
    earnedDate: new Date('2025-03-15'),
    visible: true
  },
  'savings-silver': {
    badgeId: 'savings-silver',
    earned: false,
    progress: 65,
    visible: true
  },
  'audits-bronze': {
    badgeId: 'audits-bronze',
    earned: true,
    progress: 100,
    earnedDate: new Date('2025-03-10'),
    visible: true
  },
  'improvements-bronze': {
    badgeId: 'improvements-bronze',
    earned: true,
    progress: 100,
    earnedDate: new Date('2025-03-20'),
    visible: true
  },
  'improvements-silver': {
    badgeId: 'improvements-silver',
    earned: false,
    progress: 40,
    visible: true
  },
  'special-scholar': {
    badgeId: 'special-scholar',
    earned: false,
    progress: 75,
    visible: true
  }
};

// Placeholder user level data for frontend-first development
const PLACEHOLDER_USER_LEVEL: UserLevel = {
  level: 3,
  points: 325,
  nextLevelPoints: 500,
  title: 'Energy Enthusiast'
};

/**
 * Main tab component that displays the user's badge collection and level progress
 */
const BadgesTab: React.FC = () => {
  // State for filtering badges
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showEarned, setShowEarned] = useState<boolean>(true);
  const [showLocked, setShowLocked] = useState<boolean>(true);

  // Get user's earned badges
  const earnedBadges = BADGES.filter(badge => {
    if (!badge.id) return false;
    return PLACEHOLDER_USER_BADGES[badge.id]?.earned === true;
  });

  // Get user's in-progress badges (not earned but have progress)
  const inProgressBadges = BADGES.filter(badge => {
    if (!badge.id) return false;
    return !PLACEHOLDER_USER_BADGES[badge.id]?.earned && 
      (PLACEHOLDER_USER_BADGES[badge.id]?.progress || 0) > 0;
  });

  // Get locked badges (no progress)
  const lockedBadges = BADGES.filter(badge => {
    if (!badge.id) return false;
    return !PLACEHOLDER_USER_BADGES[badge.id]?.earned && 
      (!PLACEHOLDER_USER_BADGES[badge.id] || PLACEHOLDER_USER_BADGES[badge.id]?.progress === 0);
  });

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
        <LevelProgressBar userLevel={PLACEHOLDER_USER_LEVEL} />
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
            userBadges={PLACEHOLDER_USER_BADGES}
            title={`Earned Badges (${filteredEarnedBadges.length})`}
            emptyMessage="No earned badges in this category yet."
            className="mb-6"
          />
        )}
        
        {/* In-progress badges section */}
        {showLocked && filteredInProgressBadges.length > 0 && (
          <BadgeCollection
            badges={filteredInProgressBadges}
            userBadges={PLACEHOLDER_USER_BADGES}
            title={`In Progress (${filteredInProgressBadges.length})`}
            emptyMessage="No badges in progress in this category."
            className="mb-6"
          />
        )}
        
        {/* Locked badges section */}
        {showLocked && filteredLockedBadges.length > 0 && (
          <BadgeCollection
            badges={filteredLockedBadges}
            userBadges={PLACEHOLDER_USER_BADGES}
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
                Earned on {PLACEHOLDER_USER_BADGES[recentAchievement.id]?.earnedDate?.toLocaleDateString() || 'recently'}
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
