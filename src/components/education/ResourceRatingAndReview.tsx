// src/components/education/ResourceRatingAndReview.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';
import { ResourceRatingInfo } from '@/types/education';
import { cn } from '@/lib/utils';

interface ResourceRatingAndReviewProps {
  resourceId: string;
  resourceUrl?: string;
  ratingInfo?: ResourceRatingInfo;
  showRatingStats?: boolean;
  showReviewButton?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ResourceRatingAndReview: React.FC<ResourceRatingAndReviewProps> = ({
  resourceId,
  resourceUrl,
  ratingInfo,
  showRatingStats = false,
  showReviewButton = true,
  className,
  size = 'md',
}) => {
  // No modal state management needed

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (!ratingInfo) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <a href={resourceUrl || `/education/${resourceId}`}>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:border-green-400"
          >
            View Details & Reviews
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <StarRating 
          initialRating={ratingInfo.average} 
          readOnly 
          size={size === 'lg' ? 'md' : 'sm'} 
        />
        
        <span className={cn('text-gray-600', textSizes[size])}>
          {ratingInfo.average.toFixed(1)} ({ratingInfo.count})
        </span>
      </div>
      
      {showRatingStats && ratingInfo.distribution && (
        <div className="space-y-1 mt-1">
          {Object.entries(ratingInfo.distribution)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([rating, count]) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-3">{rating}</span>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400"
                    style={{ 
                      width: `${ratingInfo.count > 0 
                        ? (count / ratingInfo.count) * 100 
                        : 0}%` 
                    }} 
                  />
                </div>
                <span className="text-xs text-gray-500 w-5 text-right">{count}</span>
              </div>
            ))}
        </div>
      )}
      
      {showReviewButton && (
        <a href={resourceUrl || `/education/${resourceId}`}>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:border-green-400 mt-2"
          >
            {ratingInfo.count > 0
              ? `Read ${ratingInfo.count} Review${ratingInfo.count !== 1 ? 's' : ''}`
              : 'Be the first to review'}
          </Button>
        </a>
      )}
    </div>
  );
};

export default ResourceRatingAndReview;
