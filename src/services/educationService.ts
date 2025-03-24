// src/services/educationService.ts
import { 
  EducationalResource, 
  ResourceCollection, 
  ResourceType,
  ResourceTopic,
  ResourceLevel,
  ResourceFilters
} from '../types/education';
import { 
  mockResources, 
  mockCollections, 
  getFeaturedResources,
  getResourcesByCollectionId,
  getResourcesByType,
  getResourcesByTopic,
  getResourcesByLevel
} from '../data/educational-resources';

// Helper function to apply filters to resources
const applyFilters = (
  resources: EducationalResource[], 
  filters: Partial<ResourceFilters>
): EducationalResource[] => {
  return resources.filter(resource => {
    // Search filter
    const searchTerm = filters.search || '';
    const matchesSearch = searchTerm === '' || (
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Type filter
    const matchesType = !filters.type || filters.type === 'all' || resource.type === filters.type;
    
    // Topic filter
    const matchesTopic = !filters.topic || filters.topic === 'all' || resource.topic === filters.topic;
    
    // Level filter
    const matchesLevel = !filters.level || filters.level === 'all' || resource.level === filters.level;
    
    return matchesSearch && matchesType && matchesTopic && matchesLevel;
  });
};

// Helper function to sort resources
const sortResources = (
  resources: EducationalResource[], 
  sortBy: 'newest' | 'popular' | 'recommended' = 'newest'
): EducationalResource[] => {
  const sortedResources = [...resources];
  
  switch (sortBy) {
    case 'newest':
      return sortedResources.sort((a, b) => 
        new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()
      );
    case 'popular':
      return sortedResources.sort((a, b) => b.popularity - a.popularity);
    case 'recommended':
      // In a real app, this would use user preferences or history
      // For now, we'll use a combination of rating and popularity
      return sortedResources.sort((a, b) => {
        const aScore = (a.rating?.average || 0) * 0.7 + (a.popularity / 1000) * 0.3;
        const bScore = (b.rating?.average || 0) * 0.7 + (b.popularity / 1000) * 0.3;
        return bScore - aScore;
      });
    default:
      return sortedResources;
  }
};

export const educationService = {
  // Get resources with filtering and sorting
  getResources: async (filters: Partial<ResourceFilters> = {}): Promise<EducationalResource[]> => {
    // Simulate API request with delay
    return new Promise(resolve => {
      setTimeout(() => {
        let filteredResources = applyFilters(mockResources, filters);
        
        // Apply sorting if specified
        if (filters.sortBy) {
          filteredResources = sortResources(filteredResources, filters.sortBy);
        }
        
        resolve(filteredResources);
      }, 300); // Simulate network delay
    });
  },
  
  // Get a single resource by ID
  getResourceById: async (id: string): Promise<EducationalResource | null> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const resource = mockResources.find(r => r.id === id) || null;
        resolve(resource);
      }, 200);
    });
  },
  
  // Get all featured resources
  getFeaturedResources: async (): Promise<EducationalResource[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(getFeaturedResources());
      }, 300);
    });
  },
  
  // Get all collections
  getCollections: async (): Promise<ResourceCollection[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([...mockCollections]);
      }, 300);
    });
  },
  
  // Get a single collection by ID
  getCollectionById: async (id: string): Promise<ResourceCollection | null> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const collection = mockCollections.find(c => c.id === id) || null;
        resolve(collection);
      }, 200);
    });
  },
  
  // Get resources for a specific collection
  getResourcesByCollectionId: async (collectionId: string): Promise<EducationalResource[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(getResourcesByCollectionId(collectionId));
      }, 300);
    });
  },
  
  // Get related resources for a given resource
  getRelatedResources: async (resourceId: string): Promise<EducationalResource[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const resource = mockResources.find(r => r.id === resourceId);
        if (!resource) {
          resolve([]);
          return;
        }
        
        // Find resources with similar topics or tags
        const relatedResources = mockResources.filter(r => 
          r.id !== resourceId && (
            r.topic === resource.topic ||
            r.tags.some(tag => resource.tags.includes(tag)) ||
            (resource.relatedResourceIds && resource.relatedResourceIds.includes(r.id))
          )
        );
        
        // Limit to 3 related resources
        resolve(relatedResources.slice(0, 3));
      }, 300);
    });
  },
  
  // Get resources by content type
  getResourcesByType: async (type: ResourceType): Promise<EducationalResource[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(getResourcesByType(type));
      }, 200);
    });
  },
  
  // Get resources by topic
  getResourcesByTopic: async (topic: ResourceTopic): Promise<EducationalResource[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(getResourcesByTopic(topic));
      }, 200);
    });
  },
  
  // Get resources by difficulty level
  getResourcesByLevel: async (level: ResourceLevel): Promise<EducationalResource[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(getResourcesByLevel(level));
      }, 200);
    });
  },
  
  // Search resources by query string
  searchResources: async (query: string): Promise<EducationalResource[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!query.trim()) {
          resolve([]);
          return;
        }
        
        const normalizedQuery = query.toLowerCase().trim();
        const results = mockResources.filter(resource => 
          resource.title.toLowerCase().includes(normalizedQuery) ||
          resource.description.toLowerCase().includes(normalizedQuery) ||
          resource.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
        );
        
        resolve(results);
      }, 300);
    });
  }
};
