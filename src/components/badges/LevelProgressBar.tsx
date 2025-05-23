import React from 'react';
import { UserLevel } from '../../types/badges';

export interface LevelProgressBarProps {
  userLevel: UserLevel;
  isMaxLevel?: boolean;
}

/**
 * Displays the user's current level and progress toward the next level
 */
const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ userLevel, isMaxLevel = false }) => {
  // Add fallback values and field name normalization
  const userLevelData = userLevel || {};
  
  // Handle both API and component field naming conventions
  const level = userLevelData.currentLevel || userLevelData.level || 1;
  const points = userLevelData.totalPoints || userLevelData.points || 0;
  const nextLevelPoints = userLevelData.nextLevelThreshold || userLevelData.nextLevelPoints || 100;
  const title = userLevelData.currentTitle || userLevelData.title || 'Energy User';
  
  // Log the user level data for debugging
  console.log('LevelProgressBar received userLevel:', userLevel);
  console.log('Normalized level data in component:', { level, points, nextLevelPoints, title });
  
  // Calculate progress percentage
  const pointsNeeded = nextLevelPoints - points;
  const progressPercentage = Math.min(
    Math.floor((points / nextLevelPoints) * 100), 
    100
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-1">
        <div>
          <span className="font-bold text-lg">Level {level}</span>
          <span className="text-gray-600 ml-2">{title}</span>
        </div>
        <div className="text-sm text-gray-500">
          {!isMaxLevel && pointsNeeded > 0 ? (
            <span>{pointsNeeded} points to Level {level + 1}</span>
          ) : (
            <span>Maximum level reached</span>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-green-600 h-3 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Progress details */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{points} points earned</span>
        {!isMaxLevel && pointsNeeded > 0 && <span>{nextLevelPoints} points needed</span>}
      </div>
    </div>
  );
};

export default LevelProgressBar;