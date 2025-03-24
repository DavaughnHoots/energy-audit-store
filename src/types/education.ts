// src/types/education.ts
export type ResourceType = 'article' | 'video' | 'infographic' | 'quiz' | 'calculator';
export type ResourceTopic = 'home-appliances' | 'insulation' | 'renewable-energy' | 'energy-management' | 'energy-saving' | 'smart-home';
export type ResourceLevel = 'beginner' | 'intermediate' | 'advanced';

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
