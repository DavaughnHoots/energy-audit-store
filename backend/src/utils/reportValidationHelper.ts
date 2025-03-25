import { AuditRecommendation } from '../types/energyAudit.js';
import { appLogger } from './logger.js';

/**
 * Helper utility for ensuring all recommendation data is valid
 * for display in reports
 */
export class ReportValidationHelper {
  /**
   * Validates and prepares recommendations for report display
   * 
   * @param recommendations The recommendations to validate
   * @returns Validated recommendations with defaults applied where needed
   */
  static validateRecommendations(recommendations: AuditRecommendation[]): AuditRecommendation[] {
    if (!recommendations || !Array.isArray(recommendations)) {
      appLogger.warn('Invalid recommendations array provided', { recommendations });
      return [];
    }

    return recommendations.map(rec => this.validateSingleRecommendation(rec));
  }

  /**
   * Validates a single recommendation
   * 
   * @param recommendation The recommendation to validate
   * @returns A validated recommendation with defaults applied where needed
   */
  static validateSingleRecommendation(recommendation: AuditRecommendation): AuditRecommendation {
    if (!recommendation) {
      appLogger.warn('Null or undefined recommendation provided');
      return this.createDefaultRecommendation();
    }

    // Create a copy to avoid modifying the original
    const validatedRec = { ...recommendation };

    // Ensure all financial fields have valid values
    if (typeof validatedRec.estimatedSavings !== 'number' || isNaN(validatedRec.estimatedSavings)) {
      appLogger.debug('Recommendation has invalid estimatedSavings', { 
        title: validatedRec.title,
        estimatedSavings: validatedRec.estimatedSavings
      });
      
      // Get a reasonable default based on the recommendation title or category
      validatedRec.estimatedSavings = this.getDefaultEstimatedSavings(validatedRec.title, validatedRec.description);
    }

    if (typeof validatedRec.estimatedCost !== 'number' || isNaN(validatedRec.estimatedCost)) {
      appLogger.debug('Recommendation has invalid estimatedCost', {
        title: validatedRec.title,
        estimatedCost: validatedRec.estimatedCost
      });
      
      // Get a reasonable default based on the recommendation title or category
      validatedRec.estimatedCost = this.getDefaultEstimatedCost(validatedRec.title, validatedRec.description);
    }

    if (typeof validatedRec.paybackPeriod !== 'number' || isNaN(validatedRec.paybackPeriod)) {
      // Calculate payback period from savings and cost if both are valid
      if (validatedRec.estimatedSavings > 0) {
        validatedRec.paybackPeriod = validatedRec.estimatedCost / validatedRec.estimatedSavings;
      } else {
        validatedRec.paybackPeriod = this.getDefaultPaybackPeriod(validatedRec.title, validatedRec.description);
      }
    }

    return validatedRec;
  }

  /**
   * Creates a default recommendation when none is provided
   * 
   * @returns A default recommendation
   */
  private static createDefaultRecommendation(): AuditRecommendation {
    return {
      id: `rec-${Date.now()}`,
      title: 'General Energy Efficiency Improvement',
      description: 'Implement general energy efficiency improvements.',
      priority: 'medium',
      status: 'active',
      estimatedSavings: 200,
      estimatedCost: 300,
      paybackPeriod: 1.5,
      actualSavings: null,
      implementationDate: null,
      implementationCost: null,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get a default estimated savings based on recommendation type
   * 
   * @param title Recommendation title
   * @param description Recommendation description
   * @returns Default estimated savings
   */
  private static getDefaultEstimatedSavings(title: string, description: string): number {
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    
    // Default savings by category
    if (titleLower.includes('insulation') || descLower.includes('insulation')) {
      return 350;
    } else if (titleLower.includes('hvac') || descLower.includes('hvac') || 
               titleLower.includes('heating') || descLower.includes('heating')) {
      return 450;
    } else if (titleLower.includes('light') || descLower.includes('light') ||
               titleLower.includes('bulb') || descLower.includes('bulb')) {
      return 200;
    } else if (titleLower.includes('window') || descLower.includes('window')) {
      return 300;
    } else if (titleLower.includes('air seal') || descLower.includes('air seal') ||
               titleLower.includes('draft') || descLower.includes('draft')) {
      return 180;
    } else if (titleLower.includes('thermostat') || descLower.includes('thermostat')) {
      return 120;
    }
    
    // Default value
    return 200;
  }

  /**
   * Get a default estimated cost based on recommendation type
   * 
   * @param title Recommendation title
   * @param description Recommendation description
   * @returns Default estimated cost
   */
  private static getDefaultEstimatedCost(title: string, description: string): number {
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    
    // Default costs by category
    if (titleLower.includes('insulation') || descLower.includes('insulation')) {
      return 1200;
    } else if (titleLower.includes('hvac') || descLower.includes('hvac')) {
      return 3500;
    } else if (titleLower.includes('light') || descLower.includes('light') ||
               titleLower.includes('bulb') || descLower.includes('bulb')) {
      return 120;
    } else if (titleLower.includes('window') || descLower.includes('window')) {
      return 3000;
    } else if (titleLower.includes('air seal') || descLower.includes('air seal')) {
      return 350;
    } else if (titleLower.includes('thermostat') || descLower.includes('thermostat')) {
      return 250;
    }
    
    // Default value
    return 500;
  }

  /**
   * Get a default payback period based on recommendation type
   * 
   * @param title Recommendation title
   * @param description Recommendation description
   * @returns Default payback period in years
   */
  private static getDefaultPaybackPeriod(title: string, description: string): number {
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    
    // Default payback by category (approximate years)
    if (titleLower.includes('insulation') || descLower.includes('insulation')) {
      return 3.5;
    } else if (titleLower.includes('hvac') || descLower.includes('hvac')) {
      return 8.0;
    } else if (titleLower.includes('light') || descLower.includes('light') ||
               titleLower.includes('bulb') || descLower.includes('bulb')) {
      return 0.6;
    } else if (titleLower.includes('window') || descLower.includes('window')) {
      return 10.0;
    } else if (titleLower.includes('air seal') || descLower.includes('air seal')) {
      return 2.0;
    } else if (titleLower.includes('thermostat') || descLower.includes('thermostat')) {
      return 2.1;
    }
    
    // Default value
    return 2.5;
  }
}
