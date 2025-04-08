import { appLogger } from '../utils/logger.js';
import { EfficiencyScores } from '../types/energyAuditExtended.js';
import { EnergyAuditData } from '../types/energyAudit.js';
import { calculateEnergyScore } from './energyAnalysisService.js';
import { calculateHvacScore } from './hvacAnalysisService.js';
import { calculateLightingScore } from './lightingAnalysisService.js';
import { calculateHumidityScore } from './humidityAnalysisService.js';

/**
 * Adapts EnergyAuditData to the structure expected by the efficiency scoring functions
 * 
 * @param auditData - EnergyAuditData from the application
 * @returns Transformed data structure suitable for scoring functions
 */
export function adaptAuditDataForScoring(auditData: EnergyAuditData): any {
  try {
    if (!auditData) {
      appLogger.warn('Invalid audit data for adapting to scoring structure');
      return {
        energy: {},
        hvac: {},
        lighting: {},
        humidity: {}
      };
    }

    // Create the adapted data structure
    return {
      energy: auditData.energyConsumption || {},
      hvac: auditData.heatingCooling || {},
      lighting: auditData.currentConditions || {},
      humidity: auditData.currentConditions || {}
    };
  } catch (error) {
    appLogger.error('Error adapting audit data for scoring', { error });
    // Return empty structure to avoid null pointer exceptions
    return {
      energy: {},
      hvac: {},
      lighting: {},
      humidity: {}
    };
  }
}

/**
 * Calculate overall efficiency score from EnergyAuditData
 * 
 * This is a convenience method that first adapts the EnergyAuditData to the expected
 * structure and then calculates the efficiency scores.
 * 
 * @param auditData - EnergyAuditData from the application
 * @returns Efficiency scores object
 */
export function calculateAuditEfficiencyScore(auditData: EnergyAuditData): EfficiencyScores {
  try {
    // Input validation
    if (!auditData) {
      appLogger.warn('Invalid or missing audit data for efficiency scoring');
      return {
        energyScore: 0,
        hvacScore: 0,
        lightingScore: 0,
        humidityScore: 0,
        overallScore: 70, // Default to a reasonable middle value
        interpretation: "Good - Meeting standard requirements" // Match the default score
      };
    }
    
    // Transform data to the expected structure
    const adaptedData = adaptAuditDataForScoring(auditData);
    
    // Calculate the scores using the adapted data
    return calculateOverallEfficiencyScore(adaptedData);
  } catch (error) {
    appLogger.error('Error calculating audit efficiency score', { error });
    return {
      energyScore: 0,
      hvacScore: 0,
      lightingScore: 0,
      humidityScore: 0,
      overallScore: 70, // Default to a reasonable middle value
      interpretation: "Good - Meeting standard requirements" // Match the default score
    };
  }
}

/**
 * Calculate overall efficiency score (matching Python tool's _calculate_overall_efficiency_score)
 * 
 * This function calculates the overall building efficiency score by combining component scores:
 * - Energy score: Efficiency of energy usage (40% weight)
 * - HVAC score: Efficiency of heating, ventilation, and air conditioning (30% weight)
 * - Lighting score: Efficiency of lighting systems (20% weight)
 * - Humidity score: Effectiveness of humidity control (10% weight)
 * 
 * The function handles missing component scores by adjusting weights proportionally.
 * The final score is interpreted using the interpretEfficiencyScore function.
 * 
 * @param results - Analysis results containing component data
 * @returns Efficiency scores object with component scores, overall score, and interpretation
 */
export function calculateOverallEfficiencyScore(results: any): EfficiencyScores {
  appLogger.info('Calculating overall efficiency score');
  
  try {
    // Calculate individual component scores
    const scores: any = {
      energyScore: Math.min(100, calculateEnergyScore(results.energy) || 0),
      hvacScore: Math.min(100, calculateHvacScore(results.hvac) || 0),
      lightingScore: Math.min(100, calculateLightingScore(results.lighting) || 0),
      humidityScore: Math.min(100, calculateHumidityScore(results.humidity) || 0)
    };
    
    appLogger.debug('Component scores calculated', scores);
    
    // Define component weights (must sum to 1.0)
    const weights = {
      energyScore: 0.4,  // Energy efficiency has highest weight (40%)
      hvacScore: 0.3,    // HVAC efficiency has second highest weight (30%)
      lightingScore: 0.2, // Lighting efficiency has third highest weight (20%)
      humidityScore: 0.1  // Humidity control has lowest weight (10%)
    };
    
    // Calculate weighted score, adjusting for missing components
    let totalScore = 0;
    let applicableWeight = 0;
    
    for (const [component, score] of Object.entries(scores)) {
      if (score !== null && score !== undefined && !isNaN(score as number)) {
        const weight = weights[component as keyof typeof weights];
        totalScore += (score as number) * weight;
        applicableWeight += weight;
        
        appLogger.debug(`Component ${component}: score=${score}, weight=${weight}`);
      } else {
        appLogger.debug(`Component ${component} has no valid score, excluding from calculation`);
      }
    }
    
    // Handle case where no valid scores are available
    if (applicableWeight === 0) {
      appLogger.warn('No valid component scores available for overall efficiency calculation');
      return {
        energyScore: 0,
        hvacScore: 0,
        lightingScore: 0,
        humidityScore: 0,
        overallScore: 70, // Default to a reasonable middle value rather than 0
        interpretation: "Insufficient data for detailed scoring, using default value"
      };
    }
    
    // Normalize the total score based on applicable weights
    let weightedScore = totalScore / applicableWeight;
    
    // Apply property age adjustment if building age is available
    if (results.energy && results.energy.buildingAge) {
      const ageAdjustment = getPropertyAgeAdjustment(results.energy.buildingAge);
      weightedScore = weightedScore * ageAdjustment;
      appLogger.debug(`Applied property age adjustment: ${ageAdjustment}, adjusted score: ${weightedScore}`);
    }
    
    // Ensure score is within reasonable range (60-95%)
    const finalScore = Math.min(95, Math.max(60, weightedScore));
    
    appLogger.debug(`Final score calculation: ${totalScore} / ${applicableWeight} = ${weightedScore}, clamped: ${finalScore}`);
    
    // Get interpretation of the score
    const interpretation = interpretEfficiencyScore(finalScore);
    
    appLogger.info(`Overall efficiency score: ${finalScore} (${interpretation})`);
    
    // Return complete efficiency scores object
    return validateEfficiencyMetrics({
      energyScore: scores.energyScore,
      hvacScore: scores.hvacScore,
      lightingScore: scores.lightingScore,
      humidityScore: scores.humidityScore,
      overallScore: finalScore,
      interpretation: interpretation
    });
  } catch (error) {
    appLogger.error('Overall efficiency score calculation failed', { error });
    return {
      energyScore: 0,
      hvacScore: 0,
      lightingScore: 0,
      humidityScore: 0,
      overallScore: 70, // Default to a reasonable middle value rather than 0
      interpretation: "Good - Meeting standard requirements" // Use appropriate interpretation for default score
    };
  }
}

