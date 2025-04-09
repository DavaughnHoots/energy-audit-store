import React from 'react';
import { Badge } from '../../types/badges';
import { cn } from '../../utils/cn';

interface BadgeCardProps {
  badge: Badge;
  progress?: number; // 0-100
  earned?: boolean;
  earnedDate?: Date;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A card component for displaying individual badges
 */
const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  progress = 0,
  earned = false,
  earnedDate,
  onClick,
  size = 'md',
  className
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'w-20 h-24 text-sm',
    md: 'w-28 h-32 text-base',
    lg: 'w-36 h-40 text-lg'
  };

  // Determine badge state styling
  const getBadgeStateClass = () => {
    if (earned) return 'bg-green-50 border-green-200';
    if (progress > 0) return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-2 border rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-md',
        getBadgeStateClass(),
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center text-3xl mb-1',
        size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-2xl' : 'text-3xl'
      )}>
        {badge.icon}
      </div>

      {/* Badge Name */}
      <h3 className="font-medium text-center truncate w-full">
        {badge.name}
      </h3>

      {/* Progress indicator for badges in progress */}
      {!earned && progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full px-2 pb-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* "Locked" overlay for zero progress badges */}
      {!earned && progress === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-20 rounded-lg">
          <span className="text-white text-xs font-bold">🔒</span>
        </div>
      )}

      {/* Earned indicator */}
      {earned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
          ✓
        </div>
      )}
    </div>
  );
};

export default BadgeCard;
