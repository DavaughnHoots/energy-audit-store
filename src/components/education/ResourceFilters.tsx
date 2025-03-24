// src/components/education/ResourceFilters.tsx
import React, { useState, useEffect } from 'react';
import { ResourceType, ResourceTopic, ResourceLevel, ResourceFilters } from '@/types/education';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface ResourceFiltersProps {
  onFilterChange: (filters: Partial<ResourceFilters>) => void;
  initialFilters?: Partial<ResourceFilters>;
  className?: string;
}

const ResourceFiltersComponent: React.FC<ResourceFiltersProps> = ({
  onFilterChange,
  initialFilters = {},
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>(
    initialFilters.type || 'all'
  );
  const [selectedTopic, setSelectedTopic] = useState<ResourceTopic | 'all'>(
    initialFilters.topic || 'all'
  );
  const [selectedLevel, setSelectedLevel] = useState<ResourceLevel | 'all'>(
    initialFilters.level || 'all'
  );
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'recommended'>(
    initialFilters.sortBy || 'newest'
  );
  const [showFilters, setShowFilters] = useState(false);

  // Update filters when any selection changes
  useEffect(() => {
    const filters: Partial<ResourceFilters> = {
      search: searchQuery,
      type: selectedType === 'all' ? undefined : selectedType,
      topic: selectedTopic === 'all' ? undefined : selectedTopic,
      level: selectedLevel === 'all' ? undefined : selectedLevel,
      sortBy,
    };
    onFilterChange(filters);
  }, [searchQuery, selectedType, selectedTopic, selectedLevel, sortBy, onFilterChange]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedTopic('all');
    setSelectedLevel('all');
    setSortBy('newest');
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedType !== 'all' || 
    selectedTopic !== 'all' || 
    selectedLevel !== 'all';

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 mb-8 ${className}`}>
      {/* Search and Toggle Filters */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg flex items-center gap-1 ${
            showFilters || hasActiveFilters
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-700'
          }`}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full">
              {(selectedType !== 'all' ? 1 : 0) + 
               (selectedTopic !== 'all' ? 1 : 0) + 
               (selectedLevel !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
            aria-label="Clear filters"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
          {/* Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Content Type
            </label>
            <select
              id="type-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ResourceType | 'all')}
            >
              <option value="all">All Types</option>
              <option value="article">Articles</option>
              <option value="video">Videos</option>
              <option value="infographic">Infographics</option>
              <option value="quiz">Quizzes</option>
              <option value="calculator">Calculators</option>
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label htmlFor="topic-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <select
              id="topic-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as ResourceTopic | 'all')}
            >
              <option value="all">All Topics</option>
              <option value="home-appliances">Home Appliances</option>
              <option value="insulation">Insulation</option>
              <option value="renewable-energy">Renewable Energy</option>
              <option value="energy-management">Energy Management</option>
              <option value="energy-saving">Energy Saving</option>
              <option value="smart-home">Smart Home</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label htmlFor="level-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <select
              id="level-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as ResourceLevel | 'all')}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div>
            <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'recommended')}
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="recommended">Recommended</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceFiltersComponent;
