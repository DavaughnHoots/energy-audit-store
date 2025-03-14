import { pool } from '../../config/database.js';
import { appLogger } from '../../utils/logger.js';
import { 
  TimeSeriesPoint,
  CyclicalPattern,
  checkSeasonality, 
  detectAnomalies,
  detectTrendChangePoints,
  calculateAutocorrelation,
  findCyclicalPatterns,
  calculateLinearRegressionSlope
} from '../../utils/forecastingModels.js';
import { getRecords } from './basicOperations.js';
import {
  getBenchmarkData,
  calculatePercentileRanking,
  getReferenceConsumption
} from './benchmarkingService.js';
import { 
  PropertyNormalizationDetails, 
  BaselineCalculationResult,
  PatternIdentificationResult,
  ConsumptionAnalysis,
  ConsumptionAnomaly
} from '../../types/energyConsumption.js';

/**
 * Calculate baseline consumption for a user
 * @param userId The user ID
 * @param propertyDetails Optional property details for normalization
 * @param timeframe Optional timeframe for baseline calculation
 * @returns Baseline calculation result
 */
export async function calculateBaseline(
  userId: string, 
  propertyDetails?: PropertyNormalizationDetails,
  timeframe?: { start: Date, end: Date }
): Promise<BaselineCalculationResult> {
  try {
    // Set default timeframe to past year if not provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const start = timeframe?.start || defaultStart;
    const end = timeframe?.end || defaultEnd;
    
    // Get records for the timeframe
    const records = await getRecords(userId, start, end);
    
    if (records.length === 0) {
      throw new Error('Insufficient data for baseline calculation');
    }
    
    // Calculate raw baseline (average monthly usage)
    let totalElectricity = 0;
    let totalGas = 0;
    let totalWater = 0;
    let electricityCount = 0;
    let gasCount = 0;
    let waterCount = 0;
    
    // Also get property_id to use for data retrieval
    let propertyId: string | undefined;
    
    records.forEach(record => {
      // Get property_id from first record if available
      if (!propertyId && record.property_id) {
        propertyId = record.property_id;
      }
      
      if (record.electricity_usage !== null && record.electricity_usage !== undefined) {
        totalElectricity += record.electricity_usage;
        electricityCount++;
      }
      
      if (record.gas_usage !== null && record.gas_usage !== undefined) {
        totalGas += record.gas_usage;
        gasCount++;
      }
      
      if (record.water_usage !== null && record.water_usage !== undefined) {
        totalWater += record.water_usage;
        waterCount++;
      }
    });
    
    const baselineElectricity = electricityCount > 0 ? totalElectricity / electricityCount : 0;
    const baselineGas = gasCount > 0 ? totalGas / gasCount : 0;
    const baselineWater = waterCount > 0 ? totalWater / waterCount : 0;
    
    // Check for seasonality
    const hasEnoughDataForSeasonality = records.length >= 12;
    
    // Normalize by square footage if available
    const squareFootageAdjusted = propertyDetails?.squareFootage !== undefined && propertyDetails.squareFootage > 0;
    const occupancyAdjusted = propertyDetails?.occupants !== undefined && propertyDetails.occupants > 0;
    
    // Calculate normalized baselines
    let normalizedElectricity = baselineElectricity;
    let normalizedGas = baselineGas;
    let normalizedWater = baselineWater;
    
    if (squareFootageAdjusted) {
      normalizedElectricity = normalizedElectricity / propertyDetails!.squareFootage!;
      normalizedGas = normalizedGas / propertyDetails!.squareFootage!;
      // Water is typically not normalized by square footage, but by occupants
    }
    
    if (occupancyAdjusted) {
      // Electricity and gas are partially normalized by occupants (diminishing returns)
      // Using square root for diminishing returns - each additional person adds less
      const occupancyFactor = Math.sqrt(propertyDetails!.occupants!);
      normalizedElectricity = normalizedElectricity / occupancyFactor;
      normalizedGas = normalizedGas / occupancyFactor;
      normalizedWater = normalizedWater / propertyDetails!.occupants!; // Water fully normalized by occupants
    }
    
    // Get benchmark data for similar properties if property details are available
    let benchmarkData = null;
    let referenceBenchmark = null;
    let benchmarkAdjusted = false;
    
    if (propertyDetails && propertyDetails.propertyType) {
      try {
        // Try to get actual benchmark data from similar properties
        benchmarkData = await getBenchmarkData(propertyDetails, { start, end });
        
        // If not enough benchmark data, use reference values
        if (!benchmarkData) {
          referenceBenchmark = getReferenceConsumption(
            propertyDetails.propertyType,
            propertyDetails.squareFootage,
            propertyDetails.occupants
          );
        }
        
        benchmarkAdjusted = !!(benchmarkData || referenceBenchmark);
      } catch (e) {
        appLogger.warn('Failed to get benchmark data:', { 
          error: e instanceof Error ? e.message : String(e),
          userId
        });
        // Continue without benchmark data
      }
    }
    
    // Adjust baselines with benchmark data if available
    if (benchmarkData) {
      // Compare user's normalized consumption with similar properties
      // If user's normalized value is very different from benchmark median,
      // adjust the baseline towards the benchmark
      const adjustWeight = 0.3; // How much weight to give to benchmark data vs. user data
      
      if (electricityCount > 0 && benchmarkData.electricity.median > 0) {
        const ratio = normalizedElectricity / benchmarkData.electricity.median;
        // Only adjust if significantly different (50% or more)
        if (ratio < 0.5 || ratio > 1.5) {
          normalizedElectricity = normalizedElectricity * (1 - adjustWeight) + 
            benchmarkData.electricity.median * adjustWeight;
        }
      }
      
      if (gasCount > 0 && benchmarkData.gas.median > 0) {
        const ratio = normalizedGas / benchmarkData.gas.median;
        if (ratio < 0.5 || ratio > 1.5) {
          normalizedGas = normalizedGas * (1 - adjustWeight) + 
            benchmarkData.gas.median * adjustWeight;
        }
      }
      
      if (waterCount > 0 && benchmarkData.water.median > 0) {
        const ratio = normalizedWater / benchmarkData.water.median;
        if (ratio < 0.5 || ratio > 1.5) {
          normalizedWater = normalizedWater * (1 - adjustWeight) + 
            benchmarkData.water.median * adjustWeight;
        }
      }
    } 
    // Use reference data if no benchmark data but property type is known
    else if (referenceBenchmark) {
      // If user has very little data, rely more on reference values
      const lowDataThreshold = 3; // Less than 3 records is considered low data
      const adjustWeight = electricityCount <= lowDataThreshold ? 0.7 : 0.2;
      
      if (electricityCount === 0) {
        normalizedElectricity = referenceBenchmark.electricity;
      } else if (electricityCount <= lowDataThreshold) {
        normalizedElectricity = normalizedElectricity * (1 - adjustWeight) + 
          referenceBenchmark.electricity * adjustWeight;
      }
      
      if (gasCount === 0) {
        normalizedGas = referenceBenchmark.gas;
      } else if (gasCount <= lowDataThreshold) {
        normalizedGas = normalizedGas * (1 - adjustWeight) + 
          referenceBenchmark.gas * adjustWeight;
      }
      
      if (waterCount === 0) {
        normalizedWater = referenceBenchmark.water;
      } else if (waterCount <= lowDataThreshold) {
        normalizedWater = normalizedWater * (1 - adjustWeight) + 
          referenceBenchmark.water * adjustWeight;
      }
    }
    
    // Convert normalized values back to absolute values if needed
    let adjustedBaselineElectricity = normalizedElectricity;
    let adjustedBaselineGas = normalizedGas;
    let adjustedBaselineWater = normalizedWater;
    
    // Re-apply the normalization factors in reverse to get adjusted absolute values
    if (squareFootageAdjusted) {
      adjustedBaselineElectricity *= propertyDetails!.squareFootage!;
      adjustedBaselineGas *= propertyDetails!.squareFootage!;
    }
    
    if (occupancyAdjusted) {
      const occupancyFactor = Math.sqrt(propertyDetails!.occupants!);
      adjustedBaselineElectricity *= occupancyFactor;
      adjustedBaselineGas *= occupancyFactor;
      adjustedBaselineWater *= propertyDetails!.occupants!;
    }
    
    // Calculate percentile rankings if benchmark data available
    let electricityPercentile: number | null = null;
    let gasPercentile: number | null = null;
    let waterPercentile: number | null = null;
    
    if (benchmarkData) {
      electricityPercentile = calculatePercentileRanking(normalizedElectricity, benchmarkData, 'electricity');
      gasPercentile = calculatePercentileRanking(normalizedGas, benchmarkData, 'gas');
      waterPercentile = calculatePercentileRanking(normalizedWater, benchmarkData, 'water');
    }
    
    // Calculate confidence score (0-1) based on data quantity and quality
    const monthSpan = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30); // Approximate months
    const dataCompleteness = Math.min(1, records.length / monthSpan);
    
    // Higher confidence with more normalization factors and more data
    let confidenceScore = 0.5 * dataCompleteness;
    if (squareFootageAdjusted) confidenceScore += 0.15;
    if (occupancyAdjusted) confidenceScore += 0.15;
    if (benchmarkAdjusted) confidenceScore += 0.1;
    if (hasEnoughDataForSeasonality) confidenceScore += 0.1;
    
    // Cap at 1.0
    confidenceScore = Math.min(1.0, confidenceScore);
    
    appLogger.info(`Calculated baseline consumption for user ${userId}`);
    
    return {
      electricity: {
        baseline: baselineElectricity,
        normalizedBaseline: normalizedElectricity,
        adjustedBaseline: adjustedBaselineElectricity,
        seasonalAdjusted: hasEnoughDataForSeasonality,
        squareFootageAdjusted,
        occupancyAdjusted,
        benchmarkAdjusted,
        percentileRanking: electricityPercentile
      },
      gas: {
        baseline: baselineGas,
        normalizedBaseline: normalizedGas,
        adjustedBaseline: adjustedBaselineGas,
        seasonalAdjusted: hasEnoughDataForSeasonality,
        squareFootageAdjusted,
        occupancyAdjusted,
        benchmarkAdjusted,
        percentileRanking: gasPercentile
      },
      water: {
        baseline: baselineWater,
        normalizedBaseline: normalizedWater,
        adjustedBaseline: adjustedBaselineWater,
        seasonalAdjusted: hasEnoughDataForSeasonality,
        squareFootageAdjusted,
        occupancyAdjusted,
        benchmarkAdjusted,
        percentileRanking: waterPercentile
      },
      timeframe: {
        start,
        end
      },
      confidenceScore,
      propertyDetails: propertyDetails
    };
  } catch (error) {
    appLogger.error('Error calculating baseline consumption:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId
    });
    throw new Error(`Failed to calculate baseline consumption: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Identify patterns in energy consumption data
 * @param userId The user ID
 * @param timeframe Optional timeframe for pattern analysis
 * @param propertyId Optional property ID filter
 * @returns Pattern identification result
 */
export async function identifyPatterns(
  userId: string,
  timeframe?: { start: Date, end: Date },
  propertyId?: string
): Promise<PatternIdentificationResult> {
  try {
    // Set default timeframe to past year if not provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const start = timeframe?.start || defaultStart;
    const end = timeframe?.end || defaultEnd;
    
    // Get records for the timeframe
    const records = await getRecords(userId, start, end, propertyId);
    
    if (records.length < 3) {
      throw new Error('Insufficient data for pattern identification');
    }
    
    // Prepare data for seasonality check
    const electricityData: TimeSeriesPoint[] = [];
    const gasData: TimeSeriesPoint[] = [];
    const waterData: TimeSeriesPoint[] = [];
    
    records.forEach(record => {
      if (record.electricity_usage !== null && record.electricity_usage !== undefined) {
        electricityData.push({
          date: new Date(record.record_date),
          value: record.electricity_usage
        });
      }
      
      if (record.gas_usage !== null && record.gas_usage !== undefined) {
        gasData.push({
          date: new Date(record.record_date),
          value: record.gas_usage
        });
      }
      
      if (record.water_usage !== null && record.water_usage !== undefined) {
        waterData.push({
          date: new Date(record.record_date),
          value: record.water_usage
        });
      }
    });
    
    // Sort data by date for analysis
    electricityData.sort((a, b) => a.date.getTime() - b.date.getTime());
    gasData.sort((a, b) => a.date.getTime() - b.date.getTime());
    waterData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Check for seasonality - need at least 2 years of data for good check
    // If not enough data, use a lower period
    const period = records.length >= 24 ? 12 : Math.min(4, Math.floor(records.length / 2));
    
    let electricitySeasonality = 0;
    let gasSeasonality = 0;
    let waterSeasonality = 0;
    
    try {
      if (electricityData.length >= period * 2) {
        electricitySeasonality = checkSeasonality(electricityData, period);
      }
    } catch (e) {
      appLogger.warn(`Error checking electricity seasonality: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    try {
      if (gasData.length >= period * 2) {
        gasSeasonality = checkSeasonality(gasData, period);
      }
    } catch (e) {
      appLogger.warn(`Error checking gas seasonality: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    try {
      if (waterData.length >= period * 2) {
        waterSeasonality = checkSeasonality(waterData, period);
      }
    } catch (e) {
      appLogger.warn(`Error checking water seasonality: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Determine if seasonality is significant (correlation > 0.3)
    const hasSeasonality = 
      electricitySeasonality > 0.3 || 
      gasSeasonality > 0.3 || 
      waterSeasonality > 0.3;
    
    // Detect cyclical patterns
    const electricityCyclicalPatterns: CyclicalPattern[] = [];
    const gasCyclicalPatterns: CyclicalPattern[] = [];
    const waterCyclicalPatterns: CyclicalPattern[] = [];
    
    try {
      if (electricityData.length >= 8) { // Need enough data for pattern detection
        electricityCyclicalPatterns.push(...findCyclicalPatterns(electricityData, undefined, 0.3));
      }
    } catch (e) {
      appLogger.warn(`Error detecting electricity cyclical patterns: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    try {
      if (gasData.length >= 8) {
        gasCyclicalPatterns.push(...findCyclicalPatterns(gasData, undefined, 0.3));
      }
    } catch (e) {
      appLogger.warn(`Error detecting gas cyclical patterns: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    try {
      if (waterData.length >= 8) {
        waterCyclicalPatterns.push(...findCyclicalPatterns(waterData, undefined, 0.3));
      }
    } catch (e) {
      appLogger.warn(`Error detecting water cyclical patterns: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Identify trend change points
    const electricityChangePoints: TimeSeriesPoint[] = [];
    const gasChangePoints: TimeSeriesPoint[] = [];
    const waterChangePoints: TimeSeriesPoint[] = [];
    
    try {
      if (electricityData.length >= 10) { // Need enough data for change point detection
        electricityChangePoints.push(...detectTrendChangePoints(electricityData));
      }
    } catch (e) {
      appLogger.warn(`Error detecting electricity trend changes: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    try {
      if (gasData.length >= 10) {
        gasChangePoints.push(...detectTrendChangePoints(gasData));
      }
    } catch (e) {
      appLogger.warn(`Error detecting gas trend changes: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    try {
      if (waterData.length >= 10) {
        waterChangePoints.push(...detectTrendChangePoints(waterData));
      }
    } catch (e) {
      appLogger.warn(`Error detecting water trend changes: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Enhanced trend detection using linear regression slopes
    const electricityTrend = calculateEnhancedTrend(electricityData);
    const gasTrend = calculateEnhancedTrend(gasData);
    const waterTrend = calculateEnhancedTrend(waterData);
    
    // Determine overall trend
    const trendValues: Record<string, number> = {
      'increasing': 1,
      'stable': 0,
      'decreasing': -1
    };
    
    const trendSum = 
      (trendValues[electricityTrend] || 0) + 
      (trendValues[gasTrend] || 0) + 
      (trendValues[waterTrend] || 0);
    
    let overallTrend: string;
    
    if (trendSum > 0) {
      overallTrend = 'increasing';
    } else if (trendSum < 0) {
      overallTrend = 'decreasing';
    } else {
      overallTrend = 'stable';
    }
    
    // Analyze for day/night patterns if data has enough granularity
    // Note: This works best with hourly data, which may not be available
    // For now, we'll rely on simple daily patterns if available
    let dayNightAvailable = false;
    let dayNightRatio = 0;
    let dayHeavy = false;
    
    // Analyze for weekday/weekend patterns
    let weekdayWeekendAvailable = false;
    let weekdayWeekendRatio = 0;
    let weekdayHeavy = false;
    
    // Check if we have daily data
    if (electricityData.length >= 14) { // At least 2 weeks of data
      try {
        // Group data by day of week (0 = Sunday, 6 = Saturday)
        const dayGrouped: Record<number, number[]> = {
          0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
        };
        
        electricityData.forEach(point => {
          const dayOfWeek = point.date.getDay();
          dayGrouped[dayOfWeek].push(point.value);
        });
        
        // Calculate averages for weekdays and weekend
        const weekdayValues: number[] = [];
        for (let day = 1; day <= 5; day++) {
          if (dayGrouped[day].length > 0) {
            const avg = dayGrouped[day].reduce((sum, val) => sum + val, 0) / dayGrouped[day].length;
            weekdayValues.push(avg);
          }
        }
        
        const weekendValues: number[] = [];
        [0, 6].forEach(day => {
          if (dayGrouped[day].length > 0) {
            const avg = dayGrouped[day].reduce((sum, val) => sum + val, 0) / dayGrouped[day].length;
            weekendValues.push(avg);
          }
        });
        
        // Calculate weekday and weekend averages
        if (weekdayValues.length > 0 && weekendValues.length > 0) {
          const weekdayAvg = weekdayValues.reduce((sum, val) => sum + val, 0) / weekdayValues.length;
          const weekendAvg = weekendValues.reduce((sum, val) => sum + val, 0) / weekendValues.length;
          
          if (weekdayAvg > 0 && weekendAvg > 0) {
            weekdayWeekendRatio = weekdayAvg / weekendAvg;
            weekdayHeavy = weekdayAvg > weekendAvg;
            weekdayWeekendAvailable = true;
          }
        }
      } catch (e) {
        appLogger.warn(`Error analyzing weekday/weekend patterns: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    
    appLogger.info(`Identified consumption patterns for user ${userId}`);
    
    return {
      seasonal: {
        electricity: electricitySeasonality,
        gas: gasSeasonality,
        water: waterSeasonality,
        hasSeasonality
      },
      cyclicalPatterns: {
        electricity: electricityCyclicalPatterns,
        gas: gasCyclicalPatterns,
        water: waterCyclicalPatterns
      },
      trendChangePoints: {
        electricity: electricityChangePoints,
        gas: gasChangePoints,
        water: waterChangePoints
      },
      dayNight: {
        available: dayNightAvailable,
        ratio: dayNightRatio,
        dayHeavy: dayHeavy
      },
      weekdayWeekend: {
        available: weekdayWeekendAvailable,
        ratio: weekdayWeekendRatio,
        weekdayHeavy: weekdayHeavy
      },
      trend: {
        electricity: electricityTrend,
        gas: gasTrend,
        water: waterTrend,
        overallTrend
      }
    };
  } catch (error) {
    appLogger.error('Error identifying consumption patterns:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId
    });
    throw new Error(`Failed to identify consumption patterns: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Enhanced method to calculate trend from time series data using linear regression
 * @param data Time series data points
 * @returns Trend description ("increasing", "decreasing", or "stable")
 */
function calculateEnhancedTrend(data: TimeSeriesPoint[]): string {
  if (data.length < 4) {
    return calculateSimpleTrend(data); // Fall back to simple trend for small datasets
  }
  
  try {
    // Calculate linear regression slope
    const slope = calculateLinearRegressionSlope(data);
    
    // Calculate average value for context
    const avgValue = data.reduce((sum, point) => sum + point.value, 0) / data.length;
    
    // Normalize slope by average value for percentage interpretation
    const normalizedSlope = avgValue !== 0 ? slope / avgValue : 0;
    
    // Classify trend based on normalized slope
    // Using stricter thresholds for the enhanced method
    if (normalizedSlope > 0.05) {
      return 'increasing';
    } else if (normalizedSlope < -0.05) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  } catch (e) {
    // Fall back to simple trend calculation if the enhanced method fails
    appLogger.warn(`Error calculating enhanced trend: ${e instanceof Error ? e.message : String(e)}`);
    return calculateSimpleTrend(data);
  }
}

/**
 * Simple method to calculate trend from time series data
 * @param data Time series data points
 * @returns Trend description ("increasing", "decreasing", or "stable")
 */
function calculateSimpleTrend(data: TimeSeriesPoint[]): string {
  if (data.length < 2) {
    return 'stable'; // Not enough data to determine trend
  }
  
  // Use first and last 3 points (or fewer if less data)
  const startPoints = data.slice(0, Math.min(3, data.length));
  const endPoints = data.slice(Math.max(0, data.length - 3));
  
  const startAvg = startPoints.reduce((sum, point) => sum + point.value, 0) / startPoints.length;
  const endAvg = endPoints.reduce((sum, point) => sum + point.value, 0) / endPoints.length;
  
  // Calculate percent change
  const percentChange = startAvg !== 0
    ? (endAvg - startAvg) / startAvg
    : 0;
  
  // Classify trend based on percent change
  if (percentChange > 0.1) {
    return 'increasing';
  } else if (percentChange < -0.1) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Detect anomalies in consumption data with improved contextual analysis
 * @param userId The user ID
 * @param timeframe Timeframe for anomaly detection
 * @param threshold Z-score threshold (default 2.0)
 * @param propertyId Optional property ID filter
 * @returns Array of consumption anomalies
 */
export async function detectConsumptionAnomalies(
  userId: string,
  timeframe: { start: Date, end: Date },
  threshold: number = 2.0,
  propertyId?: string
): Promise<ConsumptionAnomaly[]> {
  try {
    // Get records for the timeframe
    const records = await getRecords(userId, timeframe.start, timeframe.end, propertyId);
    
    if (records.length < 5) {
      throw new Error('Insufficient data for anomaly detection');
    }
    
    // Prepare data for anomaly detection
    const electricityData: TimeSeriesPoint[] = [];
    const gasData: TimeSeriesPoint[] = [];
    const waterData: TimeSeriesPoint[] = [];
    
    records.forEach(record => {
      if (record.electricity_usage !== null && record.electricity_usage !== undefined) {
        electricityData.push({
          date: new Date(record.record_date),
          value: record.electricity_usage
        });
      }
      
      if (record.gas_usage !== null && record.gas_usage !== undefined) {
        gasData.push({
          date: new Date(record.record_date),
          value: record.gas_usage
        });
      }
      
      if (record.water_usage !== null && record.water_usage !== undefined) {
        waterData.push({
          date: new Date(record.record_date),
          value: record.water_usage
        });
      }
    });
    
    // Detect anomalies using the utility function
    const electricityAnomalies = detectAnomalies(electricityData, threshold);
    const gasAnomalies = detectAnomalies(gasData, threshold);
    const waterAnomalies = detectAnomalies(waterData, threshold);
    
    // Calculate expected values and deviations for anomalies
    const result: ConsumptionAnomaly[] = [];
    
    // Process electricity anomalies
    electricityAnomalies.forEach(anomaly => {
      // Find the original record
      const recordIndex = electricityData.findIndex(
        d => d.date.getTime() === anomaly.date.getTime() && d.value === anomaly.value
      );
      
      if (recordIndex >= 0) {
        // Calculate expected value based on surrounding points
        const startIdx = Math.max(0, recordIndex - 2);
        const endIdx = Math.min(electricityData.length - 1, recordIndex + 2);
        let sum = 0;
        let count = 0;
        
        for (let i = startIdx; i <= endIdx; i++) {
          if (i !== recordIndex) {
            sum += electricityData[i].value;
            count++;
          }
        }
        
        const expectedValue = count > 0 ? sum / count : anomaly.value;
        const deviation = expectedValue !== 0 
          ? (anomaly.value - expectedValue) / expectedValue 
          : 0;
        
        result.push({
          date: anomaly.date,
          type: 'electricity',
          value: anomaly.value,
          expectedValue,
          deviation,
          zScore: threshold, // We don't have the actual z-score from the utility function
          suspected_cause: getSuspectedCause('electricity', deviation)
        });
      }
    });
    
    // Process gas anomalies
    gasAnomalies.forEach(anomaly => {
      // Find the original record
      const recordIndex = gasData.findIndex(
        d => d.date.getTime() === anomaly.date.getTime() && d.value === anomaly.value
      );
      
      if (recordIndex >= 0) {
        // Calculate expected value based on surrounding points
        const startIdx = Math.max(0, recordIndex - 2);
        const endIdx = Math.min(gasData.length - 1, recordIndex + 2);
        let sum = 0;
        let count = 0;
        
        for (let i = startIdx; i <= endIdx; i++) {
          if (i !== recordIndex) {
            sum += gasData[i].value;
            count++;
          }
        }
        
        const expectedValue = count > 0 ? sum / count : anomaly.value;
        const deviation = expectedValue !== 0 
          ? (anomaly.value - expectedValue) / expectedValue 
          : 0;
        
        result.push({
          date: anomaly.date,
          type: 'gas',
          value: anomaly.value,
          expectedValue,
          deviation,
          zScore: threshold, // We don't have the actual z-score from the utility function
          suspected_cause: getSuspectedCause('gas', deviation)
        });
      }
    });
    
    // Process water anomalies
    waterAnomalies.forEach(anomaly => {
      // Find the original record
      const recordIndex = waterData.findIndex(
        d => d.date.getTime() === anomaly.date.getTime() && d.value === anomaly.value
      );
      
      if (recordIndex >= 0) {
        // Calculate expected value based on surrounding points
        const startIdx = Math.max(0, recordIndex - 2);
        const endIdx = Math.min(waterData.length - 1, recordIndex + 2);
        let sum = 0;
        let count = 0;
        
        for (let i = startIdx; i <= endIdx; i++) {
          if (i !== recordIndex) {
            sum += waterData[i].value;
            count++;
          }
        }
        
        const expectedValue = count > 0 ? sum / count : anomaly.value;
        const deviation = expectedValue !== 0 
          ? (anomaly.value - expectedValue) / expectedValue 
          : 0;
        
        result.push({
          date: anomaly.date,
          type: 'water',
          value: anomaly.value,
          expectedValue,
          deviation,
          zScore: threshold, // We don't have the actual z-score from the utility function
          suspected_cause: getSuspectedCause('water', deviation)
        });
      }
    });
    
    appLogger.info(`Detected ${result.length} consumption anomalies for user ${userId}`);
    
    return result;
  } catch (error) {
    appLogger.error('Error detecting consumption anomalies:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      timeframe
    });
    throw new Error(`Failed to detect consumption anomalies: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get suspected cause for an anomaly based on type and deviation
 * @param type Utility type
 * @param deviation Deviation percentage
 * @returns Suspected cause description
 */
function getSuspectedCause(type: string, deviation: number): string {
  // Positive deviation means higher than expected usage
  if (deviation > 0) {
    switch (type) {
      case 'electricity':
        return deviation > 0.5 
          ? 'Possible significant event (e.g., new appliance, guests)'
          : 'Moderate increase in usage (e.g., increased AC/heating)';
      case 'gas':
        return deviation > 0.5
          ? 'Significant increase - possible heating system issue or unusually cold weather'
          : 'Moderate increase in heating usage';
      case 'water':
        return deviation > 0.5
          ? 'Possible leak or major water usage event'
          : 'Higher than normal water usage';
      default:
        return 'Unusual increase in consumption';
    }
  } else { // Negative deviation - lower than expected usage
    switch (type) {
      case 'electricity':
        return deviation < -0.5
          ? 'Significant decrease - possible extended absence or major efficiency improvement'
          : 'Lower than normal electricity usage';
      case 'gas':
        return deviation < -0.5
          ? 'Significant decrease - possible warm weather or heating system change'
          : 'Lower than normal gas usage';
      case 'water':
        return deviation < -0.5
          ? 'Significant decrease - possible absence or fixture replacement'
          : 'Lower than normal water usage';
      default:
        return 'Unusual decrease in consumption';
    }
  }
}

/**
 * Analyze energy consumption patterns for a user
 * @param userId The user ID
 * @param year The year to analyze
 * @param propertyId Optional property ID filter
 * @returns Consumption analysis
 */
export async function analyzeConsumption(
  userId: string, 
  year: number, 
  propertyId?: string
): Promise<ConsumptionAnalysis> {
  try {
    // Get all consumption records for the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const records = await getRecords(userId, startDate, endDate, propertyId);
    
    if (records.length === 0) {
      throw new Error('Insufficient data for analysis');
    }
    
    // Calculate annual totals
    const annualElectricity = records.reduce((sum, record) => sum + (record.electricity_usage || 0), 0);
    const annualGas = records.reduce((sum, record) => sum + (record.gas_usage || 0), 0);
    const annualWater = records.reduce((sum, record) => sum + (record.water_usage || 0), 0);
    
    const annualElectricityCost = records.reduce((sum, record) => sum + (record.electricity_cost || 0), 0);
    const annualGasCost = records.reduce((sum, record) => sum + (record.gas_cost || 0), 0);
    const annualWaterCost = records.reduce((sum, record) => sum + (record.water_cost || 0), 0);
    
    // Group by month for seasonal analysis
    const monthlyData: Record<number, { electricity: number, gas: number, water: number }> = {};
    
    records.forEach(record => {
      const month = record.record_date.getMonth();
      
      if (!monthlyData[month]) {
        monthlyData[month] = { electricity: 0, gas: 0, water: 0 };
      }
      
      monthlyData[month].electricity += record.electricity_usage || 0;
      monthlyData[month].gas += record.gas_usage || 0;
      monthlyData[month].water += record.water_usage || 0;
    });
    
    // Calculate seasonal variations
    const seasons = {
      winter: [0, 1, 11], // Dec, Jan, Feb
      spring: [2, 3, 4],   // Mar, Apr, May
      summer: [5, 6, 7],   // Jun, Jul, Aug
      fall: [8, 9, 10]     // Sep, Oct, Nov
    };
    
    const seasonalData: Record<string, { electricity: number, gas: number, water: number }> = {
      winter: { electricity: 0, gas: 0, water: 0 },
      spring: { electricity: 0, gas: 0, water: 0 },
      summer: { electricity: 0, gas: 0, water: 0 },
      fall: { electricity: 0, gas: 0, water: 0 }
    };
    
    for (const [season, months] of Object.entries(seasons)) {
      months.forEach(month => {
        if (monthlyData[month]) {
          seasonalData[season].electricity += monthlyData[month].electricity;
          seasonalData[season].gas += monthlyData[month].gas;
          seasonalData[season].water += monthlyData[month].water;
        }
      });
    }
    
    // Calculate seasonal variation (max - min) / avg
    const seasonValues = Object.values(seasonalData);
    
    const electricityValues = seasonValues.map(s => s.electricity);
    const gasValues = seasonValues.map(s => s.gas);
    const waterValues = seasonValues.map(s => s.water);
    
    const avgElectricity = electricityValues.reduce((sum, val) => sum + val, 0) / seasonValues.length;
    const avgGas = gasValues.reduce((sum, val) => sum + val, 0) / seasonValues.length;
    const avgWater = waterValues.reduce((sum, val) => sum + val, 0) / seasonValues.length;
    
    const electricityVariation = avgElectricity === 0 ? 0 : 
      (Math.max(...electricityValues) - Math.min(...electricityValues)) / avgElectricity;
    
    const gasVariation = avgGas === 0 ? 0 :
      (Math.max(...gasValues) - Math.min(...gasValues)) / avgGas;
    
    const waterVariation = avgWater === 0 ? 0 :
      (Math.max(...waterValues) - Math.min(...waterValues)) / avgWater;
    
    // Detect anomalies
    const anomalies = await detectConsumptionAnomalies(userId, { start: startDate, end: endDate }, 2.5, propertyId);
    
    // Create analysis result
    const analysis: ConsumptionAnalysis = {
      annual_usage: {
        electricity: annualElectricity,
        gas: annualGas,
        water: annualWater
      },
      annual_cost: {
        electricity: annualElectricityCost,
        gas: annualGasCost,
        water: annualWaterCost,
        total: annualElectricityCost + annualGasCost + annualWaterCost
      },
      baseline: {
        electricity: avgElectricity * 4, // Rough baseline: average per season * 4 seasons
        gas: avgGas * 4,
        water: avgWater * 4
      },
      efficiency_score: 0, // Placeholder, would be calculated based on comparisons
      patterns: {
        seasonal_variation: {
          electricity: electricityVariation,
          gas: gasVariation,
          water: waterVariation
        },
        usage_trend: "stable", // Will be updated below
        anomalies: anomalies
      },
      savings_opportunities: [] // Will be populated below
    };
    
    // Get pattern identification to determine trend
    try {
      const patterns = await identifyPatterns(userId, { start: startDate, end: endDate }, propertyId);
      analysis.patterns.usage_trend = patterns.trend.overallTrend;
      
      // Add day/night and weekday/weekend patterns if available
      if (patterns.dayNight.available && patterns.dayNight.ratio !== undefined && patterns.dayNight.dayHeavy !== undefined) {
        analysis.patterns.dayNight = {
          ratio: patterns.dayNight.ratio,
          dayHeavy: patterns.dayNight.dayHeavy
        };
      }
      
      if (patterns.weekdayWeekend.available && patterns.weekdayWeekend.ratio !== undefined && patterns.weekdayWeekend.weekdayHeavy !== undefined) {
        analysis.patterns.weekdayWeekend = {
          ratio: patterns.weekdayWeekend.ratio,
          weekdayHeavy: patterns.weekdayWeekend.weekdayHeavy
        };
      }
    } catch (e) {
      // Don't let pattern identification failure stop the whole analysis
      appLogger.warn(`Failed to identify consumption patterns for user ${userId}:`, {
        error: e instanceof Error ? e.message : String(e)
      });
    }
    
    // Add savings opportunities based on seasonal variations
    if (electricityVariation > 0.5) {
      analysis.savings_opportunities.push({
        category: "Electricity",
        potential_savings: Math.round(annualElectricityCost * 0.15),
        description: "Significant seasonal electricity variations detected. Consider programmable thermostats or more efficient cooling systems.",
        difficulty: "medium"
      });
    }
    
    if (gasVariation > 0.7) {
      analysis.savings_opportunities.push({
        category: "Heating",
        potential_savings: Math.round(annualGasCost * 0.2),
        description: "High seasonal gas usage indicates potential insulation issues or inefficient heating system.",
        difficulty: "hard"
      });
    }
    
    if (waterVariation > 0.4) {
      analysis.savings_opportunities.push({
        category: "Water",
        potential_savings: Math.round(annualWaterCost * 0.1),
        description: "Seasonal water usage variations suggest potential for water conservation measures.",
        difficulty: "easy"
      });
    }
    
    // Calculate efficiency score (placeholder algorithm)
    // A real implementation would use more sophisticated benchmarking
    const variationPenalty = (electricityVariation + gasVariation + waterVariation) / 3 * 20;
    analysis.efficiency_score = Math.max(0, Math.min(100, 80 - variationPenalty));
    
    appLogger.info(`Generated consumption analysis for user ${userId} for year ${year}`);
    
    return analysis;
  } catch (error) {
    appLogger.error('Error analyzing energy consumption:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      year,
      propertyId
    });
    throw new Error(`Failed to analyze energy consumption: ${error instanceof Error ? error.message : String(error)}`);
  }
}
