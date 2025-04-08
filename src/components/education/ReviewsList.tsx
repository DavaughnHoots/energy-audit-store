// src/components/education/ReviewsList.tsx
import React, { useState, useEffect } from 'react';
import { ResourceReview } from '@/types/education';
import { educationService } from '@/services/educationService';
import StarRating from './StarRating';
import { Button } from '@/components/ui/button';
import { Loader2, ThumbsUp, Flag, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewsListProps {
  resourceId: string;
  maxDisplayed?: number;
  showViewMore?: boolean;
  className?: string;
  compact?: boolean;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  resourceId,
  maxDisplayed = 3,
  showViewMore = true,
  className,
  compact = false,
}) => {
  const [reviews, setReviews] = useState<ResourceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(maxDisplayed);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const fetchedReviews = await educationService.getResourceReviews(resourceId);
        setReviews(fetchedReviews);
        setError(null);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [resourceId]);

  const handleViewMore = () => {
    setDisplayCount(prev => Math.min(prev + maxDisplayed, reviews.length));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // If it's within the last 7 days, show relative time
    const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 1) {
      return 'Today';
    } else if (daysDiff === 1) {
      return 'Yesterday';
    } else if (daysDiff < 7) {
      return `${daysDiff} days ago`;
    } else {
      // Otherwise show the full date
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className={cn('p-4 flex justify-center items-center', className)}>
        <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center text-red-500', className)}>
        <p>{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={cn('p-4 text-center text-gray-500', className)}>
        <p>No reviews yet. Be the first to review this resource!</p>
      </div>
    );
  }

  const visibleReviews = reviews.slice(0, displayCount);

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className={cn('font-medium text-gray-800', compact ? 'text-base' : 'text-lg')}>
        Reviews ({reviews.length})
      </h3>
      
      <div className="space-y-3">
        {visibleReviews.map((review) => (
          <div 
            key={review.id} 
            className="p-3 bg-white border border-gray-200 rounded-lg"
          >
            {/* Review Header - User info and rating */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                {review.userAvatar ? (
                  <img 
                    src={review.userAvatar} 
                    alt={review.userName || 'User'}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-gray-500 text-sm font-medium">
                    {(review.userName || 'U').charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">{review.userName || 'Anonymous'}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <StarRating 
                      initialRating={review.rating}
                      readOnly
                      size="sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Review Date */}
              <div className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(review.createdAt)}
              </div>
            </div>
            
            {/* Review Content */}
            {review.reviewText && (
              <div className="mt-2 text-gray-700">
                <p className="text-sm">{review.reviewText}</p>
              </div>
            )}
            
            {/* Review Actions */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gray-600 h-7 px-2"
                disabled={review.reported}
              >
                <Flag className="h-3 w-3 mr-1" />
                {review.reported ? 'Reported' : 'Report'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gray-600 h-7 px-2"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful {review.helpful ? `(${review.helpful})` : ''}
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* View More Button */}
      {showViewMore && displayCount < reviews.length && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewMore}
            className="text-green-600 border-green-300 hover:border-green-500"
          >
            View More Reviews
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
