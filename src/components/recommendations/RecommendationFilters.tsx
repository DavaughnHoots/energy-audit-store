import React from 'react';
import { Filter, InfoIcon } from 'lucide-react';
import { RecommendationFiltersProps } from './types';

/**
 * RecommendationFilters component
 * Handles filtering controls for recommendations based on user preferences
 */
const RecommendationFilters: React.FC<RecommendationFiltersProps> = ({
  userCategories,
  showAllRecommendations,
  onToggleShowAll,
  dataSource,
  totalRecommendations,
  filteredCount
}) => {
  return (
    <div className="flex flex-col space-y-2 mb-4">
      <div className="flex justify-between items-center">
        <div>
          {/* Filter controls - only shown when user has preferences */}
          {userCategories.length > 0 && totalRecommendations > 0 && (
            <button
              onClick={onToggleShowAll}
              className={`flex items-center text-xs px-3 py-1 rounded-md ${
                showAllRecommendations 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              {showAllRecommendations ? 'Show All' : 'Show Relevant Only'}
            </button>
          )}
        </div>
        
        {/* Sample data indicator */}
        {dataSource === 'generated' && (
          <div className="flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
            <InfoIcon className="h-3 w-3 mr-1" />
            <span>Sample Data</span>
          </div>
        )}
      </div>
      
      {/* Filtered count information */}
      {totalRecommendations > 0 ? (
        <p className="text-sm text-gray-500">
          Showing {filteredCount} of {totalRecommendations} recommendations
          {!showAllRecommendations && userCategories.length > 0 && (
            <span> relevant to your selected preferences: {userCategories.join(', ')}</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-gray-500">
          No recommendations available yet. Complete an energy audit to get personalized recommendations.
        </p>
      )}
    </div>
  );
};

export default RecommendationFilters;
