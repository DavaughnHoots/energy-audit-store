// src/components/education/StarRating.tsx
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  initialRating?: number;
  totalStars?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  precision?: 'full' | 'half';
  onChange?: (rating: number) => void;
  className?: string;
  highlightOnHover?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  initialRating = 0,
  totalStars = 5,
  size = 'md',
  readOnly = false,
  precision = 'full',
  onChange,
  className = '',
  highlightOnHover = true,
}) => {
  // Store both selected rating and hover rating
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  // Update internal state when initialRating prop changes
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  // Size mappings
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const starSize = sizeMap[size];

  // Handle star click
  const handleClick = (clickedRating: number) => {
    if (readOnly) return;
    
    // If clicking the same star that's already selected, clear the rating
    const newRating = rating === clickedRating ? 0 : clickedRating;
    setRating(newRating);
    if (onChange) {
      onChange(newRating);
    }
  };

  // Calculate star fill for a specific position
  const getStarFill = (position: number) => {
    // Use hover rating if available, otherwise use the actual rating
    const currentRating = hoverRating > 0 && highlightOnHover ? hoverRating : rating;
    
    if (precision === 'half') {
      // For half-star precision
      if (position <= currentRating - 0.5) {
        return 'text-yellow-500 fill-yellow-500'; // Filled
      } else if (position === Math.ceil(currentRating) && currentRating % 1 >= 0.5) {
        return 'text-yellow-500 fill-yellow-500 half-filled'; // Half-filled (using CSS)
      }
    } else {
      // For full-star precision
      if (position <= currentRating) {
        return 'text-yellow-500 fill-yellow-500'; // Filled
      }
    }
    
    // Default empty state
    return 'text-gray-300';
  };

  return (
    <div 
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={() => !readOnly && setHoverRating(0)}
    >
      {[...Array(totalStars)].map((_, index) => {
        const position = index + 1;
        return (
          <button
            key={position}
            type="button"
            className={cn(
              'focus:outline-none cursor-default transition-colors duration-150',
              readOnly ? 'cursor-default' : 'cursor-pointer'
            )}
            onClick={() => handleClick(position)}
            onMouseEnter={() => !readOnly && highlightOnHover && setHoverRating(position)}
            disabled={readOnly}
            aria-label={`${position} star${position > 1 ? 's' : ''}`}
          >
            <Star className={cn(starSize, getStarFill(position))} />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
