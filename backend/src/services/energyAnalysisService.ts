import { appLogger } from '../config/logger.js';
import { ExtendedEnergyConsumption } from '../types/energyAuditExtended.js';

/**
 * Constants for calculations (matching Python tool)
 */
const CONSTANTS = {
  EMISSION_FACTOR: 0.4, // kg CO2/kWh (example value, should be region-specific)
};

/**
 * Perform energy analysis (matching Python tool's _perform_energy_analysis)
 * 
 * This function analyzes energy consumption data and calculates various energy metrics:
 * - Base energy consumption (Ebase): The raw energy consumption without adjustments
 * - Seasonal adjusted energy (Eseasonal): Energy consumption adjusted for seasonal factors
 * - Occupancy adjusted energy (Eoccupied): Energy consumption adjusted for occupancy patterns
 * - Real energy consumption (Ereal): Final energy consumption adjusted with power factor
 * 
 * It also calculates efficiency metrics:
 * - Overall efficiency: Ratio of real to base energy consumption (as percentage)
 * - Seasonal impact: Percentage impact of seasonal factors on energy consumption
 * - Occupancy impact: Percentage impact of occupancy patterns on energy consumption
 * 
 * @param energyConsumption - Extended energy consumption data with seasonal, occupancy, and power factors
 * @returns Energy analysis results with all calculated metrics
 */
