// src/components/education/ReviewForm.tsx
import React, { useState } from 'react';
import { educationService } from '@/services/educationService';
import StarRating from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Loader2 } from 'lucide-react';
import useAuth from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  resourceId: string;
  initialRating?: number;
  initialReview?: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  compact?: boolean; // For a more compact display
}

const REVIEW_MIN_LENGTH = 10;
const REVIEW_MAX_LENGTH = 500;

const ReviewForm: React.FC<ReviewFormProps> = ({
  resourceId,
  initialRating = 0,
  initialReview = '',
  onSubmitSuccess,
  onCancel,
  className,
  compact = false,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const charCount = review.length;
  const isValidReview = !review || (charCount >= REVIEW_MIN_LENGTH && charCount <= REVIEW_MAX_LENGTH);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('You must be logged in to submit a review.');
      return;
    }
    
    if (!rating) {
      setError('Please select a rating before submitting.');
      return;
    }
    
    if (review && !isValidReview) {
      setError(`Review must be between ${REVIEW_MIN_LENGTH} and ${REVIEW_MAX_LENGTH} characters.`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await educationService.addRating(resourceId, rating, review);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('An error occurred while submitting your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        'space-y-4 p-4 bg-white rounded-lg border border-gray-200',
        compact ? 'p-3 space-y-3' : undefined,
        className
      )}
    >
      <h3 className={cn('font-medium text-gray-900', compact ? 'text-base' : 'text-lg')}>
        {rating > 0 ? 'Edit your review' : 'Write a review'}
      </h3>
      
      <div>
        <div className="flex items-center gap-2 mb-2">
          <StarRating 
            initialRating={rating} 
            onChange={setRating} 
            size={compact ? 'sm' : 'md'}
          />
          <span className="text-sm text-gray-500 font-medium ml-2">
            {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
          </span>
        </div>
        
        <Textarea
          placeholder="Share your thoughts about this resource (optional)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className={cn(
            'resize-none focus:ring-green-500',
            !isValidReview ? 'border-red-500 focus:ring-red-500' : '',
            compact ? 'min-h-[80px]' : 'min-h-[120px]'
          )}
          disabled={isSubmitting}
        />
        
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs ${(charCount > REVIEW_MAX_LENGTH || (charCount > 0 && charCount < REVIEW_MIN_LENGTH)) 
              ? 'text-red-500' 
              : 'text-gray-500'}`}>
            {charCount}/{REVIEW_MAX_LENGTH}
          </span>
          
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        
        <Button
          type="submit"
          variant="default"
          size={compact ? 'sm' : 'default'}
          disabled={isSubmitting || !rating || (review && !isValidReview)}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
