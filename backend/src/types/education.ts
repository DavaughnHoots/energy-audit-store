// backend/src/types/education.ts

export type ResourceType = 'article' | 'video' | 'infographic' | 'quiz' | 'calculator';
export type ResourceTopic = 'home-appliances' | 'insulation' | 'renewable-energy' | 'energy-management' | 'energy-saving' | 'smart-home';
export type ResourceLevel = 'beginner' | 'intermediate' | 'advanced';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface EducationalResource {
  id: number;
  title: string;
  description: string | null;
  type: ResourceType;
  topic: ResourceTopic;
  level: ResourceLevel;
  read_time: string | null;
  thumbnail_url: string | null;
  resource_url: string;
  date_published: string;
  is_featured: boolean;
  tags: string[] | null;
  popularity: number;
  created_at: string;
  updated_at: string;
  
  // Populated from related tables if requested
  average_rating?: number;
  rating_count?: number;
  is_bookmarked?: boolean;
  progress?: ResourceProgress;
}

export interface ResourceCollection {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  
  // Populated if requested
  resources?: EducationalResource[];
}

export interface ResourceBookmark {
  user_id: string; // UUID
  resource_id: number;
  created_at: string;
}

export interface ResourceProgress {
  user_id: string; // UUID
  resource_id: number;
  status: ProgressStatus;
  progress_percent: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceRating {
  id: number;
  user_id: string; // UUID
  resource_id: number;
  rating: number; // 1-5
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionResource {
  collection_id: number;
  resource_id: number;
  position: number;
}

// Query filters
export interface ResourceFilters {
  type?: ResourceType;
  topic?: ResourceTopic;
  level?: ResourceLevel;
  search?: string;
  featured?: boolean;
  tags?: string[];
  collection_id?: number;
  sort_by?: 'newest' | 'popular' | 'rating';
  limit?: number;
  offset?: number;
}

// Request/response types for API
export interface BookmarkRequest {
  resource_id: number;
}

export interface ProgressUpdateRequest {
  resource_id: number;
  status?: ProgressStatus;
  progress_percent?: number;
}

export interface RatingRequest {
  resource_id: number;
  rating: number;
  review?: string;
}
