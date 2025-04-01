/**
 * Utility functions for financial calculations and consistent data handling
 * This ensures consistent financial calculations between frontend and backend
 */

import { AuditRecommendation } from '../types/energyAudit.js';

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
 * Calculate savings accuracy percentage by comparing actual vs. estimated savings
 * @param recommendations Array of recommendations (usually filtered to implemented ones)
 * @returns Savings accuracy percentage or null if no valid comparison can be made
 */
export const calculateSavingsAccuracy = (recommendations: AuditRecommendation[]): number | null => {
  // Filter to implemented recommendations with actual savings
  const implementedRecs = recommendations.filter(
    rec => rec.status === 'implemented' && typeof rec.actualSavings === 'number'
  );
  
  // Get totals
  const totalActual = calculateTotalActualSavings(implementedRecs);
  const totalEstimated = calculateTotalEstimatedSavings(implementedRecs);
  
  // Calculate accuracy only if we have valid values
  if (implementedRecs.length > 0 && totalEstimated > 0) {
    return (totalActual / totalEstimated) * 100;
  }
  
  return null;
};
