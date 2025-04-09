// src/data/education/index.ts
import { EducationalResource } from '@/types/education';
import { allResources } from './metadata';
import { loadContent } from './content';

/**
 * Education data module for accessing educational resources and content
 */

/**
 * Get all educational resources metadata
 */
export const getAllResources = (): EducationalResource[] => {
  return allResources;
};

/**
 * Get a specific educational resource by ID
 */
export const getResourceById = (id: string): EducationalResource | undefined => {
  return allResources.find(resource => resource.id === id);
};

/**
 * Get resources by topic
 */
export const getResourcesByTopic = (topic: string): EducationalResource[] => {
  return allResources.filter(resource => resource.topic === topic);
};

/**
 * Get featured resources
 */
export const getFeaturedResources = (): EducationalResource[] => {
  return allResources.filter(resource => resource.featured);
};

/**
 * Load the content for a specific resource
 */
export const getResourceContent = async (resourceId: string) => {
  const resource = getResourceById(resourceId);
  
  if (!resource) {
    throw new Error(`Resource not found: ${resourceId}`);
  }
  
  if (!resource.contentFile) {
    throw new Error(`Content file not specified for resource: ${resourceId}`);
  }
  
  return loadContent(resource.contentFile);
};

export default {
  getAllResources,
  getResourceById,
  getResourcesByTopic,
  getFeaturedResources,
  getResourceContent
};
