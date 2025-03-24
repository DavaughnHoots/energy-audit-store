// src/components/education/FeaturedResourcesCarousel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { EducationalResource } from '@/types/education';
import ResourceCard from './ResourceCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedResourcesCarouselProps {
  resources: EducationalResource[];
  title?: string;
  autoRotate?: boolean;
  className?: string;
}

const FeaturedResourcesCarousel: React.FC<FeaturedResourcesCarouselProps> = ({
  resources,
  title = 'Featured Resources',
  autoRotate = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  
  const totalSlides = resources.length;
  const visibleSlides = Math.min(resources.length, 3); // Show up to 3 slides at once on desktop
  
  // Handle rotation when screen size changes
  useEffect(() => {
    const updateVisibleSlides = () => {
      setCurrentIndex(prev => Math.min(prev, Math.max(0, totalSlides - visibleSlides)));
    };
    
    window.addEventListener('resize', updateVisibleSlides);
    return () => window.removeEventListener('resize', updateVisibleSlides);
  }, [totalSlides, visibleSlides]);
  
  // Auto-rotate carousel
  useEffect(() => {
    if (autoRotate && totalSlides > visibleSlides) {
      autoRotateRef.current = setInterval(() => {
        goToNext();
      }, 5000);
    }
    
    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [autoRotate, currentIndex, totalSlides, visibleSlides]);
  
  const goToPrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setTimeout(() => setIsAnimating(false), 300); // Match transition duration
  };
  
  const goToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => Math.min(totalSlides - visibleSlides, prev + 1));
    setTimeout(() => setIsAnimating(false), 300); // Match transition duration
  };
  
  const canGoNext = currentIndex < totalSlides - visibleSlides;
  const canGoPrevious = currentIndex > 0;
  
  // Handle touch events
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      setTouchStart(e.targetTouches[0].clientX);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // At this point TS knows these are not null
    const start = touchStart;
    const end = touchEnd;
    const difference = start - end;
    const threshold = 50; // Min swipe distance
    
    if (difference > threshold) {
      // Swipe left, go next
      goToNext();
    } else if (difference < -threshold) {
      // Swipe right, go previous
      goToPrevious();
    }
    
    // Reset touch points
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  return (
    <div className={`mb-8 ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          
          {totalSlides > visibleSlides && (
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevious}
                disabled={!canGoPrevious}
                className={`p-2 rounded-full ${
                  canGoPrevious
                    ? 'text-gray-700 bg-white shadow-sm hover:bg-gray-100'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={!canGoNext}
                className={`p-2 rounded-full ${
                  canGoNext
                    ? 'text-gray-700 bg-white shadow-sm hover:bg-gray-100'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
      
      <div
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleSlides)}%)`,
          }}
        >
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="px-2 w-full sm:w-1/2 lg:w-1/3 flex-shrink-0"
              style={{ flexBasis: `${100 / visibleSlides}%` }}
            >
              <ResourceCard resource={resource} featured={true} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination dots for mobile */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-4 sm:hidden">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              className={`h-2 w-2 mx-1 rounded-full ${
                i === currentIndex ? 'bg-green-500' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedResourcesCarousel;
