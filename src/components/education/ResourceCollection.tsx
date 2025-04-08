// src/components/education/ResourceCollection.tsx
import React, { useRef } from 'react';
import { ResourceCollection, EducationalResource } from '@/types/education';
import ResourceCard from './ResourceCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResourceCollectionProps {
  collection: ResourceCollection;
  resources: EducationalResource[];
  className?: string;
}

const ResourceCollectionComponent: React.FC<ResourceCollectionProps> = ({
  collection,
  resources,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('div[style*="scroll-snap-align"]')?.clientWidth || container.clientWidth;
      container.scrollBy({
        left: -cardWidth,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('div[style*="scroll-snap-align"]')?.clientWidth || container.clientWidth;
      container.scrollBy({
        left: cardWidth,
        behavior: 'smooth',
      });
    }
  };

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className={`mb-8 sm:mb-12 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{collection.title}</h2>
          <p className="text-sm text-gray-600 mt-0.5 sm:mt-1">{collection.description}</p>
        </div>
        
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={scrollLeft}
            className="p-1.5 sm:p-2 rounded-full text-gray-700 bg-white shadow-sm hover:bg-gray-100 active:bg-gray-200"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollRight}
            className="p-1.5 sm:p-2 rounded-full text-gray-700 bg-white shadow-sm hover:bg-gray-100 active:bg-gray-200"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div 
          className="overflow-x-auto pb-4 scrollbar-hide scroll-smooth" 
          ref={scrollContainerRef}
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollPaddingLeft: '1rem',
            scrollPaddingRight: '1rem'
          }}
        >
          <div className="flex px-4 sm:px-0">
            {resources.map((resource, index) => (
              <div 
                key={resource.id} 
                className={`flex-none w-[calc(100%-2rem)] sm:w-96 md:w-80 lg:w-72 ${
                  index !== resources.length - 1 ? 'mr-4 sm:mr-6' : ''
                }`}
                style={{
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always'
                }}
              >
                <ResourceCard resource={resource} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {collection.resourceIds.length > resources.length && (
        <div className="mt-3 sm:mt-2 text-right px-3 sm:px-0">
          <a 
            href={`/education/collections/${collection.id}`}
            className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center"
          >
            <span>View all in {collection.title}</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </a>
        </div>
      )}
    </div>
  );
};

export default ResourceCollectionComponent;
