// src/services/educationService.ts
import { 
  EducationalResource, 
  ResourceCollection, 
  ResourceType,
  ResourceTopic,
  ResourceLevel,
  ResourceFilters,
  ResourceReview,
  ResourceRatingInfo
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
  
  // Add bookmark for a resource
  addBookmark: async (resourceId: string): Promise<boolean> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Adding bookmark for resource ${resourceId}`);
        
        // Simulate successful API call
        resolve(true);
      }, 300);
    });
  },
  
  // Remove bookmark for a resource
  removeBookmark: async (resourceId: string): Promise<boolean> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Removing bookmark for resource ${resourceId}`);
        
        // Simulate successful API call
        resolve(true);
      }, 300);
    });
  },
  
  // Get user's bookmarked resources
  getUserBookmarks: async (): Promise<EducationalResource[]> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate getting bookmarked resources (random subset for demo)
        const bookmarkedResources = mockResources
          .filter(() => Math.random() > 0.7) // Random 30% of resources
          .map(resource => ({
            ...resource,
            is_bookmarked: true
          }));
        
        resolve(bookmarkedResources);
      }, 300);
    });
  },
  
  // Update resource progress
  updateProgress: async (resourceId: string, data: { status?: 'not_started' | 'in_progress' | 'completed', percentComplete?: number }): Promise<boolean> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Updating progress for resource ${resourceId}`, data);
        
        // Simulate successful API call
        resolve(true);
      }, 300);
    });
  },
  
  // Get resources in progress (Continue Learning)
  getInProgressResources: async (): Promise<EducationalResource[]> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate getting in-progress resources (random subset for demo)
        const inProgressResources = mockResources
          .filter(() => Math.random() > 0.8) // Random 20% of resources
          .map(resource => ({
            ...resource,
            progress: {
              status: 'in_progress' as const,
              percentComplete: Math.floor(Math.random() * 80) + 10, // Random between 10-90%
              lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random date in last week
            }
          }));
        
        resolve(inProgressResources);
      }, 300);
    });
  },
  
  // Mark resource as complete
  markAsComplete: async (resourceId: string): Promise<boolean> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Marking resource ${resourceId} as complete`);
        
        // Simulate successful API call
        resolve(true);
      }, 300);
    });
  },
  
  // Add or update a rating
  addRating: async (resourceId: string, rating: number, reviewText?: string): Promise<boolean> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Rating resource ${resourceId} with ${rating} stars and review: ${reviewText || 'none'}`);
        
        // Simulate successful API call
        resolve(true);
      }, 500);
    });
  },
  
  // Get all reviews for a resource
  getResourceReviews: async (resourceId: string): Promise<ResourceReview[]> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate random number of reviews (between 0 and 10)
        const reviewCount = Math.floor(Math.random() * 11);
        const reviews: ResourceReview[] = [];
        
        for (let i = 0; i < reviewCount; i++) {
          const rating = Math.floor(Math.random() * 5) + 1;
          
          reviews.push({
            id: `review-${i}-${resourceId}`,
            userId: `user-${i}`,
            userName: `User ${i}`,
            userAvatar: i % 3 === 0 ? `https://i.pravatar.cc/40?img=${i}` : undefined,
            resourceId: resourceId,
            rating: rating,
            reviewText: i % 2 === 0 ? `This is a sample review with a rating of ${rating} stars.` : undefined,
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 90 days
            helpful: i % 4 === 0 ? Math.floor(Math.random() * 20) : undefined,
            reported: i % 10 === 0 // 10% chance of being reported
          });
        }
        
        // Sort reviews by date (newest first)
        reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        resolve(reviews);
      }, 400);
    });
  },
  
  // Get detailed rating information for a resource
  getResourceRatingInfo: async (resourceId: string): Promise<ResourceRatingInfo> => {
    // In a real app, this would call the API endpoint
    return new Promise(resolve => {
      setTimeout(() => {
        // Generate random distribution
        const distribution: Record<number, number> = {
          1: Math.floor(Math.random() * 10),
          2: Math.floor(Math.random() * 15),
          3: Math.floor(Math.random() * 25),
          4: Math.floor(Math.random() * 35),
          5: Math.floor(Math.random() * 50)
        };
        
        // Calculate total and average
        let total = 0;
        let count = 0;
        
        for (let rating = 1; rating <= 5; rating++) {
          if (distribution[rating] !== undefined) {
            total += rating * distribution[rating];
            count += distribution[rating];
          }
        }
        
        const average = count > 0 ? total / count : 0;
        
        // 30% chance the current user has rated this resource
        const userRating = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : undefined;
        
        resolve({
          average: parseFloat(average.toFixed(1)),
          count,
          distribution,
          userRating
        });
      }, 300);
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