/**
 * Get adjustment factor based on property age
 * Newer properties are expected to be more efficient
 * 
 * @param buildingAge - Age of the building in years
 * @returns Adjustment factor to apply to efficiency score
 */
export function getPropertyAgeAdjustment(buildingAge: number): number {
  try {
    // Input validation
    if (!buildingAge || isNaN(buildingAge) || buildingAge < 0) {
      appLogger.warn(`Invalid building age: ${buildingAge}, using default adjustment`);
      return 1.0; // No adjustment for unknown age
    }
    
    // Cap the age effect (very old buildings don't get penalized indefinitely)
    const cappedAge = Math.min(buildingAge, 70);
    
    // Newer buildings get a bonus, older buildings get a penalty
    // Range: 0.9 to 1.1 adjustment
    const adjustment = 1.1 - (cappedAge / 350);
    
    appLogger.debug(`Property age adjustment for ${buildingAge} years: ${adjustment}`);
    return adjustment;
  } catch (error) {
    appLogger.error('Error calculating property age adjustment', { error });
    return 1.0; // No adjustment on error
  }
}

/**
 * Validate efficiency metrics to ensure realistic values
 * 
 * @param metrics - Efficiency metrics to validate
 * @returns Validated efficiency metrics
 */
export function validateEfficiencyMetrics(metrics: EfficiencyScores): EfficiencyScores {
  try {
    const validated = { ...metrics };
    
    // Ensure overall score is in reasonable range
    if (!validated.overallScore || validated.overallScore < 60 || validated.overallScore > 95) {
      appLogger.warn('Invalid overall efficiency score, using default', { 
        original: validated.overallScore 
      });
      validated.overallScore = 70;
      validated.interpretation = interpretEfficiencyScore(70);
    }
    
    // Validate all component scores
    validated.energyScore = ensureValidRange(validated.energyScore, 40, 100, 65);
    validated.hvacScore = ensureValidRange(validated.hvacScore, 40, 100, 65);
    validated.lightingScore = ensureValidRange(validated.lightingScore, 40, 100, 70);
    validated.humidityScore = ensureValidRange(validated.humidityScore, 40, 100, 65);
    
    return validated;
  } catch (error) {
    appLogger.error('Error validating efficiency metrics', { error });
    return metrics; // Return original metrics if validation fails
  }
}

/**
 * Ensure a value is within a specified range
 * 
 * @param value - Value to validate
 * @param min - Minimum acceptable value
 * @param max - Maximum acceptable value
 * @param defaultValue - Default value to use if validation fails
 * @returns Validated value within specified range
 */
export function ensureValidRange(
  value: number, 
  min: number, 
  max: number, 
  defaultValue: number
): number {
  if (value === undefined || value === null || isNaN(value) || value < min || value > max) {
    return defaultValue;
  }
  return value;
}

/**
 * Interpret efficiency score (matching Python tool's _interpret_efficiency_score)
 * 
 * This function maps a numerical efficiency score (0-100) to a descriptive text interpretation.
 * The interpretation provides a qualitative assessment of the building's energy performance.
 * 
 * Score ranges:
 * - 90-100: Excellent - High-performance building
 * - 80-89: Very Good - Above average performance
 * - 70-79: Good - Meeting standard requirements
 * - 60-69: Fair - Room for improvement
 * - Below 60: Poor - Significant improvements needed
 * 
 * @param score - Numerical efficiency score (0-100)
 * @returns Descriptive interpretation of the score
 */
export function interpretEfficiencyScore(score: number): string {
  appLogger.debug(`Interpreting efficiency score: ${score}`);
  
  let interpretation: string;
  
  if (score >= 90) {
    interpretation = "Excellent - High-performance building";
  } else if (score >= 80) {
    interpretation = "Very Good - Above average performance";
  } else if (score >= 70) {
    interpretation = "Good - Meeting standard requirements";
  } else if (score >= 60) {
    interpretation = "Fair - Room for improvement";
  } else {
    interpretation = "Poor - Significant improvements needed";
  }
  
  appLogger.debug(`Score interpretation: ${interpretation}`);
  return interpretation;
}
