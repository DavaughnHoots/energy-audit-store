// src/types/education.ts
export type ResourceType = 'article' | 'video' | 'infographic' | 'quiz' | 'calculator';
export type ResourceTopic = 'home-appliances' | 'insulation' | 'renewable-energy' | 'energy-management' | 'energy-saving' | 'smart-home';
export type ResourceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ResourceContent {
  id: string;
  preview: string;
  content: string;
  videoUrl?: string;
  infographicUrl?: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  topic: ResourceTopic;
  level: ResourceLevel;
  readTime?: string;
  thumbnail: string;
  url: string;
  datePublished: string;
  featured: boolean;
  collectionIds: string[];
  tags: string[];
  popularity: number; // view count or engagement metric
  rating?: {
    average: number;
    count: number;
  };
  authorId?: string;
  relatedResourceIds?: string[];
  is_bookmarked?: boolean; // Whether the current user has bookmarked this resource
  progress?: ResourceProgress; // User's progress on this resource
  contentFile?: string; // Path to content file relative to /src/data/education/content
}

export interface ResourceProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  percentComplete: number;
  lastAccessed?: string;
}

export interface ResourceReview {
  id: string;
  userId: string;
  userName?: string; // Display name for the reviewer
  userAvatar?: string; // Avatar image URL
  resourceId: string;
  rating: number;
  reviewText?: string; // Optional text content
  createdAt: string;
  updatedAt?: string;
  helpful?: number; // Number of users who found this review helpful
  reported?: boolean; // Whether this review has been flagged
}

export interface ResourceRatingInfo {
  average: number;
  count: number;
  distribution?: Record<number, number>; // e.g., {1: 5, 2: 10, 3: 20, 4: 15, 5: 50}
  userRating?: number; // The current user's rating for this resource, if any
}

export interface ResourceCollection {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  resourceIds: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  steps: {
    stepNumber: number;
    resourceId: string;
    required: boolean;
  }[];
  level: ResourceLevel;
  estimatedCompletionTime: string;
}

export interface ResourceFilters {
  search: string;
  type: ResourceType | 'all';
  topic: ResourceTopic | 'all';
  level: ResourceLevel | 'all';
  sortBy: 'newest' | 'popular' | 'recommended';
}
