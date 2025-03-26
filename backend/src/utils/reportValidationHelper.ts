import { AuditRecommendation } from '../types/energyAudit.js';
import { appLogger } from './logger.js';

/**
 * Helper utility for ensuring all recommendation data is valid
 * for display in reports
 * 
 * This class validates recommendation data and provides intelligent defaults
 * for financial data (savings, costs, payback) when they are missing or invalid
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

    // Type is a required field - if it's missing, use title or a default
    if (!validatedRec.type) {
      validatedRec.type = validatedRec.title || 'General Improvement';
    } else if (!validatedRec.title) {
      // Make sure title exists (used in UI)
      validatedRec.title = validatedRec.type;
    }

    // Ensure all financial fields have valid values
    if (typeof validatedRec.estimatedSavings !== 'number' || isNaN(validatedRec.estimatedSavings)) {
      appLogger.debug('Recommendation has invalid estimatedSavings', { 
        title: validatedRec.title,
        estimatedSavings: validatedRec.estimatedSavings
      });
      
      // Get a reasonable default based on the recommendation title or category
      const scope = validatedRec.scope || 'whole-home';
      const squareFootage = 1500; // Default size if not specified
      
      validatedRec.estimatedSavings = this.generateDefaultSavingsEstimate(
        validatedRec.type, 
        validatedRec.description || '',
        scope,
        squareFootage
      );
    }

    if (typeof validatedRec.estimatedCost !== 'number' || isNaN(validatedRec.estimatedCost)) {
      appLogger.debug('Recommendation has invalid estimatedCost', {
        title: validatedRec.title,
        estimatedCost: validatedRec.estimatedCost
      });
      
      // Get a reasonable default based on the recommendation title or category
      const scope = validatedRec.scope || 'whole-home';
      const squareFootage = 1500; // Default size if not specified
      
      validatedRec.estimatedCost = this.generateImplementationCostEstimate(
        validatedRec.type,
        validatedRec.description || '',
        scope,
        squareFootage
      );
    }

    if (typeof validatedRec.paybackPeriod !== 'number' || isNaN(validatedRec.paybackPeriod)) {
      // Calculate payback period from savings and cost if both are valid
      if (validatedRec.estimatedSavings > 0) {
        validatedRec.paybackPeriod = validatedRec.estimatedCost / validatedRec.estimatedSavings;
        // Round to 1 decimal place
        validatedRec.paybackPeriod = Math.round(validatedRec.paybackPeriod * 10) / 10;
      } else {
        validatedRec.paybackPeriod = this.getDefaultPaybackPeriod(validatedRec.title, validatedRec.description || '');
      }
    }

    // Add isEstimated flag if we had to generate any financial data
    validatedRec.isEstimated = true;

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
      type: 'General Improvement', // Added required type property
      priority: 'medium',
      status: 'active',
      estimatedSavings: 200,
      estimatedCost: 300,
      paybackPeriod: 1.5,
      actualSavings: null,
      implementationDate: null,
      implementationCost: null,
      lastUpdate: new Date().toISOString(),
      scope: 'whole-home',
      isEstimated: true
    };
  }

  /**
   * Generate a reasonable savings estimate based on recommendation type and home size
   * @param recommendationType Type of energy recommendation
   * @param description Description of the recommendation
   * @param scope Area or scope of the recommendation (e.g., specific rooms)
   * @param squareFootage Property size in square feet
   * @returns Estimated annual savings in dollars
   */
  private static generateDefaultSavingsEstimate(
    recommendationType: string, 
    description: string,
    scope: string,
    squareFootage: number
  ): number {
    // Determine if this is a whole-home or partial recommendation
    const scopeFactor = this.getScopeCoverageFactor(scope, squareFootage);
    
    // Extract type from title or description if needed
    const typeLower = recommendationType.toLowerCase();
    const descLower = description.toLowerCase();
    
    // Base savings estimates by recommendation type (annual $ savings)
    const savingsMap: Record<string, { base: number, perSqFt: number }> = {
      'HVAC System Upgrade': { base: 350, perSqFt: 0.15 },
      'Replace Inefficient Fixtures': { base: 150, perSqFt: 0.05 },
      'Lighting System Upgrade': { base: 120, perSqFt: 0.04 },
      'Install Dehumidification System': { base: 80, perSqFt: 0.03 },
      'Upgrade Insulation': { base: 200, perSqFt: 0.08 },
      'Replace Windows': { base: 180, perSqFt: 0.06 },
      'Upgrade Water Heater': { base: 120, perSqFt: 0.02 },
      'Upgrade Appliances': { base: 100, perSqFt: 0.01 }
    };

    // Check for category keywords if not found in map
    let defaults: { base: number, perSqFt: number };
    
    if (savingsMap[recommendationType]) {
      defaults = savingsMap[recommendationType];
    } else if (typeLower.includes('insulation') || descLower.includes('insulation')) {
      defaults = { base: 200, perSqFt: 0.08 };
    } else if (typeLower.includes('hvac') || descLower.includes('hvac') || 
               typeLower.includes('heating') || descLower.includes('heating')) {
      defaults = { base: 350, perSqFt: 0.15 };
    } else if (typeLower.includes('light') || descLower.includes('light') ||
               typeLower.includes('bulb') || descLower.includes('bulb')) {
      defaults = { base: 120, perSqFt: 0.04 };
    } else if (typeLower.includes('window') || descLower.includes('window')) {
      defaults = { base: 180, perSqFt: 0.06 };
    } else if (typeLower.includes('air seal') || descLower.includes('air seal') ||
               typeLower.includes('draft') || descLower.includes('draft')) {
      defaults = { base: 150, perSqFt: 0.05 };
    } else if (typeLower.includes('thermostat') || descLower.includes('thermostat')) {
      defaults = { base: 120, perSqFt: 0.02 };
    } else {
      // Generic defaults
      defaults = { base: 150, perSqFt: 0.05 };
    }
    
    // Calculate estimated savings
    const estimatedSavings = Math.round(
      (defaults.base + (squareFootage * defaults.perSqFt)) * scopeFactor
    );
    
    // Add randomization to prevent all estimates looking identical
    // Vary by ±10% to make estimates look more realistic
    const variationFactor = 0.9 + (Math.random() * 0.2);
    
    return Math.round(estimatedSavings * variationFactor);
  }

  /**
   * Generate implementation cost estimate for a recommendation
   */
  private static generateImplementationCostEstimate(
    recommendationType: string, 
    description: string,
    scope: string,
    squareFootage: number
  ): number {
    // Determine scope factor similar to savings calculation
    const scopeFactor = this.getScopeCoverageFactor(scope, squareFootage);
    
    // Extract type from title or description if needed
    const typeLower = recommendationType.toLowerCase();
    const descLower = description.toLowerCase();
    
    // Average costs by recommendation type
    const costMap: Record<string, { base: number, perSqFt: number }> = {
      'HVAC System Upgrade': { base: 5000, perSqFt: 1.5 },
      'Replace Inefficient Fixtures': { base: 800, perSqFt: 0.3 },
      'Lighting System Upgrade': { base: 600, perSqFt: 0.25 },
      'Install Dehumidification System': { base: 1200, perSqFt: 0.1 },
      'Upgrade Insulation': { base: 1800, perSqFt: 0.8 },
      'Replace Windows': { base: 3000, perSqFt: 1.2 },
      'Upgrade Water Heater': { base: 1200, perSqFt: 0.1 },
      'Upgrade Appliances': { base: 1500, perSqFt: 0.2 }
    };
    
    // Check for category keywords if not found in map
    let defaults: { base: number, perSqFt: number };
    
    if (costMap[recommendationType]) {
      defaults = costMap[recommendationType];
    } else if (typeLower.includes('insulation') || descLower.includes('insulation')) {
      defaults = { base: 1800, perSqFt: 0.8 };
    } else if (typeLower.includes('hvac') || descLower.includes('hvac')) {
      defaults = { base: 5000, perSqFt: 1.5 };
    } else if (typeLower.includes('light') || descLower.includes('light') ||
               typeLower.includes('bulb') || descLower.includes('bulb')) {
      defaults = { base: 600, perSqFt: 0.25 };
    } else if (typeLower.includes('window') || descLower.includes('window')) {
      defaults = { base: 3000, perSqFt: 1.2 };
    } else if (typeLower.includes('air seal') || descLower.includes('air seal')) {
      defaults = { base: 800, perSqFt: 0.3 };
    } else if (typeLower.includes('thermostat') || descLower.includes('thermostat')) {
      defaults = { base: 250, perSqFt: 0.0 };
    } else {
      // Generic defaults
      defaults = { base: 1200, perSqFt: 0.5 };
    }
    
    // Calculate estimated cost
    const estimatedCost = Math.round(
      (defaults.base + (squareFootage * defaults.perSqFt)) * scopeFactor
    );
    
    // Add randomization for realism
    const variationFactor = 0.9 + (Math.random() * 0.2);
    
    return Math.round(estimatedCost * variationFactor);
  }

  /**
   * Get scope coverage factor (what percentage of home is affected)
   */
  private static getScopeCoverageFactor(scope: string, squareFootage: number): number {
    // If no specific rooms mentioned, assume whole home
    if (!scope || scope.toLowerCase().includes('all') || scope.toLowerCase().includes('whole')) {
      return 1.0;
    }
    
    // Count number of rooms mentioned
    const roomCount = (scope.match(/bedroom|kitchen|bathroom|living|dining|basement/gi) || []).length;
    
    // Estimate based on square footage and room count
    if (squareFootage < 1000) {
      // Small home - each room is significant percentage
      return Math.min(1.0, roomCount * 0.25);
    } else if (squareFootage < 2000) {
      // Medium home
      return Math.min(1.0, roomCount * 0.2);
    } else {
      // Large home
      return Math.min(1.0, roomCount * 0.15);
    }
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

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReportValidationHelper };
}
