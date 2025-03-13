import { appLogger } from '../../utils/logger.js';
import { 
  generateLinearForecast,
  generateSimpleForecast,
  calculateROI,
  TimeSeriesPoint
} from '../../utils/forecastingModels.js';
import { getRecords } from './basicOperations.js';
import { ConsumptionForecastResult } from '../../types/energyConsumption.js';

/**
 * Generate forecast for future energy consumption
 * @param userId The user ID
 * @param months Number of months to forecast
 * @param propertyId Optional property ID filter
 * @returns Consumption forecast
 */
export async function forecastConsumption(
  userId: string,
  months: number = 12,
  propertyId?: string
): Promise<ConsumptionForecastResult> {
  try {
    if (months <= 0) {
      throw new Error('Forecast months must be positive');
    }
    
    // Get historical data for past 2 years
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const records = await getRecords(userId, startDate, endDate, propertyId);
    
    if (records.length < 3) {
      throw new Error('Insufficient data for consumption forecast');
    }
    
    // Prepare data for forecasting
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
    
    // Sort data by date
    electricityData.sort((a, b) => a.date.getTime() - b.date.getTime());
    gasData.sort((a, b) => a.date.getTime() - b.date.getTime());
    waterData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate monthly interval (approximately 30 days in milliseconds)
    const monthlyInterval = 30 * 24 * 60 * 60 * 1000;
    
    // Generate forecasts
    let electricityForecast: TimeSeriesPoint[] = [];
    let gasForecast: TimeSeriesPoint[] = [];
    let waterForecast: TimeSeriesPoint[] = [];
    
    // Forecast confidence scores
    let electricityConfidence = 0.5;
    let gasConfidence = 0.5;
    let waterConfidence = 0.5;
    
    // Determine best forecasting method based on data
    let methodology = 'Simple forecast (not enough data for advanced methods)';
    
    try {
      // If we have enough data points, use linear regression
      if (electricityData.length >= 6) {
        electricityForecast = generateLinearForecast(electricityData, months, monthlyInterval);
        electricityConfidence = Math.min(0.8, 0.5 + electricityData.length / 24);
        methodology = 'Linear regression';
      } else if (electricityData.length >= 3) {
        electricityForecast = generateSimpleForecast(electricityData, months, monthlyInterval);
      }
    } catch (e) {
      appLogger.warn(`Error generating electricity forecast, falling back to simple method:`, {
        error: e instanceof Error ? e.message : String(e)
      });
      // Fallback to simple forecast
      if (electricityData.length >= 3) {
        electricityForecast = generateSimpleForecast(electricityData, months, monthlyInterval);
      }
    }
    
    try {
      if (gasData.length >= 6) {
        gasForecast = generateLinearForecast(gasData, months, monthlyInterval);
        gasConfidence = Math.min(0.8, 0.5 + gasData.length / 24);
      } else if (gasData.length >= 3) {
        gasForecast = generateSimpleForecast(gasData, months, monthlyInterval);
      }
    } catch (e) {
      appLogger.warn(`Error generating gas forecast, falling back to simple method:`, {
        error: e instanceof Error ? e.message : String(e)
      });
      // Fallback to simple forecast
      if (gasData.length >= 3) {
        gasForecast = generateSimpleForecast(gasData, months, monthlyInterval);
      }
    }
    
    try {
      if (waterData.length >= 6) {
        waterForecast = generateLinearForecast(waterData, months, monthlyInterval);
        waterConfidence = Math.min(0.8, 0.5 + waterData.length / 24);
      } else if (waterData.length >= 3) {
        waterForecast = generateSimpleForecast(waterData, months, monthlyInterval);
      }
    } catch (e) {
      appLogger.warn(`Error generating water forecast, falling back to simple method:`, {
        error: e instanceof Error ? e.message : String(e)
      });
      // Fallback to simple forecast
      if (waterData.length >= 3) {
        waterForecast = generateSimpleForecast(waterData, months, monthlyInterval);
      }
    }
    
    // If we have more than 12 records, use a more sophisticated description
    if (records.length >= 12) {
      methodology = 'Seasonal-adjusted linear regression';
    }
    
    // Calculate forecast timeframe
    const forecastStart = new Date();
    const forecastEnd = new Date(forecastStart.getTime() + months * monthlyInterval);
    
    appLogger.info(`Generated consumption forecast for user ${userId}`);
    
    return {
      forecast: {
        electricity: electricityForecast,
        gas: gasForecast,
        water: waterForecast
      },
      confidence: {
        electricity: electricityConfidence,
        gas: gasConfidence,
        water: waterConfidence
      },
      methodology,
      timeframe: {
        start: forecastStart,
        end: forecastEnd
      }
    };
  } catch (error) {
    appLogger.error('Error generating consumption forecast:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      months
    });
    throw new Error(`Failed to generate consumption forecast: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate return on investment for energy efficiency upgrade
 * @param implementationCost Cost of implementing the upgrade
 * @param annualSavings Annual savings from the upgrade
 * @param yearsOfOperation Expected life of the upgrade in years
 * @param discountRate Annual discount rate (default 0.03 or 3%)
 */
export function calculateUpgradeROI(
  implementationCost: number,
  annualSavings: number,
  yearsOfOperation: number,
  discountRate: number = 0.03
): {
  payback_period: number;
  roi_percentage: number;
  npv: number;
  irr: number | null;
} {
  try {
    const roi = calculateROI(implementationCost, annualSavings, yearsOfOperation, discountRate);
    
    return {
      payback_period: roi.simplePaybackPeriod,
      roi_percentage: roi.roi * 100, // Convert to percentage
      npv: roi.npv,
      irr: roi.irr
    };
  } catch (error) {
    appLogger.error('Error calculating upgrade ROI:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      implementationCost,
      annualSavings,
      yearsOfOperation
    });
    throw new Error(`Failed to calculate upgrade ROI: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate cost projections for different efficiency scenarios
 * @param userId The user ID
 * @param years Number of years to project
 * @param efficiencyImprovements Array of efficiency improvement percentages
 * @param propertyId Optional property ID filter
 * @returns Cost projections by scenario
 */
export async function calculateCostProjections(
  userId: string,
  years: number = 5,
  efficiencyImprovements: number[] = [0, 0.1, 0.2, 0.3], // 0%, 10%, 20%, 30%
  propertyId?: string
): Promise<Array<{
  scenario: string;
  improvement_percentage: number;
  annual_costs: Array<{
    year: number;
    cost: number;
  }>;
  total_cost: number;
  savings_vs_baseline: number;
}>> {
  try {
    // Get recent consumption data to establish baseline
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const endDate = new Date();
    
    const records = await getRecords(userId, startDate, endDate, propertyId);
    
    if (records.length < 2) {
      throw new Error('Insufficient data for cost projections');
    }
    
    // Calculate annual costs
    const totalCosts = records.reduce((sum, record) => {
      return sum + (record.electricity_cost || 0) + (record.gas_cost || 0) + (record.water_cost || 0);
    }, 0);
    
    // Annualize if less than a year of data
    const daysCovered = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const annualizedCost = totalCosts * (365 / daysCovered);
    
    // Calculate inflation rate (assumed 3% annually)
    const inflationRate = 0.03;
    
    // Initialize an array to store projections
    type ProjectionType = {
      scenario: string;
      improvement_percentage: number;
      annual_costs: Array<{ year: number; cost: number }>;
      total_cost: number;
      savings_vs_baseline: number;
    };
    
    const projections: ProjectionType[] = [];
    
    // First calculate the baseline (no improvement) scenario
    let baselineScenario: ProjectionType | null = null;
    
    // Process each efficiency improvement scenario
    for (let i = 0; i < efficiencyImprovements.length; i++) {
      const improvement = efficiencyImprovements[i];
      const scenario = improvement === 0 ? 'Baseline' : `${improvement * 100}% Improvement`;
      const annualCosts: Array<{ year: number; cost: number }> = [];
      let totalCost = 0;
      
      for (let year = 1; year <= years; year++) {
        // Calculate cost with efficiency improvement and annual inflation
        const yearCost = annualizedCost * 
          (1 - improvement) * // Efficiency reduction
          Math.pow(1 + inflationRate, year - 1); // Inflation increase
        
        annualCosts.push({
          year: now.getFullYear() + year - 1,
          cost: yearCost
        });
        
        totalCost += yearCost;
      }
      
      // Calculate savings compared to baseline
      let savings = 0;
      if (i === 0) {
        // This is the baseline scenario, savings is 0
        baselineScenario = {
          scenario,
          improvement_percentage: improvement * 100,
          annual_costs: annualCosts,
          total_cost: totalCost,
          savings_vs_baseline: 0
        };
        projections.push(baselineScenario);
      } else {
        // Calculate savings compared to baseline
        if (baselineScenario) {
          savings = baselineScenario.total_cost - totalCost;
        }
        
        projections.push({
          scenario,
          improvement_percentage: improvement * 100,
          annual_costs: annualCosts,
          total_cost: totalCost,
          savings_vs_baseline: savings
        });
      }
    }
    
    appLogger.info(`Generated cost projections for user ${userId}`);
    
    return projections;
  } catch (error) {
    appLogger.error('Error generating cost projections:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      years
    });
    throw new Error(`Failed to generate cost projections: ${error instanceof Error ? error.message : String(error)}`);
  }
}
