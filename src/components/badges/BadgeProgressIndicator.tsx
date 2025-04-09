import React from 'react';
import { BadgeCriteriaType } from '../../types/badges';
import { cn } from '../../utils/cn';

interface BadgeProgressIndicatorProps {
  badgeId: string;
  progress: number;  // 0-100
  threshold: number;
  currentValue: number;
  criteriaType: BadgeCriteriaType;
  compact?: boolean;
  showAnimation?: boolean;
  className?: string;
}

/**
 * Visual indicator showing progress toward earning a badge
 */
const BadgeProgressIndicator: React.FC<BadgeProgressIndicatorProps> = ({
  badgeId,
  progress,
  threshold,
  currentValue,
  criteriaType,
  compact = false,
  showAnimation = false,
  className
}) => {
  // Calculate the remaining amount needed
  const remaining = Math.max(0, threshold - currentValue);
  
  // Determine the progress bar color based on completion
  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500';
    if (progress > 0) return 'bg-blue-500';
    return 'bg-gray-300';
  };
  
  // Generate the message based on criteria type
  const getProgressMessage = () => {
    if (progress >= 100) {
      return 'Completed!';
    }
    
    const remainingText = remaining === 1 ? '' : 's';
    
    switch (criteriaType) {
      case 'savingsAmount':
        return `Save $${remaining.toLocaleString()} more to earn this badge`;
      case 'auditCount':
        return `Complete ${remaining} more audit${remainingText} to earn this badge`;
      case 'implementedCount':
        return `Implement ${remaining} more recommendation${remainingText} to earn this badge`;
      case 'custom':
        return 'Complete special requirements to earn this badge';
      default:
        return 'Make progress to earn this badge';
    }
  };
  
  // Compact version has minimal styling and less text
  if (compact) {
    return (
      <div className={cn('w-full', className)}>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all', 
              getProgressColor(),
              showAnimation && 'transition-all duration-1000'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }
  
  // Full version with detailed progress information
  return (
    <div className={cn('w-full space-y-1', className)}>
      {/* Progress percentage */}
      <div className="flex justify-between text-sm">
        <span className="font-medium">{progress}% complete</span>
        <span className="text-gray-500">{currentValue} / {threshold}</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full rounded-full', 
            getProgressColor(),
            showAnimation && 'transition-all duration-1000'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Progress message */}
      <p className="text-sm text-gray-600 mt-1">
        {getProgressMessage()}
      </p>
    </div>
  );
};

export default BadgeProgressIndicator;
