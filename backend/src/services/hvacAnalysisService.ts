import { appLogger } from '../config/logger.js';
import { ExtendedHeatingCooling } from '../types/energyAuditExtended.js';

/**
 * Constants for calculations (matching Python tool)
 */
const CONSTANTS = {
  AIR_DENSITY: 1.225, // kg/m³ at sea level and 15°C
  AIR_SPECIFIC_HEAT: 1005, // J/kg·K
};

/**
 * Perform HVAC analysis (matching Python tool's _perform_hvac_analysis)
 * 
 * This function analyzes HVAC system data and calculates various metrics:
 * - System efficiency: Current efficiency, target efficiency, and efficiency gap
 * - Energy consumption: Energy used by the HVAC system
 * - Heat transfer: Heat transfer through building surfaces (if surface data is provided)
 * 
 * @param hvacData - Extended HVAC data with heating/cooling system details
 * @returns HVAC analysis results with all calculated metrics
 */
export function performHvacAnalysis(hvacData: ExtendedHeatingCooling) {
  appLogger.info('Starting HVAC analysis');
  
  try {
    // Input validation
    if (!hvacData) {
      throw new Error('HVAC data is required');
    }
    
    if (!hvacData.heatingSystem || !hvacData.coolingSystem) {
      throw new Error('Heating and cooling system data is required');
    }
    
    // Initialize results object
    const hvacResults: any = {
      timestamp: new Date(),
      system_efficiency: {
        current_efficiency: Math.min(100, hvacData.heatingSystem.outputCapacity / Math.max(1, hvacData.heatingSystem.inputPower) * 100),
        target_efficiency: hvacData.heatingSystem.targetEfficiency,
        efficiency_gap: 0 // Will be calculated below
      },
      energy_consumption: calculateHvacEnergy(hvacData),
      heat_transfer: {} // Will be populated if surface data is available
    };
    
    appLogger.debug(`Current efficiency: ${hvacResults.system_efficiency.current_efficiency}%`);
    appLogger.debug(`Target efficiency: ${hvacResults.system_efficiency.target_efficiency}%`);
    
    // Calculate efficiency gap
    hvacResults.system_efficiency.efficiency_gap = (
      hvacResults.system_efficiency.target_efficiency -
      hvacResults.system_efficiency.current_efficiency
    );
    
    appLogger.debug(`Efficiency gap: ${hvacResults.system_efficiency.efficiency_gap}%`);
    
    // Calculate heat transfer for surfaces if data is available
    if (hvacData.surfaces && Array.isArray(hvacData.surfaces)) {
      for (const surface of hvacData.surfaces) {
        if (surface.name && surface.uValue && surface.area) {
          hvacResults.heat_transfer[surface.name] = calculateHeatTransfer(
            surface.uValue,
            surface.area,
            hvacData.temperatureDifference
          );
        }
      }
      
      appLogger.debug('Heat transfer calculated for surfaces', hvacResults.heat_transfer);
    }
    
    appLogger.info('HVAC analysis completed successfully');
    return hvacResults;
  } catch (error) {
    appLogger.error('HVAC analysis failed', { error });
    // Return a minimal valid result instead of throwing to prevent cascading failures
    return {
      timestamp: new Date(),
      system_efficiency: {
        current_efficiency: 0,
        target_efficiency: 0,
        efficiency_gap: 0
      },
      energy_consumption: 0,
      heat_transfer: {},
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate heat transfer for a surface (matching Python tool's _calculate_heat_transfer)
 * 
 * This function calculates the heat transfer through a surface using the formula:
 * Q = U * A * ΔT
 * where:
 * - Q is the heat transfer rate (W)
 * - U is the U-value (thermal transmittance) of the surface (W/m²K)
 * - A is the area of the surface (m²)
 * - ΔT is the temperature difference across the surface (K)
 * 
 * @param U - U-value (thermal transmittance) of the surface in W/m²K
 * @param A - Area of the surface in m²
 * @param deltaT - Temperature difference across the surface in K
 * @returns Heat transfer rate in Watts
 */
export function calculateHeatTransfer(U: number, A: number, deltaT: number): number {
  appLogger.debug(`Calculating heat transfer: U=${U}, A=${A}, deltaT=${deltaT}`);
  
  // Input validation
  if (U < 0 || A < 0) {
    appLogger.warn('Invalid U-value or area in heat transfer calculation');
    return 0;
  }
  
  // Calculate heat transfer
  const heatTransfer = U * A * Math.abs(deltaT);
  
  appLogger.debug(`Heat transfer result: ${heatTransfer} W`);
  return heatTransfer;
}

/**
 * Calculate HVAC energy consumption (matching Python tool's _calculate_hvac_energy)
 * 
 * This function calculates the energy consumption of an HVAC system using the formula:
 * E = (V * ρ * Cp * |ΔT|) / (η * 3600000)
 * where:
 * - E is the energy consumption (kWh)
 * - V is the volume of air (m³)
 * - ρ is the air density (kg/m³)
 * - Cp is the specific heat capacity of air (J/kg·K)
 * - ΔT is the temperature difference (K)
 * - η is the system efficiency (decimal)
 * - 3600000 is the conversion factor from J to kWh
 * 
 * @param hvacData - Extended HVAC data with system details
 * @returns Energy consumption in kWh
 */
export function calculateHvacEnergy(hvacData: ExtendedHeatingCooling) {
  appLogger.debug('Calculating HVAC energy consumption');
  
  try {
    // Input validation
    if (!hvacData) {
      throw new Error('HVAC data is required');
    }
    
    // Extract parameters with defaults
    const V = hvacData.heatingSystem.outputCapacity; // Using output capacity as volume proxy
    const rho = hvacData.airDensity || CONSTANTS.AIR_DENSITY;
    const Cp = hvacData.specificHeat || CONSTANTS.AIR_SPECIFIC_HEAT;
    const delta_T = hvacData.temperatureDifference;
    const eta = Math.max(0.1, hvacData.heatingSystem.efficiency / 100); // Convert percentage to decimal with minimum value
    
    appLogger.debug(`HVAC parameters: V=${V}, rho=${rho}, Cp=${Cp}, delta_T=${delta_T}, eta=${eta}`);
    
    // Calculate energy consumption
    const energyConsumption = (V * rho * Cp * Math.abs(delta_T)) / (eta * 3600000);
    
    appLogger.debug(`HVAC energy consumption: ${energyConsumption} kWh`);
    return energyConsumption;
  } catch (error) {
    appLogger.error('HVAC energy calculation failed', { error });
    return 0;
  }
}

/**
 * Estimate HVAC savings based on audit data
 * 
 * @param hvacData - HVAC data
 * @returns Estimated annual savings in dollars
 */
export function estimateHvacSavings(hvacData: ExtendedHeatingCooling) {
  try {
    // Perform HVAC analysis to get efficiency gap
    const hvacResults = performHvacAnalysis(hvacData);
    const efficiencyGap = hvacResults.system_efficiency.efficiency_gap;
    const currentConsumption = hvacResults.energy_consumption;
    
    return (efficiencyGap / 100) * currentConsumption * 0.12; // Assuming $0.12/kWh
  } catch (error) {
    appLogger.error('Error estimating HVAC savings', { error });
    return 0;
  }
}

/**
 * Calculate HVAC score based on analysis results
 * 
 * This function calculates an HVAC efficiency score based on the ratio of current system efficiency
 * to target efficiency. The score is scaled to a 0-100 range, where 100 represents meeting or
 * exceeding the target efficiency.
 * 
 * @param hvacResults - HVAC analysis results
 * @returns HVAC efficiency score (0-100) or null if calculation fails
 */
export function calculateHvacScore(hvacResults: any): number | null {
  appLogger.debug('Calculating HVAC score');
  
  try {
    // Validate required fields
    if (!hvacResults.system_efficiency || 
        !hvacResults.system_efficiency.current_efficiency || 
        !hvacResults.system_efficiency.target_efficiency ||
        hvacResults.system_efficiency.target_efficiency === 0) {
      appLogger.warn('Missing required HVAC efficiency values for scoring');
      return null;
    }
    
    // Extract efficiency values
    const efficiency = hvacResults.system_efficiency.current_efficiency;
    const target = hvacResults.system_efficiency.target_efficiency;
    
    appLogger.debug(`HVAC current efficiency: ${efficiency}%, target: ${target}%`);
    
    // Calculate score as percentage of target and ensure result is in 0-100 range
    const score = Math.min(100, Math.max(0, (efficiency / target) * 100));
    
    appLogger.debug(`Final HVAC score: ${score}`);
    return score;
  } catch (error) {
    appLogger.error('HVAC score calculation failed', { error });
    return null;
  }
}
