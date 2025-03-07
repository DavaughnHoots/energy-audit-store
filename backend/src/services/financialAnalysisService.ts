import { appLogger } from '../config/logger.js';
import { FinancialAnalysis } from '../types/energyAuditExtended.js';

/**
 * Perform financial analysis (matching Python tool's _perform_financial_analysis)
 * 
 * This function analyzes the financial aspects of energy audit recommendations:
 * - Total investment required for all recommendations
 * - Annual savings potential from implementing recommendations
 * - Simple payback period (investment / annual savings)
 * - Return on investment (ROI)
 * - Component-specific financial analysis
 * 
 * @param results - Analysis results containing recommendations
 * @returns Financial analysis results
 */
export function performFinancialAnalysis(results: any): FinancialAnalysis {
  const financialResults: FinancialAnalysis = {
    totalInvestmentRequired: 0,
    annualSavingsPotential: 0,
    simplePaybackPeriod: 0,
    roi: 0,
    componentAnalysis: {},
  };
  
  try {
    // Analyze each component's financial impact
    if (results.recommendations) {
      const recommendations = results.recommendations;
      
      // Handle immediate actions
      if (recommendations.immediate_actions) {
        const categoryFinancials = analyzeCategoryFinancials(
          recommendations.immediate_actions
        );
        financialResults.componentAnalysis["immediate"] = categoryFinancials;
        financialResults.totalInvestmentRequired += categoryFinancials.investment;
        financialResults.annualSavingsPotential += categoryFinancials.annualSavings;
      }
      
      // Handle short term actions
      if (recommendations.short_term) {
        const categoryFinancials = analyzeCategoryFinancials(
          recommendations.short_term
        );
        financialResults.componentAnalysis["short_term"] = categoryFinancials;
        financialResults.totalInvestmentRequired += categoryFinancials.investment;
        financialResults.annualSavingsPotential += categoryFinancials.annualSavings;
      }
      
      // Handle long term actions
      if (recommendations.long_term) {
        const categoryFinancials = analyzeCategoryFinancials(
          recommendations.long_term
        );
        financialResults.componentAnalysis["long_term"] = categoryFinancials;
        financialResults.totalInvestmentRequired += categoryFinancials.investment;
        financialResults.annualSavingsPotential += categoryFinancials.annualSavings;
      }
    }
    
    // Calculate overall metrics
    if (financialResults.annualSavingsPotential > 0) {
      financialResults.simplePaybackPeriod = (
        financialResults.totalInvestmentRequired /
        financialResults.annualSavingsPotential
      );
      financialResults.roi = (
        financialResults.annualSavingsPotential /
        financialResults.totalInvestmentRequired
      ) * 100;
    }
    
    return financialResults;
  } catch (error) {
    appLogger.error('Financial analysis failed', { error });
    return financialResults;
  }
}

/**
 * Analyze category financials (matching Python tool's _analyze_category_financials)
 * 
 * This function analyzes the financial aspects of a specific category of recommendations:
 * - Total investment required for the category
 * - Annual savings potential from implementing the category
 * - Average payback period for the category
 * 
 * @param recommendations - Array of recommendations in the category
 * @returns Category financial analysis
 */
export function analyzeCategoryFinancials(recommendations: any[]) {
  try {
    if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
      return { investment: 0, annualSavings: 0, averagePayback: 0 };
    }
    
    const validRecommendations = recommendations.filter(rec => typeof rec === 'object' && rec !== null);
    
    const investment = validRecommendations.reduce(
      (sum, rec) => sum + (rec.implementation_cost || 0), 
      0
    );
    
    const annualSavings = validRecommendations.reduce(
      (sum, rec) => sum + (rec.estimated_savings || 0), 
      0
    );
    
    return {
      investment,
      annualSavings,
      averagePayback: calculateAveragePayback(validRecommendations),
    };
  } catch (error) {
    appLogger.error('Category financial analysis failed', { error });
    return { investment: 0, annualSavings: 0, averagePayback: 0 };
  }
}

/**
 * Calculate average payback period (matching Python tool's _calculate_average_payback)
 * 
 * This function calculates the average payback period for a set of recommendations:
 * - For each recommendation, calculate payback period (implementation cost / annual savings)
 * - Average the payback periods
 * 
 * @param recommendations - Array of recommendations
 * @returns Average payback period in years
 */
export function calculateAveragePayback(recommendations: any[]) {
  try {
    if (!recommendations || recommendations.length === 0) {
      return 0;
    }
    
    const validPaybacks = [];
    for (const rec of recommendations) {
      if (typeof rec !== 'object' || rec === null) {
        continue;
      }
      
      const implementationCost = rec.implementation_cost || 0;
      const annualSavings = rec.estimated_savings || 0;
      
      if (annualSavings > 0) {
        validPaybacks.push(implementationCost / annualSavings);
      }
    }
    
    return validPaybacks.length > 0 
      ? validPaybacks.reduce((sum, val) => sum + val, 0) / validPaybacks.length 
      : 0;
  } catch (error) {
    appLogger.error('Payback calculation failed', { error });
    return 0;
  }
}

/**
 * Calculate total savings (matching Python tool's _calculate_total_savings)
 * 
 * This function calculates the total savings potential across all recommendation categories:
 * - Energy savings
 * - HVAC savings
 * - Lighting savings
 * - Humidity control savings
 * 
 * @param recommendations - Recommendations object with immediate, short-term, and long-term actions
 * @returns Total savings by category
 */
export function calculateTotalSavings(recommendations: any) {
  const totalSavings: Record<string, number> = {
    energy: 0,
    hvac: 0,
    lighting: 0,
    humidity: 0
  };
  
  try {
    // Process immediate actions
    if (recommendations.immediate_actions) {
      for (const rec of recommendations.immediate_actions) {
        const category = rec.category || 'other';
        totalSavings[category] = (totalSavings[category] || 0) + (rec.estimated_savings || 0);
      }
    }
    
    // Process short-term actions
    if (recommendations.short_term) {
      for (const rec of recommendations.short_term) {
        const category = rec.category || 'other';
        totalSavings[category] = (totalSavings[category] || 0) + (rec.estimated_savings || 0);
      }
    }
    
    // Process long-term actions
    if (recommendations.long_term) {
      for (const rec of recommendations.long_term) {
        const category = rec.category || 'other';
        totalSavings[category] = (totalSavings[category] || 0) + (rec.estimated_savings || 0);
      }
    }
    
    // Calculate total across all categories
    totalSavings.total = Object.values(totalSavings).reduce((sum, val) => sum + val, 0);
    
    return totalSavings;
  } catch (error) {
    appLogger.error('Total savings calculation failed', { error });
    return { energy: 0, hvac: 0, lighting: 0, humidity: 0, total: 0 };
  }
}

/**
 * Estimate implementation cost for various improvement types
 * 
 * @param improvementType - Type of improvement
 * @returns Estimated implementation cost in dollars
 */
export function estimateImplementationCost(improvementType: string) {
  const costEstimates: Record<string, number> = {
    energy_management: 3000,
    seasonal_optimization: 1500,
    hvac_upgrade: 8000,
    lighting_upgrade: 5000,
    humidity_control: 1200,
  };
  
  return costEstimates[improvementType] || 1000;
}
