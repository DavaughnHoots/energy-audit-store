import { pool } from '../config/database.js';
import { appLogger } from '../utils/logger.js';

/**
 * Interface for energy consumption record
 */
export interface EnergyConsumptionRecord {
  id?: string;
  user_id: string;
  property_id?: string;
  record_date: Date;
  electricity_usage?: number;
  gas_usage?: number;
  water_usage?: number;
  electricity_cost?: number;
  gas_cost?: number;
  water_cost?: number;
  heating_degree_days?: number;
  cooling_degree_days?: number;
  weather_data?: any;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for monthly consumption summary
 */
export interface MonthlySummary {
  month: Date;
  total_electricity_usage: number;
  total_gas_usage: number;
  total_water_usage: number;
  total_electricity_cost: number;
  total_gas_cost: number;
  total_water_cost: number;
  avg_heating_degree_days: number;
  avg_cooling_degree_days: number;
}

/**
 * Interface for yearly consumption comparison
 */
export interface YearlyComparison {
  month: number;
  current_year_electricity: number;
  previous_year_electricity: number;
  current_year_gas: number;
  previous_year_gas: number;
  current_year_water: number;
  previous_year_water: number;
  current_year_cost: number;
  previous_year_cost: number;
}

/**
 * Interface for consumption analysis result
 */
export interface ConsumptionAnalysis {
  annual_usage: {
    electricity: number;
    gas: number;
    water: number;
  };
  annual_cost: {
    electricity: number;
    gas: number;
    water: number;
    total: number;
  };
  baseline: {
    electricity: number;
    gas: number;
    water: number;
  };
  efficiency_score: number;
  patterns: {
    seasonal_variation: {
      electricity: number;
      gas: number;
      water: number;
    };
    usage_trend: string;
    anomalies: Array<{
      date: Date;
      type: string;
      variation: number;
      suspected_cause: string;
    }>;
  };
  savings_opportunities: Array<{
    category: string;
    potential_savings: number;
    description: string;
    difficulty: string;
  }>;
}

/**
 * Service for handling energy consumption data
 */
export class EnergyConsumptionService {
  /**
   * Add a new energy consumption record
   * @param record The energy consumption record to add
   * @returns The added record
   */
  async addRecord(record: EnergyConsumptionRecord): Promise<EnergyConsumptionRecord> {
    try {
      const query = `
        INSERT INTO energy_consumption_records (
          user_id, property_id, record_date, 
          electricity_usage, gas_usage, water_usage,
          electricity_cost, gas_cost, water_cost,
          heating_degree_days, cooling_degree_days, weather_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *
      `;

      const params = [
        record.user_id,
        record.property_id || null,
        record.record_date,
        record.electricity_usage || null,
        record.gas_usage || null,
        record.water_usage || null,
        record.electricity_cost || null,
        record.gas_cost || null,
        record.water_cost || null,
        record.heating_degree_days || null,
        record.cooling_degree_days || null,
        record.weather_data ? JSON.stringify(record.weather_data) : null
      ];

      const result = await pool.query(query, params);
      appLogger.info(`Added energy consumption record for user ${record.user_id} on ${record.record_date}`);
      
      return result.rows[0];
    } catch (error) {
      appLogger.error('Error adding energy consumption record:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        userId: record.user_id,
        recordDate: record.record_date
      });
      throw new Error(`Failed to add energy consumption record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get energy consumption records for a user
   * @param userId The user ID
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @param propertyId Optional property ID filter
   * @returns Array of energy consumption records
   */
  async getRecords(
    userId: string, 
    startDate?: Date, 
    endDate?: Date, 
    propertyId?: string
  ): Promise<EnergyConsumptionRecord[]> {
    try {
      let query = `
        SELECT * FROM energy_consumption_records
        WHERE user_id = $1
      `;
      
      const params: any[] = [userId];
      
      if (startDate) {
        query += ` AND record_date >= $${params.length + 1}`;
        params.push(startDate);
      }
      
      if (endDate) {
        query += ` AND record_date <= $${params.length + 1}`;
        params.push(endDate);
      }
      
      if (propertyId) {
        query += ` AND property_id = $${params.length + 1}`;
        params.push(propertyId);
      }
      
      query += ` ORDER BY record_date DESC`;
      
      const result = await pool.query(query, params);
      appLogger.debug(`Retrieved ${result.rows.length} energy consumption records for user ${userId}`);
      
      return result.rows;
    } catch (error) {
      appLogger.error('Error retrieving energy consumption records:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        userId,
        startDate,
        endDate,
        propertyId
      });
      throw new Error(`Failed to retrieve energy consumption records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get monthly consumption summary for a user
   * @param userId The user ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Monthly consumption summary
   */
  async getMonthlySummary(userId: string, startDate: Date, endDate: Date): Promise<MonthlySummary[]> {
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
  async getYearlyComparison(userId: string, currentYear: number, propertyId?: string): Promise<YearlyComparison[]> {
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
   * Update an energy consumption record
   * @param recordId The record ID
   * @param userId The user ID (for validation)
   * @param updates The updates to apply
   * @returns The updated record
   */
  async updateRecord(recordId: string, userId: string, updates: Partial<EnergyConsumptionRecord>): Promise<EnergyConsumptionRecord> {
    try {
      // Start building the query
      let query = 'UPDATE energy_consumption_records SET ';
      const params: any[] = [];
      const updateFields: string[] = [];
      
      // Add fields that can be updated
      if (updates.property_id !== undefined) {
        params.push(updates.property_id);
        updateFields.push(`property_id = $${params.length}`);
      }
      
      if (updates.record_date !== undefined) {
        params.push(updates.record_date);
        updateFields.push(`record_date = $${params.length}`);
      }
      
      if (updates.electricity_usage !== undefined) {
        params.push(updates.electricity_usage);
        updateFields.push(`electricity_usage = $${params.length}`);
      }
      
      if (updates.gas_usage !== undefined) {
        params.push(updates.gas_usage);
        updateFields.push(`gas_usage = $${params.length}`);
      }
      
      if (updates.water_usage !== undefined) {
        params.push(updates.water_usage);
        updateFields.push(`water_usage = $${params.length}`);
      }
      
      if (updates.electricity_cost !== undefined) {
        params.push(updates.electricity_cost);
        updateFields.push(`electricity_cost = $${params.length}`);
      }
      
      if (updates.gas_cost !== undefined) {
        params.push(updates.gas_cost);
        updateFields.push(`gas_cost = $${params.length}`);
      }
      
      if (updates.water_cost !== undefined) {
        params.push(updates.water_cost);
        updateFields.push(`water_cost = $${params.length}`);
      }
      
      if (updates.heating_degree_days !== undefined) {
        params.push(updates.heating_degree_days);
        updateFields.push(`heating_degree_days = $${params.length}`);
      }
      
      if (updates.cooling_degree_days !== undefined) {
        params.push(updates.cooling_degree_days);
        updateFields.push(`cooling_degree_days = $${params.length}`);
      }
      
      if (updates.weather_data !== undefined) {
        params.push(JSON.stringify(updates.weather_data));
        updateFields.push(`weather_data = $${params.length}`);
      }
      
      // If no updates provided, return early
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      // Complete the query
      query += updateFields.join(', ');
      query += ` WHERE id = $${params.length + 1} AND user_id = $${params.length + 2} RETURNING *`;
      
      // Add record ID and user ID
      params.push(recordId);
      params.push(userId);
      
      // Execute the query
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error('Record not found or user does not have permission');
      }
      
      appLogger.info(`Updated energy consumption record ${recordId} for user ${userId}`);
      
      return result.rows[0];
    } catch (error) {
      appLogger.error('Error updating energy consumption record:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        recordId,
        userId
      });
      throw new Error(`Failed to update energy consumption record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete an energy consumption record
   * @param recordId The record ID
   * @param userId The user ID (for validation)
   * @returns True if deleted, false if not found
   */
  async deleteRecord(recordId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM energy_consumption_records
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      
      const result = await pool.query(query, [recordId, userId]);
      
      const deleted = result.rowCount > 0;
      
      if (deleted) {
        appLogger.info(`Deleted energy consumption record ${recordId} for user ${userId}`);
      } else {
        appLogger.warn(`Attempted to delete non-existent record ${recordId} for user ${userId}`);
      }
      
      return deleted;
    } catch (error) {
      appLogger.error('Error deleting energy consumption record:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        recordId,
        userId
      });
      throw new Error(`Failed to delete energy consumption record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze energy consumption patterns for a user
   * @param userId The user ID
   * @param year The year to analyze
   * @param propertyId Optional property ID filter
   * @returns Consumption analysis
   */
  async analyzeConsumption(userId: string, year: number, propertyId?: string): Promise<ConsumptionAnalysis> {
    try {
      // This is a placeholder for more complex analysis logic
      // In a real implementation, this would include sophisticated pattern recognition algorithms
      
      // Get all consumption records for the year
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      const records = await this.getRecords(userId, startDate, endDate, propertyId);
      
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
          usage_trend: "stable", // Placeholder, would be determined by time series analysis
          anomalies: [] // Placeholder, would detect significant deviations
        },
        savings_opportunities: [] // Placeholder, would be based on patterns and comparisons
      };
      
      // Add sample savings opportunities based on seasonal variations
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
}

// Export a singleton instance
export const energyConsumptionService = new EnergyConsumptionService();