export function performEnergyAnalysis(energyConsumption: ExtendedEnergyConsumption) {
  appLogger.info('Starting energy analysis');
  
  try {
    // Input validation with detailed error messages
    if (!energyConsumption) {
      throw new Error('Energy consumption data is required');
    }
    
    if (energyConsumption.powerConsumption < 0) {
      throw new Error('Power consumption must be a positive value');
    }
    
    if (energyConsumption.durationHours < 0) {
      throw new Error('Duration hours must be a positive value');
    }
    
    if (energyConsumption.seasonalFactor < 0.8 || energyConsumption.seasonalFactor > 1.2) {
      appLogger.warn(`Seasonal factor out of range (0.8-1.2): ${energyConsumption.seasonalFactor}, will be clamped`);
    }
    
    if (energyConsumption.occupancyFactor < 0.6 || energyConsumption.occupancyFactor > 1.0) {
      appLogger.warn(`Occupancy factor out of range (0.6-1.0): ${energyConsumption.occupancyFactor}, will be clamped`);
    }
    
    if (energyConsumption.powerFactor < 0.8 || energyConsumption.powerFactor > 1.0) {
      appLogger.warn(`Power factor out of range (0.8-1.0): ${energyConsumption.powerFactor}, will be clamped`);
    }
    
    // Initialize results object with metadata
    const energyResults: any = {
      Ebase: energyConsumption.powerConsumption * energyConsumption.durationHours,
      timestamp: new Date(),
      input_parameters: {
        power_consumption: energyConsumption.powerConsumption,
        duration_hours: energyConsumption.durationHours,
        seasonal_factor_original: energyConsumption.seasonalFactor,
        occupancy_factor_original: energyConsumption.occupancyFactor,
        power_factor_original: energyConsumption.powerFactor
      }
    };
    
    appLogger.debug(`Base energy consumption: ${energyResults.Ebase} kWh`);
    
    // Calculate seasonal adjusted energy (limit the impact)
    const seasonalFactor = Math.max(0.8, Math.min(1.2, energyConsumption.seasonalFactor));
    energyResults.input_parameters.seasonal_factor_clamped = seasonalFactor;
    energyResults.Eseasonal = energyResults.Ebase * seasonalFactor;
    
    appLogger.debug(`Seasonal factor: ${seasonalFactor}, Seasonal adjusted energy: ${energyResults.Eseasonal} kWh`);
    
    // Calculate occupancy adjusted energy (limit the impact)
    const occupancyFactor = Math.max(0.6, Math.min(1.0, energyConsumption.occupancyFactor));
    energyResults.input_parameters.occupancy_factor_clamped = occupancyFactor;
    energyResults.Eoccupied = energyResults.Eseasonal * occupancyFactor;
    
    appLogger.debug(`Occupancy factor: ${occupancyFactor}, Occupancy adjusted energy: ${energyResults.Eoccupied} kWh`);
    
    // Calculate real energy consumption with power factor
    const powerFactor = Math.max(0.8, Math.min(1.0, energyConsumption.powerFactor));
    energyResults.input_parameters.power_factor_clamped = powerFactor;
    energyResults.Ereal = energyResults.Eoccupied * powerFactor;
    
    appLogger.debug(`Power factor: ${powerFactor}, Real energy consumption: ${energyResults.Ereal} kWh`);
    
    // Calculate efficiency metrics with reasonable limits
    const overallEfficiency = (energyResults.Ereal / energyResults.Ebase) * 100;
    const seasonalImpact = ((energyResults.Eseasonal - energyResults.Ebase) / energyResults.Ebase) * 100;
    const occupancyImpact = ((energyResults.Eoccupied - energyResults.Eseasonal) / energyResults.Eseasonal) * 100;
    
    // Calculate CO2 emissions based on energy consumption
    const emissionFactor = CONSTANTS.EMISSION_FACTOR; // kg CO2/kWh
    const emissions = energyResults.Ereal * emissionFactor;
    
    energyResults.efficiency_metrics = {
      overall_efficiency: Math.min(100, overallEfficiency),
      seasonal_impact: Math.min(20, Math.max(-20, seasonalImpact)),
      occupancy_impact: Math.min(20, Math.max(-20, occupancyImpact)),
      emissions: {
        total_co2: emissions, // kg CO2
        emission_factor: emissionFactor // kg CO2/kWh
      }
    };
    
    // Add potential improvement metrics
    const potentialImprovement = calculatePotentialEnergyImprovement(energyResults);
    energyResults.improvement_potential = potentialImprovement;
    
    appLogger.debug('Efficiency metrics calculated', energyResults.efficiency_metrics);
    appLogger.info('Energy analysis completed successfully');
    
    return energyResults;
  } catch (error) {
    appLogger.error('Energy analysis failed', { error });
    // Return a minimal valid result instead of throwing to prevent cascading failures
    return {
      Ebase: 0,
      Eseasonal: 0,
      Eoccupied: 0,
      Ereal: 0,
      timestamp: new Date(),
      efficiency_metrics: {
        overall_efficiency: 0,
        seasonal_impact: 0,
        occupancy_impact: 0,
        emissions: {
          total_co2: 0,
          emission_factor: CONSTANTS.EMISSION_FACTOR
        }
      },
      improvement_potential: {
        potential_savings_kwh: 0,
        potential_savings_percentage: 0,
        potential_emissions_reduction: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate potential energy improvement
 * 
 * This function calculates the potential energy savings based on current efficiency metrics.
 * It estimates how much energy could be saved by optimizing seasonal and occupancy factors.
 * 
 * @param energyResults - Current energy analysis results
 * @returns Potential improvement metrics
 */
export function calculatePotentialEnergyImprovement(energyResults: any) {
  try {
    // Calculate potential savings from optimizing seasonal impact
    const seasonalImpact = Math.abs(energyResults.efficiency_metrics.seasonal_impact);
    const seasonalSavingsPotential = seasonalImpact > 10 ? 
      (energyResults.Ereal * (seasonalImpact / 100) * 0.5) : 0; // 50% of impact could be saved
    
    // Calculate potential savings from optimizing occupancy impact
    const occupancyImpact = Math.abs(energyResults.efficiency_metrics.occupancy_impact);
    const occupancySavingsPotential = occupancyImpact > 10 ? 
      (energyResults.Ereal * (occupancyImpact / 100) * 0.6) : 0; // 60% of impact could be saved
    
    // Calculate total potential savings
    const totalPotentialSavings = seasonalSavingsPotential + occupancySavingsPotential;
    const potentialSavingsPercentage = (totalPotentialSavings / energyResults.Ereal) * 100;
    
    // Calculate potential emissions reduction
    const emissionFactor = CONSTANTS.EMISSION_FACTOR; // kg CO2/kWh
    const potentialEmissionsReduction = totalPotentialSavings * emissionFactor;
    
    return {
      potential_savings_kwh: totalPotentialSavings,
      potential_savings_percentage: potentialSavingsPercentage,
      potential_emissions_reduction: potentialEmissionsReduction,
      components: {
        seasonal_optimization: seasonalSavingsPotential,
        occupancy_optimization: occupancySavingsPotential
      }
    };
  } catch (error) {
    appLogger.error('Error calculating potential energy improvement', { error });
    return {
      potential_savings_kwh: 0,
      potential_savings_percentage: 0,
      potential_emissions_reduction: 0,
      components: {
        seasonal_optimization: 0,
        occupancy_optimization: 0
      }
    };
  }
}

/**
 * Estimate energy savings based on audit data
 * 
 * @param energyConsumption - Energy consumption data
 * @returns Estimated annual savings in dollars
 */
export function estimateEnergySavings(energyConsumption: ExtendedEnergyConsumption) {
  try {
    const currentConsumption = energyConsumption.powerConsumption * 
      energyConsumption.durationHours;
    const potentialImprovement = 0.15; // Assume 15% potential improvement
    
    return currentConsumption * potentialImprovement * 0.12; // Assuming $0.12/kWh
  } catch (error) {
    appLogger.error('Error estimating energy savings', { error });
    return 0;
  }
}

/**
 * Estimate seasonal energy savings based on audit data
 * 
 * @param energyConsumption - Energy consumption data
 * @returns Estimated annual savings in dollars
 */
export function estimateSeasonalSavings(energyConsumption: ExtendedEnergyConsumption) {
  try {
    // Perform energy analysis to get seasonal impact
    const energyResults = performEnergyAnalysis(energyConsumption);
    const seasonalImpact = Math.abs(energyResults.efficiency_metrics.seasonal_impact);
    const currentConsumption = energyResults.Ereal;
    
    return (seasonalImpact / 100) * currentConsumption * 0.12 * 0.5; // 50% of potential improvement
  } catch (error) {
    appLogger.error('Error estimating seasonal savings', { error });
    return 0;
  }
}

/**
 * Calculate energy score based on analysis results
 * 
 * This function calculates an energy efficiency score based on the ratio of real energy consumption
 * to base energy consumption. The score is scaled to a 0-100 range, where 100 represents perfect efficiency.
 * 
 * The formula applies a scaling factor of 1.5 to the efficiency gap to emphasize the importance of
 * energy efficiency in the overall score.
 * 
 * @param energyResults - Energy analysis results
 * @returns Energy efficiency score (0-100) or null if calculation fails
 */
export function calculateEnergyScore(energyResults: any): number | null {
  appLogger.debug('Calculating energy score');
  
  try {
    // Validate required fields
    if (!energyResults.Ereal || !energyResults.Ebase || energyResults.Ebase === 0) {
      appLogger.warn('Missing required energy values for scoring');
      return null;
    }
    
    // Calculate base efficiency as percentage
    const baseEfficiency = (energyResults.Ereal / energyResults.Ebase) * 100;
    appLogger.debug(`Base energy efficiency: ${baseEfficiency}%`);
    
    // Apply scaling factor and ensure result is in 0-100 range
    // Formula: 100 - (100 - baseEfficiency) * 1.5
    // This amplifies the penalty for inefficiency by 50%
    const score = Math.min(100, Math.max(0, 100 - (100 - baseEfficiency) * 1.5));
    
    appLogger.debug(`Final energy score: ${score}`);
    return score;
  } catch (error) {
    appLogger.error('Energy score calculation failed', { error });
    return null;
  }
}
