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
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className={`mb-12 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{collection.title}</h2>
          <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full text-gray-700 bg-white shadow-sm hover:bg-gray-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-full text-gray-700 bg-white shadow-sm hover:bg-gray-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div 
        className="flex overflow-x-auto pb-4 scrollbar-hide" 
        ref={scrollContainerRef}
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="flex space-x-4 px-0.5">
          {resources.map((resource) => (
            <div 
              key={resource.id} 
              className="flex-none w-full sm:w-96 md:w-80 lg:w-72"
            >
              <ResourceCard resource={resource} />
            </div>
          ))}
        </div>
      </div>
      
      {collection.resourceIds.length > resources.length && (
        <div className="mt-2 text-right">
          <a 
            href={`/education/collections/${collection.id}`}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            View all in {collection.title} →
          </a>
        </div>
      )}
    </div>
  );
};

export default ResourceCollectionComponent;
