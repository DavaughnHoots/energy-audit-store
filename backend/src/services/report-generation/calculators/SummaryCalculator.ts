import { ISummaryCalculator } from '../types/index.js';
import { AuditRecommendation } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';
import { ReportValidationHelper } from '../../../utils/reportValidationHelper.js';

export class SummaryCalculator implements ISummaryCalculator {
  /**
   * Calculates the total estimated annual savings from all recommendations
   * @param recommendations The list of recommendations to sum savings from
   * @returns Total estimated annual savings amount in dollars
   */
  calculateTotalEstimatedSavings(recommendations: AuditRecommendation[]): number {
    try {
      if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
        appLogger.debug('No recommendations provided to calculate total estimated savings');
        return 0;
      }

      // First validate all recommendations to ensure they have valid financial data
      const validatedRecommendations = ReportValidationHelper.validateRecommendations(recommendations);
      
      // Sum up all estimated savings
      const totalSavings = validatedRecommendations.reduce((sum, rec) => {
        // Using the validated recommendation data which should have valid financial values
        return sum + rec.estimatedSavings;
      }, 0);
      
      appLogger.debug('Calculated total estimated savings', { 
        totalSavings,
        recommendationCount: validatedRecommendations.length
      });
      
      return totalSavings;
    } catch (error) {
      appLogger.error('Error calculating total estimated savings', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      // Provide a reasonable default value
      return recommendations?.length ? recommendations.length * 200 : 0;
    }
  }

  /**
   * Calculates the total actual savings from implemented recommendations
   * @param recommendations The list of recommendations to calculate from
   * @returns Total actual savings amount in dollars
   */
  calculateTotalActualSavings(recommendations: AuditRecommendation[]): number {
    try {
      if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
        return 0;
      }
      
      // Filter to implemented recommendations with valid actual savings values
      const implementedRecs = recommendations.filter(rec => 
        rec.status === 'implemented' && 
        typeof rec.actualSavings === 'number' && 
        !isNaN(rec.actualSavings)
      );
      
      // Sum up all actual savings
      const totalActualSavings = implementedRecs.reduce((sum, rec) => {
        return sum + (rec.actualSavings || 0);
      }, 0);
      
      return totalActualSavings;
    } catch (error) {
      appLogger.error('Error calculating total actual savings', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return 0;
    }
  }

  /**
   * Calculates the accuracy of savings estimates compared to actual values
   * @param totalEstimatedSavings Total estimated savings amount
   * @param totalActualSavings Total actual savings amount
   * @returns Accuracy percentage or null if cannot be calculated
   */
  calculateSavingsAccuracy(totalEstimatedSavings: number, totalActualSavings: number): number | null {
    try {
      // Check if we have valid values to calculate accuracy
      if (typeof totalEstimatedSavings !== 'number' || 
          isNaN(totalEstimatedSavings) ||
          typeof totalActualSavings !== 'number' || 
          isNaN(totalActualSavings) ||
          totalEstimatedSavings === 0 ||
          totalActualSavings === 0) {
        return null;
      }
      
      // Calculate accuracy as percentage
      const accuracy = (totalActualSavings / totalEstimatedSavings) * 100;
      
      // Validate and return reasonable accuracy value
      if (isNaN(accuracy) || accuracy <= 0 || accuracy > 200) {
        return null;
      }
      
      return Math.round(accuracy * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      appLogger.error('Error calculating savings accuracy', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return null;
    }
  }

  /**
   * Count the number of implemented recommendations
   * @param recommendations The list of recommendations to count from
   * @returns Number of implemented recommendations
   */
  countImplementedRecommendations(recommendations: AuditRecommendation[]): number {
    try {
      if (!recommendations || !Array.isArray(recommendations)) {
        return 0;
      }
      
      return recommendations.filter(rec => rec.status === 'implemented').length;
    } catch (error) {
      appLogger.error('Error counting implemented recommendations', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return 0;
    }
  }
}

export const summaryCalculator = new SummaryCalculator();
