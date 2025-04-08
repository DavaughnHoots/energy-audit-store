import { pool } from '../../config/database.js';
import { appLogger } from '../../utils/logger.js';
import { MonthlySummary, YearlyComparison } from '../../types/energyConsumption.js';

/**
 * Get monthly consumption summary for a user
 * @param userId The user ID
 * @param startDate Start date
 * @param endDate End date
 * @returns Monthly consumption summary
 */
export async function getMonthlySummary(
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<MonthlySummary[]> {
  try {
    const query = `
      SELECT * FROM get_monthly_consumption_summary($1, $2, $3)
    `;
    
    const result = await pool.query(query, [userId, startDate, endDate]);
    appLogger.debug(`Retrieved monthly consumption summary for user ${userId}`);
    
    return result.rows;
  } catch (error) {
    appLogger.error('Error retrieving monthly consumption summary:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      startDate,
      endDate
    });
    throw new Error(`Failed to retrieve monthly consumption summary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get yearly consumption comparison for a user
 * @param userId The user ID
 * @param currentYear The current year to compare
 * @param propertyId Optional property ID filter
 * @returns Yearly consumption comparison
 */
export async function getYearlyComparison(
  userId: string, 
  currentYear: number, 
  propertyId?: string
): Promise<YearlyComparison[]> {
  try {
    const query = `
      SELECT * FROM get_yearly_consumption_comparison($1, $2, $3)
    `;
    
    const result = await pool.query(query, [userId, currentYear, propertyId || null]);
    appLogger.debug(`Retrieved yearly consumption comparison for user ${userId}`);
    
    return result.rows;
  } catch (error) {
    appLogger.error('Error retrieving yearly consumption comparison:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      currentYear,
      propertyId
    });
    throw new Error(`Failed to retrieve yearly consumption comparison: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate average daily consumption for a given time period
 * @param userId The user ID
 * @param startDate Start date
 * @param endDate End date
 * @param propertyId Optional property ID filter
 * @returns Average daily consumption values
 */
export async function getAverageDailyConsumption(
  userId: string,
  startDate: Date,
  endDate: Date,
  propertyId?: string
): Promise<{
  electricity: number;
  gas: number;
  water: number;
  days: number;
}> {
  try {
    // Query to calculate average daily usage
    const query = `
      SELECT 
        AVG(electricity_usage) as avg_electricity,
        AVG(gas_usage) as avg_gas,
        AVG(water_usage) as avg_water,
        COUNT(DISTINCT DATE(record_date)) as days
      FROM energy_consumption_records
      WHERE user_id = $1
        AND record_date BETWEEN $2 AND $3
        ${propertyId ? 'AND property_id = $4' : ''}
    `;
    
    const params = [userId, startDate, endDate];
    if (propertyId) {
      params.push(propertyId);
    }
    
    const result = await pool.query(query, params);
    appLogger.debug(`Retrieved average daily consumption for user ${userId}`);
    
    const row = result.rows[0];
    return {
      electricity: row.avg_electricity || 0,
      gas: row.avg_gas || 0,
      water: row.avg_water || 0,
      days: row.days || 0
    };
  } catch (error) {
    appLogger.error('Error retrieving average daily consumption:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      startDate,
      endDate,
      propertyId
    });
    throw new Error(`Failed to retrieve average daily consumption: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate total costs for a given time period
 * @param userId The user ID
 * @param startDate Start date
 * @param endDate End date
 * @param propertyId Optional property ID filter
 * @returns Total costs for the period
 */
export async function getTotalCosts(
  userId: string,
  startDate: Date,
  endDate: Date,
  propertyId?: string
): Promise<{
  electricity: number;
  gas: number;
  water: number;
  total: number;
}> {
  try {
    // Query to calculate total costs
    const query = `
      SELECT 
        SUM(electricity_cost) as total_electricity_cost,
        SUM(gas_cost) as total_gas_cost,
        SUM(water_cost) as total_water_cost
      FROM energy_consumption_records
      WHERE user_id = $1
        AND record_date BETWEEN $2 AND $3
        ${propertyId ? 'AND property_id = $4' : ''}
    `;
    
    const params = [userId, startDate, endDate];
    if (propertyId) {
      params.push(propertyId);
    }
    
    const result = await pool.query(query, params);
    appLogger.debug(`Retrieved total costs for user ${userId}`);
    
    const row = result.rows[0];
    const electricityCost = parseFloat(row.total_electricity_cost) || 0;
    const gasCost = parseFloat(row.total_gas_cost) || 0;
    const waterCost = parseFloat(row.total_water_cost) || 0;
    
    return {
      electricity: electricityCost,
      gas: gasCost,
      water: waterCost,
      total: electricityCost + gasCost + waterCost
    };
  } catch (error) {
    appLogger.error('Error retrieving total costs:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      startDate,
      endDate,
      propertyId
    });
    throw new Error(`Failed to retrieve total costs: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get consumption percentile compared to similar properties
 * @param userId The user ID
 * @param year The year to analyze
 * @param propertyDetails Property details for comparison (square footage, occupants)
 * @returns Percentile rankings
 */
export async function getConsumptionPercentile(
  userId: string,
  year: number,
  propertyDetails: {
    squareFootage?: number;
    occupants?: number;
    propertyType?: string;
  }
): Promise<{
  electricity_percentile: number;
  gas_percentile: number;
  water_percentile: number;
  overall_percentile: number;
}> {
  try {
    // This would typically call a stored procedure or complex query
    // that compares the user's consumption with similar properties
    // For now, we'll implement a placeholder that returns random percentiles
    
    appLogger.debug(`Retrieved consumption percentiles for user ${userId}`);
    
    // In a real implementation, this would use actual data
    // Placeholder implementation
    return {
      electricity_percentile: Math.floor(Math.random() * 100),
      gas_percentile: Math.floor(Math.random() * 100),
      water_percentile: Math.floor(Math.random() * 100),
      overall_percentile: Math.floor(Math.random() * 100)
    };
  } catch (error) {
    appLogger.error('Error retrieving consumption percentiles:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      year
    });
    throw new Error(`Failed to retrieve consumption percentiles: ${error instanceof Error ? error.message : String(error)}`);
  }
}
