// src/components/education/ResourceCard.tsx
import React, { useState } from 'react';
import { EducationalResource, ResourceType } from '@/types/education';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, PieChart, Calculator, HelpCircle, Star } from 'lucide-react';
import BookmarkButton from './BookmarkButton';
import ProgressIndicator from './ProgressIndicator';
import ResourceRatingAndReview from './ResourceRatingAndReview';
import { educationService } from '@/services/educationService';


interface ResourceCardProps {
  resource: EducationalResource;
  featured?: boolean;
  className?: string;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  showProgress?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  featured = false,
  className = '',
  onBookmarkChange,
  showProgress = false
}) => {
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'article':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'infographic':
        return <PieChart className="h-5 w-5 text-green-500" />;
      case 'quiz':
        return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'calculator':
        return <Calculator className="h-5 w-5 text-orange-500" />;
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };



  return (
    <div 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
        featured ? 'border-2 border-green-400' : ''
      } ${className}`}
    >
      <div className="relative aspect-[16/9]">
        <img
          src={resource.thumbnail}
          alt={resource.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {featured && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </div>
        )}
        
        <div className="absolute top-2 left-2">
          <BookmarkButton 
            resourceId={resource.id} 
            isBookmarked={resource.is_bookmarked} 
            size="sm"
            onBookmarkChange={onBookmarkChange}
          />
        </div>
        
        {resource.rating && (
          <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm">
            <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
            {resource.rating.average.toFixed(1)} ({resource.rating.count})
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
          {getResourceIcon(resource.type)}
          
          <Badge variant="outline" className={`text-xs ${getLevelBadgeColor(resource.level)}`}>
            {resource.level.toUpperCase()}
          </Badge>
          
          <Badge variant="outline" className="text-xs">
            {resource.topic.replace(/-/g, ' ').toUpperCase()}
          </Badge>
          
          {resource.readTime && (
            <span className="text-xs text-gray-500">{resource.readTime}</span>
          )}
        </div>
        
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">
          {resource.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3">
          {resource.description}
        </p>
        
        <div className="flex justify-between items-center">
          <a
            href={resource.url}
            className="text-green-600 hover:text-green-700 font-medium text-sm"
          >
            Learn More →
          </a>
          
          <div className="text-xs text-gray-500">
            {new Date(resource.datePublished).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>


        
        {/* Progress indicator */}
        {showProgress && resource.progress && (
          <div className="mt-3">
            <ProgressIndicator 
              progress={resource.progress}
              showPercentage={true}
            />
          </div>
        )}

        {/* Ratings and Reviews */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <ResourceRatingAndReview 
            resourceId={resource.id}
            resourceUrl={resource.url}
            size="sm"
          />
        </div>
        
        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className={`mt-3 flex flex-wrap gap-1 ${showProgress ? 'pt-3 border-t border-gray-100' : ''}`}>
            {resource.tags.slice(0, 2).map(tag => (
              <span 
                key={tag} 
                className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full truncate max-w-[100px]"
              >
                #{tag}
              </span>
            ))}
            {resource.tags.length > 2 && (
              <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full">
                +{resource.tags.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceCard;
