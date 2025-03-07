import { appLogger } from '../config/logger.js';
import { ExtendedCurrentConditions } from '../types/energyAuditExtended.js';

/**
 * Perform humidity analysis (matching Python tool's _perform_humidity_analysis)
 * 
 * This function analyzes humidity data and calculates various metrics:
 * - Current humidity status (humidity ratio, dew point, vapor pressure)
 * - Humidity control requirements
 * - Dehumidification needs (if applicable)
 * 
 * @param currentConditions - Current conditions data with humidity information
 * @returns Humidity analysis results with all calculated metrics
 */
export function performHumidityAnalysis(currentConditions: ExtendedCurrentConditions) {
  appLogger.info('Performing humidity analysis');
  
  try {
    const humidityData = currentConditions.humidity;
    const homeDetails = currentConditions; // Assuming home details are available in current conditions
    
    const humidityResults: any = {
      requirements: {},
      recommendations: [],
      product_needs: {},
      current_status: analyzeCurrentHumidity(humidityData),
    };
    
    // Determine requirements
    humidityResults.requirements = determineHumidityRequirements(
      humidityData, 
      humidityResults.current_status
    );
    
    // Calculate dehumidification needs
    if (humidityResults.requirements.needs_dehumidification) {
      humidityResults.product_needs = calculateDehumidificationNeeds(
        homeDetails,
        humidityResults.current_status,
        humidityResults.requirements
      );
    }
    
    return humidityResults;
  } catch (error) {
    appLogger.error('Humidity analysis failed', { error });
    return {
      requirements: {},
      recommendations: [],
      product_needs: {},
      current_status: {
        current_humidity: 0,
        humidity_ratio: 0,
        dew_point: 0,
        vapor_pressure: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Analyze current humidity conditions (matching Python tool's _analyze_current_humidity)
 * 
 * @param humidityData - Humidity data
 * @returns Current humidity status
 */
export function analyzeCurrentHumidity(humidityData: any) {
  return {
    current_humidity: humidityData.currentHumidity,
    humidity_ratio: calculateHumidityRatio(humidityData),
    dew_point: calculateDewPoint(humidityData),
    vapor_pressure: calculateVaporPressure(humidityData),
  };
}

/**
 * Determine humidity control requirements (matching Python tool's _determine_humidity_requirements)
 * 
 * @param humidityData - Humidity data
 * @param currentStatus - Current humidity status
 * @returns Humidity control requirements
 */
export function determineHumidityRequirements(humidityData: any, currentStatus: any) {
  const targetHumidity = humidityData.targetHumidity;
  const currentHumidity = currentStatus.current_humidity;
  
  return {
    target_humidity: targetHumidity,
    humidity_gap: currentHumidity - targetHumidity,
    needs_dehumidification: currentHumidity > targetHumidity,
    needs_humidification: currentHumidity < targetHumidity,
    control_priority: determineHumidityPriority(currentHumidity, targetHumidity),
  };
}

/**
 * Calculate dehumidification needs (matching Python tool's _calculate_dehumidification_needs)
 * 
 * @param homeDetails - Home details
 * @param currentStatus - Current humidity status
 * @param requirements - Humidity control requirements
 * @returns Dehumidification needs
 */
export function calculateDehumidificationNeeds(homeDetails: any, currentStatus: any, requirements: any) {
  // Calculate volume from home dimensions if available
  const volume = homeDetails.wallLength * homeDetails.wallWidth * homeDetails.ceilingHeight;
  const humidityGap = requirements.humidity_gap;
  
  const capacityNeeded = calculateDehumidificationCapacity(
    volume,
    currentStatus.current_humidity,
    requirements.target_humidity
  );
  
  return {
    capacity_needed: capacityNeeded,
    recommended_capacity: capacityNeeded * 1.2, // 20% safety factor
    unit_size: determineUnitSize(capacityNeeded),
    estimated_runtime: estimateRuntime(capacityNeeded, humidityGap),
  };
}

/**
 * Calculate humidity ratio (matching Python tool's _calculate_humidity_ratio)
 * 
 * @param humidityData - Humidity data
 * @returns Humidity ratio
 */
export function calculateHumidityRatio(humidityData: any) {
  return humidityData.currentHumidity / 100;
}

/**
 * Calculate dew point (matching Python tool's _calculate_dew_point)
 * 
 * @param humidityData - Humidity data
 * @returns Dew point in degrees Celsius
 */
export function calculateDewPoint(humidityData: any) {
  // Simplified calculation - Magnus formula
  const T = humidityData.temperature;
  const RH = humidityData.currentHumidity;
  
  const a = 17.27;
  const b = 237.7;
  
  const alpha = ((a * T) / (b + T)) + Math.log(RH / 100.0);
  return (b * alpha) / (a - alpha);
}

/**
 * Calculate vapor pressure (matching Python tool's _calculate_vapor_pressure)
 * 
 * @param humidityData - Humidity data
 * @returns Vapor pressure in hPa
 */
export function calculateVaporPressure(humidityData: any) {
  // Simplified calculation
  const T = humidityData.temperature;
  const RH = humidityData.currentHumidity;
  
  // Saturation vapor pressure
  const es = 6.112 * Math.exp((17.67 * T) / (T + 243.5));
  
  // Actual vapor pressure
  return (RH / 100.0) * es;
}

/**
 * Calculate dehumidification capacity needs (matching Python tool's calculate_dehumidification_needs)
 * 
 * @param volume - Room volume in cubic meters
 * @param currentHumidity - Current humidity percentage
 * @param targetHumidity - Target humidity percentage
 * @returns Dehumidification capacity needed in pints per day
 */
export function calculateDehumidificationCapacity(volume: number, currentHumidity: number, targetHumidity: number) {
  // Simplified calculation - returns pints per day
  const humidityDifference = currentHumidity - targetHumidity;
  return humidityDifference <= 0 ? 0 : 0.0007 * volume * humidityDifference;
}

/**
 * Determine appropriate dehumidifier unit size (matching Python tool's _determine_unit_size)
 * 
 * @param capacityNeeded - Dehumidification capacity needed in pints per day
 * @returns Recommended unit size (small, medium, large)
 */
export function determineUnitSize(capacityNeeded: number) {
  if (capacityNeeded <= 30) {
    return "small";
  } else if (capacityNeeded <= 50) {
    return "medium";
  } else {
    return "large";
  }
}

/**
 * Estimate dehumidifier runtime (matching Python tool's _estimate_runtime)
 * 
 * @param capacityNeeded - Dehumidification capacity needed in pints per day
 * @param humidityGap - Difference between current and target humidity
 * @returns Estimated runtime in hours per day
 */
export function estimateRuntime(capacityNeeded: number, humidityGap: number) {
  // Simplified calculation - returns hours per day
  const baseRuntime = 8;
  if (humidityGap > 20) {
    return baseRuntime * 1.5;
  } else if (humidityGap > 10) {
    return baseRuntime * 1.2;
  }
  return baseRuntime;
}

/**
 * Determine humidity priority (matching Python tool's _determine_humidity_priority)
 * 
 * @param currentHumidity - Current humidity percentage
 * @param targetHumidity - Target humidity percentage
 * @returns Priority level (high, medium, low)
 */
export function determineHumidityPriority(currentHumidity: number, targetHumidity: number) {
  const humidityDifference = Math.abs(currentHumidity - targetHumidity);
  
  if (humidityDifference > 20) {
    return "high";
  } else if (humidityDifference > 10) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Estimate humidity control savings
 * 
 * @param humidityResults - Humidity analysis results
 * @returns Estimated annual savings in dollars
 */
export function estimateHumiditySavings(humidityResults: any) {
  try {
    if (!humidityResults || !humidityResults.requirements) {
      return 0;
    }
    
    const humidityGap = Math.abs(humidityResults.requirements.humidity_gap);
    const baseSavings = 200; // Base annual savings
    
    return baseSavings * (humidityGap / 10); // Scale by humidity gap
  } catch (error) {
    appLogger.error('Error estimating humidity savings', { error });
    return 0;
  }
}

/**
 * Generate humidity recommendations
 * 
 * @param currentConditions - Current conditions data
 * @returns Array of humidity recommendations
 */
export function generateHumidityRecommendations(currentConditions: ExtendedCurrentConditions) {
  const recommendations = [];
  
  try {
    const humidityData = currentConditions.humidity;
    
    // Perform humidity analysis
    const humidityResults = performHumidityAnalysis(currentConditions);
    
    if (humidityResults.requirements.needs_dehumidification) {
      const capacityNeeded = humidityResults.product_needs.capacity_needed;
      
      recommendations.push({
        category: "humidity",
        priority: humidityResults.requirements.control_priority,
        title: "Install Dehumidification System",
        description: `Install dehumidification system with ${capacityNeeded.toFixed(1)} pints/day capacity`,
        estimated_savings: estimateHumiditySavings(humidityResults),
        implementation_cost: estimateImplementationCost("humidity_control"),
        payback_period: null,
      });
    } else if (humidityResults.requirements.needs_humidification) {
      recommendations.push({
        category: "humidity",
        priority: humidityResults.requirements.control_priority,
        title: "Install Humidification System",
        description: "Install humidification system to maintain optimal humidity levels",
        estimated_savings: estimateHumiditySavings(humidityResults) * 0.8, // 80% of dehumidification savings
        implementation_cost: estimateImplementationCost("humidity_control") * 0.9, // 90% of dehumidification cost
        payback_period: null,
      });
    }
    
    return recommendations;
  } catch (error) {
    appLogger.error('Error generating humidity recommendations', { error });
    return recommendations;
  }
}

/**
 * Calculate humidity score
 * 
 * This function calculates a humidity control score based on the deviation from target humidity.
 * The score decreases as the deviation increases, with a factor of 2 points per percentage point
 * of deviation. A perfect score (100) means the current humidity exactly matches the target.
 * 
 * @param humidityResults - Humidity analysis results
 * @returns Humidity control score (0-100) or null if calculation fails
 */
export function calculateHumidityScore(humidityResults: any): number | null {
  appLogger.debug('Calculating humidity score');
  
  try {
    // Validate required fields
    if (!humidityResults.current_status || 
        !humidityResults.requirements ||
        humidityResults.current_status.current_humidity === undefined ||
        humidityResults.requirements.target_humidity === undefined) {
      appLogger.warn('Missing required humidity values for scoring');
      return null;
    }
    
    // Extract humidity values
    const current = humidityResults.current_status.current_humidity;
    const target = humidityResults.requirements.target_humidity;
    
    appLogger.debug(`Current humidity: ${current}%, target: ${target}%`);
    
    // Calculate deviation from target
    const deviation = Math.abs(current - target);
    appLogger.debug(`Humidity deviation: ${deviation}%`);
    
    // Calculate score by subtracting 2 points per percentage point of deviation
    // This means a 50% deviation would result in a score of 0
    const score = Math.min(100, Math.max(0, 100 - deviation * 2));
    
    appLogger.debug(`Final humidity score: ${score}`);
    return score;
  } catch (error) {
    appLogger.error('Humidity score calculation failed', { error });
    return null;
  }
}

/**
 * Estimate implementation cost for humidity control
 * 
 * @param improvementType - Type of improvement
 * @returns Estimated implementation cost in dollars
 */
export function estimateImplementationCost(improvementType: string) {
  const costEstimates: Record<string, number> = {
    humidity_control: 1200,
  };
  
  return costEstimates[improvementType] || 1000;
}
