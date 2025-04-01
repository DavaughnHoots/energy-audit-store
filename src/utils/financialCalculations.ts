/**
 * Utility functions for financial calculations and consistent data handling
 * This ensures all components use the same approach for calculating financial values
 */

import { AuditRecommendation } from '../types/energyAudit';

/**
 * Get the implementation cost for a recommendation with consistent fallback approach
 * @param recommendation The recommendation object
 * @returns The cost value (implementation cost preferred, estimated cost as fallback, or 0)
 */
export const getRecommendationCost = (recommendation: AuditRecommendation): number => {
  // Prefer implementationCost, fallback to estimatedCost, default to 0
  return recommendation.implementationCost || recommendation.estimatedCost || 0;
};

/**
 * Get the estimated savings for a recommendation with validation
 * @param recommendation The recommendation object
 * @returns The validated savings value (or 0 if invalid)
 */
export const getRecommendationSavings = (recommendation: AuditRecommendation): number => {
  // Check if estimatedSavings is a valid number, default to 0 if not
  if (typeof recommendation.estimatedSavings !== 'number' || isNaN(recommendation.estimatedSavings)) {
    return 0;
  }
  return recommendation.estimatedSavings;
};

/**
 * Get the actual savings for a recommendation with validation
 * @param recommendation The recommendation object
 * @returns The validated actual savings value (or 0 if invalid)
 */
export const getActualSavings = (recommendation: AuditRecommendation): number => {
  // Check if actualSavings is a valid number, default to 0 if not
  if (typeof recommendation.actualSavings !== 'number' || isNaN(recommendation.actualSavings)) {
    return 0;
  }
  return recommendation.actualSavings;
};

/**
 * Calculate total estimated savings for multiple recommendations
 * @param recommendations Array of recommendations
 * @returns Total estimated savings
 */
export const calculateTotalEstimatedSavings = (recommendations: AuditRecommendation[]): number => {
  return recommendations.reduce((sum, recommendation) => 
    sum + getRecommendationSavings(recommendation), 0);
};

/**
 * Calculate total actual savings for multiple recommendations
 * @param recommendations Array of recommendations
 * @returns Total actual savings
 */
export const calculateTotalActualSavings = (recommendations: AuditRecommendation[]): number => {
  return recommendations.reduce((sum, recommendation) => 
    sum + getActualSavings(recommendation), 0);
};

/**
 * Format currency values consistently across the app
 * @param value The value to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | null | undefined): string => {
  // Check for undefined, null, or NaN
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'N/A';
  }
  
  // Convert string values to numbers if needed (API might return strings)
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Only return N/A if it's not a valid number after conversion
  if (isNaN(numValue)) return 'N/A';
  
  // Even zero is a valid value that should be displayed
  try {
    return `$${numValue.toLocaleString()}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${numValue}`;
  }
};

/**
 * Format percentage values consistently across the app
 * @param value The value to format
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | null | undefined): string => {
  // Check for undefined, null, or NaN
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'N/A';
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Format with one decimal place
  return `${numValue.toFixed(1)}%`;
};
