// src/pages/EducationPage.tsx
import React, { useState, useEffect } from 'react';
import { EducationalResource, ResourceCollection, ResourceFilters } from '@/types/education';
import { educationService } from '@/services/educationService';
import ResourceCard from '@/components/education/ResourceCard';
import FeaturedResourcesCarousel from '@/components/education/FeaturedResourcesCarousel';
import ResourceCollectionComponent from '@/components/education/ResourceCollection';
import ResourceFiltersComponent from '@/components/education/ResourceFilters';
import BookmarksView from '@/components/education/BookmarksView';
import ContinueLearningSection from '@/components/education/ContinueLearningSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuth from '@/context/AuthContext';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';

const EducationPage: React.FC = () => {
  // Add analytics page tracking
  usePageTracking('education');
  
  // Add component tracking for interactive elements
  const trackComponentEvent = useComponentTracking('education', 'EducationPage');
  
  // State for resources and collections
  const [featuredResources, setFeaturedResources] = useState<EducationalResource[]>([]);
  const [collections, setCollections] = useState<ResourceCollection[]>([]);
  const [collectionResources, setCollectionResources] = useState<Record<string, EducationalResource[]>>({});
  const [filteredResources, setFilteredResources] = useState<EducationalResource[]>([]);
  
  // State for loading and error handling
  const [loading, setLoading] = useState({
    featured: true,
    collections: true,
    filtered: true
  });
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [filters, setFilters] = useState<Partial<ResourceFilters>>({
    search: '',
    type: 'all',
    topic: 'all',
    level: 'all',
    sortBy: 'newest'
  });

  // Load featured resources
  useEffect(() => {
    const loadFeaturedResources = async () => {
      try {
        const resources = await educationService.getFeaturedResources();
        setFeaturedResources(resources);
        trackComponentEvent('load_featured_resources', { count: resources.length });
      } catch (err) {
        console.error('Error loading featured resources:', err);
        setError('Failed to load featured resources. Please try again later.');
      } finally {
        setLoading(prev => ({ ...prev, featured: false }));
      }
    };
    
    loadFeaturedResources();
  }, []);

  // Load collections
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const allCollections = await educationService.getCollections();
        setCollections(allCollections);
        trackComponentEvent('load_collections', { count: allCollections.length });
        
        // Load resources for each collection
        const resourcesByCollection: Record<string, EducationalResource[]> = {};
        
        await Promise.all(
          allCollections.map(async (collection) => {
            const resources = await educationService.getResourcesByCollectionId(collection.id);
            resourcesByCollection[collection.id] = resources;
          })
        );
        
        setCollectionResources(resourcesByCollection);
      } catch (err) {
        console.error('Error loading collections:', err);
        setError('Failed to load resource collections. Please try again later.');
      } finally {
        setLoading(prev => ({ ...prev, collections: false }));
      }
    };
    
    loadCollections();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    const loadFilteredResources = async () => {
      setLoading(prev => ({ ...prev, filtered: true }));
      
      try {
        const resources = await educationService.getResources(filters);
        setFilteredResources(resources);
        trackComponentEvent('filter_resources', { 
          filterCriteria: JSON.stringify(filters),
          resultCount: resources.length 
        });
      } catch (err) {
        console.error('Error applying filters:', err);
        setError('Failed to apply filters. Please try again later.');
      } finally {
        setLoading(prev => ({ ...prev, filtered: false }));
      }
    };
    
    loadFilteredResources();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ResourceFilters>) => {
    // Track which filter was changed
    const changedFilters = Object.keys(newFilters)
      .filter(key => newFilters[key as keyof ResourceFilters] !== filters[key as keyof ResourceFilters]);
    
    if (changedFilters.length > 0) {
      trackComponentEvent('change_filter', {
        changedFilters: changedFilters.join(','),
        newValues: JSON.stringify(newFilters)
      });
    }
    
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Check if any section is still loading
  const isLoading = loading.featured || loading.collections || loading.filtered;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Educational Resources</h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600">
            Learn about energy efficiency and discover ways to reduce your energy consumption
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Featured Resources Section */}
        {loading.featured ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm mb-8">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : featuredResources.length > 0 ? (
          <FeaturedResourcesCarousel 
            resources={featuredResources} 
            title="Featured Resources"
          />
        ) : null}

        {/* Resource Collections */}
        {loading.collections ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm mb-8">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : (
          collections.map(collection => {
            const resources = collectionResources[collection.id] || [];
            return resources.length > 0 ? (
              <ResourceCollectionComponent 
                key={collection.id}
                collection={collection}
                resources={resources}
              />
            ) : null;
          })
        )}

        {/* Continue Learning Section (in-progress resources) */}
        <ContinueLearningSection />

        {/* Bookmarks Section */}
        <div className="mb-10">
          <BookmarksView />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Resources</h2>
          
          {/* Resource Filters */}
          <div className="w-full sm:max-w-xl">
            <ResourceFiltersComponent 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
          </div>
        </div>
        
        {/* Resource Grid - Filtered Results */}
        {loading.filtered ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <Alert className="mx-2 sm:mx-0">
            <AlertDescription className="text-sm sm:text-base">
              No resources found matching your search criteria. Try adjusting your filters.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default EducationPage;
