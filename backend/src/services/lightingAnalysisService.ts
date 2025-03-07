import { appLogger } from '../config/logger.js';
import { LightingFixture } from '../types/energyAuditExtended.js';

/**
 * Constants for calculations (matching Python tool)
 */
const CONSTANTS = {
  LUMENS_PER_WATT_LED: 100 // Modern LED efficiency
};

/**
 * Perform lighting analysis (matching Python tool's _perform_lighting_analysis)
 * 
 * This function analyzes lighting system data and calculates various metrics:
 * - Fixture-specific consumption and efficiency
 * - Total energy consumption
 * - Average efficiency (lumens per watt)
 * - Annual consumption and cost projections
 * 
 * @param lightingData - Lighting data with fixture details
 * @returns Lighting analysis results with all calculated metrics
 */
export function performLightingAnalysis(lightingData: any) {
  appLogger.info('Performing lighting analysis');
  
  try {
    const lightingResults: any = {
      timestamp: new Date(),
      fixtures: {},
      total_consumption: 0,
      efficiency_metrics: {
        average_efficiency: 0,
        total_annual_consumption: 0,
        total_annual_cost: 0,
      },
    };
    
    // Check if we have valid lighting data
    if (!lightingData || !lightingData.fixtures || !lightingData.fixtures.length) {
      appLogger.warn('No lighting fixture data available for analysis');
      return lightingResults;
    }
    
    // Analyze each fixture
    for (const fixture of lightingData.fixtures) {
      // Validate required fields
      if (!fixture.name || !fixture.watts || !fixture.hours || !fixture.lumens) {
        continue;
      }
      
      const fixtureAnalysis = {
        consumption: fixture.watts * fixture.hours / 1000, // kWh
        efficiency: fixture.lumens / fixture.watts, // lm/W
        annual_cost: (
          fixture.watts * 
          fixture.hours * 
          (fixture.electricityRate || 0.12) / 
          1000
        ),
      };
      
      lightingResults.fixtures[fixture.name] = fixtureAnalysis;
      lightingResults.total_consumption += fixtureAnalysis.consumption;
    }
    
    // Calculate overall metrics if we have fixtures
    if (Object.keys(lightingResults.fixtures).length > 0) {
      const fixtures = lightingData.fixtures;
      const total_power = fixtures.reduce((sum: number, f: LightingFixture) => sum + f.watts, 0);
      const total_lumens = fixtures.reduce((sum: number, f: LightingFixture) => sum + f.lumens, 0);
      
      lightingResults.efficiency_metrics = {
        average_efficiency: total_power > 0 ? total_lumens / total_power : 0,
        total_annual_consumption: lightingResults.total_consumption * 365, // Annual consumption
        total_annual_cost: Object.values(lightingResults.fixtures).reduce(
          (sum: number, f: any) => sum + f.annual_cost, 0
        ) * 365, // Annual cost
      };
    }
    
    return lightingResults;
  } catch (error) {
    appLogger.error('Lighting analysis failed', { error });
    return {
      timestamp: new Date(),
      fixtures: {},
      total_consumption: 0,
      efficiency_metrics: {
        average_efficiency: 0,
        total_annual_consumption: 0,
        total_annual_cost: 0,
      },
    };
  }
}

/**
 * Estimate lighting savings based on audit data
 * 
 * @param lightingData - Lighting data
 * @returns Estimated annual savings in dollars
 */
export function estimateLightingSavings(lightingData: any) {
  try {
    // Perform lighting analysis to get current consumption
    const lightingResults = performLightingAnalysis(lightingData);
    const currentConsumption = lightingResults.total_consumption;
    const potentialImprovement = 0.30; // Assume 30% potential improvement with LED
    
    return currentConsumption * potentialImprovement * 0.12; // Assuming $0.12/kWh
  } catch (error) {
    appLogger.error('Error estimating lighting savings', { error });
    return 0;
  }
}

/**
 * Calculate lighting score based on analysis results
 * 
 * This function calculates a lighting efficiency score based on the average efficiency
 * of lighting fixtures (lumens per watt). The score is directly based on the average
 * efficiency, with 100 lm/W (typical LED efficiency) representing a perfect score.
 * 
 * @param lightingResults - Lighting analysis results
 * @returns Lighting efficiency score (0-100) or null if calculation fails
 */
export function calculateLightingScore(lightingResults: any): number | null {
  appLogger.debug('Calculating lighting score');
  
  try {
    // Validate required fields
    if (!lightingResults.efficiency_metrics || 
        lightingResults.efficiency_metrics.average_efficiency === undefined) {
      appLogger.warn('Missing required lighting efficiency metrics for scoring');
      return null;
    }
    
    // Extract average efficiency (lumens per watt)
    const avgEfficiency = lightingResults.efficiency_metrics.average_efficiency;
    appLogger.debug(`Lighting average efficiency: ${avgEfficiency} lm/W`);
    
    // Calculate score directly from average efficiency and ensure result is in 0-100 range
    // Note: 100 lm/W is considered excellent (LED standard)
    const score = Math.min(100, Math.max(0, avgEfficiency));
    
    appLogger.debug(`Final lighting score: ${score}`);
    return score;
  } catch (error) {
    appLogger.error('Lighting score calculation failed', { error });
    return null;
  }
}

/**
 * Generate lighting recommendations based on analysis
 * 
 * @param lightingData - Lighting data
 * @returns Array of lighting recommendations
 */
export function generateLightingRecommendations(lightingData: any) {
  const recommendations = [];
  
  try {
    // Perform lighting analysis
    const lightingResults = performLightingAnalysis(lightingData);
    
    // Check lighting efficiency
    if (lightingResults.efficiency_metrics.average_efficiency < 80) {
      recommendations.push({
        category: "lighting",
        priority: "medium",
        title: "Lighting System Upgrade",
        description: "Upgrade to more efficient lighting systems",
        estimated_savings: estimateLightingSavings(lightingData),
        implementation_cost: estimateImplementationCost("lighting_upgrade"),
        payback_period: null,
      });
    }
    
    // Check for inefficient fixtures
    const inefficientFixtures = Object.entries(lightingResults.fixtures)
      .filter(([_, fixture]: [string, any]) => fixture.efficiency < 50)
      .map(([name, _]: [string, any]) => name);
    
    if (inefficientFixtures.length > 0) {
      recommendations.push({
        category: "lighting",
        priority: "high",
        title: "Replace Inefficient Fixtures",
        description: `Replace inefficient fixtures: ${inefficientFixtures.join(', ')}`,
        estimated_savings: estimateLightingSavings(lightingData) * 0.7, // 70% of total potential savings
        implementation_cost: estimateImplementationCost("lighting_upgrade") * 0.6, // 60% of full upgrade cost
        payback_period: null,
      });
    }
    
    return recommendations;
  } catch (error) {
    appLogger.error('Error generating lighting recommendations', { error });
    return recommendations;
  }
}

/**
 * Estimate implementation cost for lighting upgrades
 * 
 * @param improvementType - Type of improvement
 * @returns Estimated implementation cost in dollars
 */
export function estimateImplementationCost(improvementType: string) {
  const costEstimates: Record<string, number> = {
    lighting_upgrade: 5000,
  };
  
  return costEstimates[improvementType] || 1000;
}
