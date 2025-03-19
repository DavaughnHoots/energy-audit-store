/**
 * Weather Data Service
 * 
 * This service provides access to weather data for energy audit calculations.
 * It integrates with the PostgreSQL database to retrieve location-specific weather
 * data for use in energy consumption analysis and HVAC calculations.
 */

import { pool } from '../config/database.js';
import { appLogger } from '../utils/logger.js';
import type { PoolClient } from 'pg';

// Interfaces for Weather Data
export interface WeatherLocation {
  locationId: string;
  zipCode: string;
  city: string;
  county: string;
  state: string;
  latitude: number;
  longitude: number;
  climateZone: number;
  eventFrequency: number;
}

export interface DegreeDays {
  heatingDegreeDays: number;
  coolingDegreeDays: number;
}

export interface MonthlyDegreeDays extends DegreeDays {
  year: number;
  month: number;
  locationId: string;
}

export interface SeasonalAdjustmentFactor {
  locationId: string;
  month: number;
  adjustmentFactor: number;
}

export interface WeatherEventStatistics {
  locationId: string;
  eventType: string;
  count: number;
  avgDuration: number;
  avgSeverity: number;
  energyImpactScore: number;
}

export interface ConsumptionRecord {
  date: string;
  value: number;
}

export interface NormalizedConsumption extends ConsumptionRecord {
  weatherFactor: number;
  normalizedValue: number;
}

export interface HvacEnergyImpact {
  degreeDays: {
    totalHdd: number;
    totalCdd: number;
    avgHdd: number;
    avgCdd: number;
  };
  heatingEnergyKwh: number;
  coolingEnergyKwh: number;
  totalEnergyKwh: number;
  estimatedAnnualCost: number;
  potentialAnnualSavings: number;
  efficiencyUpgradeRoi: number;
}

export interface WeatherProfile {
  location: WeatherLocation;
  climateIndicators: {
    annualHdd: number;
    annualCdd: number;
    heatingDominated: boolean;
    coolingDominated: boolean;
    extremeEventsFrequency: number;
    severeWeatherScore: number;
    estimatedAnnualEnergyImpact: number;
  };
  monthlyData?: Record<number, any>;
  eventStats?: Record<string, WeatherEventStatistics>;
}

/**
 * Weather Data Service class for accessing weather data
 */
export class WeatherDataService {
  /**
   * Find the nearest location with weather data for a given zip code
   * 
   * @param zipCode ZIP code to search for
   * @param state Optional state code to refine search
   * @returns Weather location or null if not found
   */
  async findLocationByZipCode(zipCode: string, state?: string): Promise<WeatherLocation | null> {
    let client: PoolClient | null = null;
    
    try {
      client = await pool.connect();
      
      // First try exact match
      let query = 'SELECT * FROM weather_locations WHERE zip_code = $1';
      let params = [zipCode];
      
      if (state) {
        query += ' AND state = $2';
        params.push(state);
      }
      
      let result = await client!.query(query, params);
      
      // If no exact match, find the nearest location in the same state
      if (result.rowCount === 0 && state) {
        query = 'SELECT * FROM weather_locations WHERE state = $1 LIMIT 1';
        result = await client!.query(query, [state]);
      }
      
      // If still no match, just get the first location
      if (result.rowCount === 0) {
        query = 'SELECT * FROM weather_locations LIMIT 1';
        result = await client!.query(query);
      }
      
      if (result.rowCount === 0) {
        return null;
      }
      
      // Convert from snake_case to camelCase
      const row = result.rows[0];
      return {
        locationId: row.location_id,
        zipCode: row.zip_code,
        city: row.city,
        county: row.county,
        state: row.state,
        latitude: row.latitude,
        longitude: row.longitude,
        climateZone: row.climate_zone,
        eventFrequency: row.event_frequency
      };
    } catch (error) {
      appLogger.error('Error finding location by ZIP code:', {
        error: error instanceof Error ? error.message : String(error),
        zipCode,
        state
      });
      throw new Error(`Failed to find location by ZIP code: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (client) client.release();
    }
  }
  
  /**
   * Get heating and cooling degree days for a location and time period
   * 
   * @param locationId Location ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Degree days data
   */
  async getDegreeDays(locationId: string, startDate: Date, endDate: Date): Promise<DegreeDays> {
    let client: PoolClient | null = null;
    
    try {
      client = await pool.connect();
      
      // Calculate date ranges
      const startMonth = startDate.getMonth() + 1; // JS months are 0-indexed
      const startYear = startDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;
      const endYear = endDate.getFullYear();
      
      // Query degree days from monthly data
      const query = `
        SELECT 
          SUM(heating_degree_days) as total_hdd,
          SUM(cooling_degree_days) as total_cdd,
          AVG(heating_degree_days) as avg_hdd,
          AVG(cooling_degree_days) as avg_cdd,
          COUNT(*) as months_count
        FROM weather_degree_days
        WHERE location_id = $1 
        AND (
          (year > $2 AND year < $4) OR
          (year = $2 AND month >= $3) OR
          (year = $4 AND month <= $5)
        )
      `;
      
      const result = await client!.query(query, [
        locationId, 
        startYear, startMonth, 
        endYear, endMonth
      ]);
      
      if (result.rowCount === 0 || !result.rows[0].months_count) {
        // Fall back to climate zone estimation if no data
        return this.estimateDegreeDaysByClimateZone(locationId, startDate, endDate, client!);
      }
      
      const row = result.rows[0];
      return {
        heatingDegreeDays: row.total_hdd || 0,
        coolingDegreeDays: row.total_cdd || 0
      };
    } catch (error) {
      appLogger.error('Error getting degree days:', {
        error: error instanceof Error ? error.message : String(error),
        locationId,
        startDate,
        endDate
      });
      throw new Error(`Failed to get degree days: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (client) client.release();
    }
  }
  
  /**
   * Estimate degree days based on climate zone
   * This is a fallback when actual degree day data is not available
   * 
   * @param locationId Location ID
   * @param startDate Start date
   * @param endDate End date
   * @param client Optional database client
   * @returns Estimated degree days
   */
  private async estimateDegreeDaysByClimateZone(
    locationId: string, 
    startDate: Date, 
    endDate: Date,
    client?: PoolClient
  ): Promise<DegreeDays> {
    let shouldReleaseClient = false;
    
    try {
      // If client not provided, get one
      if (!client) {
        client = await pool.connect();
        shouldReleaseClient = true;
      }
      
      // Get climate zone for the location
      const locationQuery = 'SELECT climate_zone FROM weather_locations WHERE location_id = $1';
      const locationResult = await client!.query(locationQuery, [locationId]);
      
      if (locationResult.rowCount === 0) {
        throw new Error(`Location not found: ${locationId}`);
      }
      
      const climateZone = locationResult.rows[0].climate_zone;
      
      // Calculate number of days in the period
      const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Estimate based on climate zone
      // These are rough estimates based on general climate patterns
      const zoneEstimates: Record<number, { hdd: number, cdd: number }> = {
        1: { hdd: 0.5, cdd: 8.0 },    // Hot/tropical
        2: { hdd: 2.0, cdd: 5.0 },    // Hot/warm
        3: { hdd: 5.0, cdd: 3.0 },    // Mixed/moderate
        4: { hdd: 8.0, cdd: 1.0 },    // Mixed/cold
        5: { hdd: 12.0, cdd: 0.5 },   // Cold
      };
      
      const estimate = zoneEstimates[climateZone] || { hdd: 5.0, cdd: 3.0 };
      
      return {
        heatingDegreeDays: estimate.hdd * daysDiff,
        coolingDegreeDays: estimate.cdd * daysDiff
      };
    } catch (error) {
      appLogger.error('Error estimating degree days by climate zone:', {
        error: error instanceof Error ? error.message : String(error),
        locationId,
        startDate,
        endDate
      });
      
      // Fall back to generic values
      const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return {
        heatingDegreeDays: 5.0 * daysDiff,  // Generic estimate
        coolingDegreeDays: 3.0 * daysDiff   // Generic estimate
      };
    } finally {
      if (client && shouldReleaseClient) client.release();
    }
  }
  
  /**
   * Get seasonal adjustment factors for a location
   * These are used to normalize energy consumption for seasonal variations
   * 
   * @param locationId Location ID
   * @returns Record of adjustment factors by month (1-12)
   */
  async getSeasonalAdjustmentFactors(locationId: string): Promise<Record<number, number>> {
    let client: PoolClient | null = null;
    
    try {
      client = await pool.connect();
      
      const query = `
        SELECT month, adjustment_factor
        FROM weather_seasonal_factors
        WHERE location_id = $1
        ORDER BY month
      `;
      
      const result = await client!.query(query, [locationId]);
      
      if (result.rowCount === 0) {
        // Fall back to generic seasonal factors if none found
        return this.getGenericSeasonalFactors();
      }
      
      // Convert to simple month -> factor mapping
      const factors: Record<number, number> = {};
      result.rows.forEach(row => {
        factors[row.month] = row.adjustment_factor;
      });
      
      // Fill in any missing months with reasonable defaults
      for (let month = 1; month <= 12; month++) {
        if (!factors[month]) {
          const season = this.getSeasonFromMonth(month);
          factors[month] = this.getDefaultFactorForSeason(season);
        }
      }
      
      return factors;
    } catch (error) {
      appLogger.error('Error getting seasonal adjustment factors:', {
        error: error instanceof Error ? error.message : String(error),
        locationId
      });
      
      // Fall back to generic seasonal factors
      return this.getGenericSeasonalFactors();
    } finally {
      if (client) client.release();
    }
  }
  
  /**
   * Get generic seasonal adjustment factors
   * These are used as a fallback when location-specific factors are not available
   * 
   * @returns Record of adjustment factors by month (1-12)
   */
  private getGenericSeasonalFactors(): Record<number, number> {
    // Generic factors based on northern hemisphere seasons
    return {
      1: 1.3,  // January (winter - high energy use)
      2: 1.2,  // February (winter - high energy use)
      3: 1.1,  // March (early spring - moderately high energy use)
      4: 0.9,  // April (spring - lower energy use)
      5: 0.8,  // May (late spring - low energy use)
      6: 1.0,  // June (early summer - moderate energy use)
      7: 1.2,  // July (summer - high energy use)
      8: 1.2,  // August (summer - high energy use)
      9: 0.9,  // September (early fall - moderate energy use)
      10: 0.8, // October (fall - low energy use)
      11: 1.0, // November (late fall - moderate energy use)
      12: 1.2  // December (winter - high energy use)
    };
  }
  
  /**
   * Get the season for a given month
   * 
   * @param month Month (1-12)
   * @returns Season name
   */
  private getSeasonFromMonth(month: number): string {
    // Northern hemisphere seasons
    if (month === 12 || month === 1 || month === 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }
  
  /**
   * Get a default adjustment factor for a season
   * 
   * @param season Season name
   * @returns Default adjustment factor
   */
  private getDefaultFactorForSeason(season: string): number {
    switch (season) {
      case 'winter': return 1.3;
      case 'summer': return 1.2;
      case 'spring': return 0.8;
      case 'fall': return 0.9;
      default: return 1.0;
    }
  }
  
  /**
   * Calculate weather-normalized energy consumption
   * 
   * @param locationId Location ID for weather data
   * @param consumption Array of consumption records with date and value
   * @returns Array of consumption records with weather normalization
   */
  async calculateWeatherNormalizedConsumption(
    locationId: string,
    consumption: ConsumptionRecord[]
  ): Promise<NormalizedConsumption[]> {
    try {
      // Get seasonal adjustment factors
      const adjustmentFactors = await this.getSeasonalAdjustmentFactors(locationId);
      
      // Apply normalization to each consumption record
      return consumption.map(item => {
        try {
          // Parse date
          const date = new Date(item.date);
          const month = date.getMonth() + 1; // JS months are 0-indexed
          
          // Get adjustment factor for this month
          const factor = adjustmentFactors[month] || 1.0;
          
          // Apply normalization
          return {
            date: item.date,
            value: item.value,
            weatherFactor: factor,
            normalizedValue: item.value / factor
          };
        } catch (error) {
          // If there's an error with this item, return it unchanged with a default factor
          appLogger.warn(`Error normalizing consumption record for date ${item.date}:`, {
            error: error instanceof Error ? error.message : String(error)
          });
          
          return {
            date: item.date,
            value: item.value,
            weatherFactor: 1.0,
            normalizedValue: item.value
          };
        }
      });
    } catch (error) {
      appLogger.error('Error calculating weather-normalized consumption:', {
        error: error instanceof Error ? error.message : String(error),
        locationId
      });
      
      // If overall error, return the original data with neutral factors
      return consumption.map(item => ({
        date: item.date,
        value: item.value,
        weatherFactor: 1.0,
        normalizedValue: item.value
      }));
    }
  }
  
  /**
   * Calculate HVAC energy impact based on weather data
   * 
   * @param locationId Location ID
   * @param squareFootage Building square footage
   * @param systemEfficiency HVAC system efficiency (0.0-1.0)
   * @param timeframe Optional specific time period
   * @returns HVAC energy impact calculation
   */
  async calculateHvacImpact(
    locationId: string,
    squareFootage: number,
    systemEfficiency: number,
    timeframe?: { startDate: Date, endDate: Date }
  ): Promise<HvacEnergyImpact> {
    try {
      // Set default time period to the last year if not provided
      const endDate = timeframe?.endDate || new Date();
      const startDate = timeframe?.startDate || new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);
      
      // Get degree days for the specified period
      const degreeDays = await this.getDegreeDays(locationId, startDate, endDate);
      
      // Calculate HVAC energy consumption estimates
      // These are simplified estimates based on industry rules of thumb
      
      // Energy consumption factors (BTU per sq ft per degree day)
      const heatingFactor = 1.5;  // BTU/(sq ft * HDD)
      const coolingFactor = 2.0;  // BTU/(sq ft * CDD)
      
      // Convert to kWh (1 kWh = 3412 BTU)
      const kWhConversion = 1 / 3412;
      
      // Adjust for system efficiency
      const efficiencyFactor = systemEfficiency > 0 ? 1 / systemEfficiency : 1.25;
      
      // Calculate energy consumption
      const heatingEnergyBtu = degreeDays.heatingDegreeDays * squareFootage * heatingFactor;
      const coolingEnergyBtu = degreeDays.coolingDegreeDays * squareFootage * coolingFactor;
      
      const heatingEnergyKwh = heatingEnergyBtu * kWhConversion * efficiencyFactor;
      const coolingEnergyKwh = coolingEnergyBtu * kWhConversion * efficiencyFactor;
      
      // Calculate potential savings with improved efficiency
      const improvedEfficiency = Math.min(0.95, systemEfficiency + 0.2);  // 20% improvement, capped at 95%
      const improvedEfficiencyFactor = 1 / improvedEfficiency;
      
      const improvedHeatingKwh = heatingEnergyBtu * kWhConversion * improvedEfficiencyFactor;
      const improvedCoolingKwh = coolingEnergyBtu * kWhConversion * improvedEfficiencyFactor;
      
      const heatingSavings = heatingEnergyKwh - improvedHeatingKwh;
      const coolingSavings = coolingEnergyKwh - improvedCoolingKwh;
      
      // Estimate typical residential electricity cost ($0.14/kWh)
      const electricityRate = 0.14;  // $/kWh
      
      // Calculate potential annual savings
      const annualSavings = (heatingSavings + coolingSavings) * electricityRate;
      
      // Calculate total cost
      const totalCost = (heatingEnergyKwh + coolingEnergyKwh) * electricityRate;
      
      // Calculate ROI (based on typical upgrade cost of $1.5 per sq ft)
      const upgradeRoi = annualSavings / (squareFootage * 1.5);
      
      return {
        degreeDays: {
          totalHdd: degreeDays.heatingDegreeDays,
          totalCdd: degreeDays.coolingDegreeDays,
          avgHdd: degreeDays.heatingDegreeDays / 365, // Daily average
          avgCdd: degreeDays.coolingDegreeDays / 365  // Daily average
        },
        heatingEnergyKwh,
        coolingEnergyKwh,
        totalEnergyKwh: heatingEnergyKwh + coolingEnergyKwh,
        estimatedAnnualCost: totalCost,
        potentialAnnualSavings: annualSavings,
        efficiencyUpgradeRoi: upgradeRoi
      };
    } catch (error) {
      appLogger.error('Error calculating HVAC impact:', {
        error: error instanceof Error ? error.message : String(error),
        locationId,
        squareFootage,
        systemEfficiency
      });
      throw new Error(`Failed to calculate HVAC impact: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get weather profile for a location
   * 
   * @param locationId Location ID
   * @returns Weather profile data
   */
  async getWeatherProfile(locationId: string): Promise<WeatherProfile | null> {
    let client: PoolClient | null = null;
    
    try {
      client = await pool.connect();
      
      // Get location data
      const locationQuery = 'SELECT * FROM weather_locations WHERE location_id = $1';
      const locationResult = await client!.query(locationQuery, [locationId]);
      
      if (locationResult.rowCount === 0) {
        return null;
      }
      
      const locationRow = locationResult.rows[0];
      const location: WeatherLocation = {
        locationId: locationRow.location_id,
        zipCode: locationRow.zip_code,
        city: locationRow.city,
        county: locationRow.county,
        state: locationRow.state,
        latitude: locationRow.latitude,
        longitude: locationRow.longitude,
        climateZone: locationRow.climate_zone,
        eventFrequency: locationRow.event_frequency
      };
      
      // Get annual total degree days
      const degreeQuery = `
        SELECT 
          SUM(heating_degree_days) as annual_hdd,
          SUM(cooling_degree_days) as annual_cdd
        FROM weather_degree_days
        WHERE location_id = $1
      `;
      
      const degreeResult = await client!.query(degreeQuery, [locationId]);
      const annualHdd = degreeResult.rows[0]?.annual_hdd || 0;
      const annualCdd = degreeResult.rows[0]?.annual_cdd || 0;
      
      // Get event statistics
      const eventQuery = `
        SELECT 
          event_type,
          count,
          avg_severity,
          energy_impact_score
        FROM weather_event_statistics
        WHERE location_id = $1
        ORDER BY count DESC
      `;
      
      const eventResult = await client!.query(eventQuery, [locationId]);
      const eventStats: Record<string, WeatherEventStatistics> = {};
      
      eventResult.rows.forEach(row => {
        eventStats[row.event_type] = {
          locationId,
          eventType: row.event_type,
          count: row.count,
          avgDuration: row.avg_duration,
          avgSeverity: row.avg_severity,
          energyImpactScore: row.energy_impact_score
        };
      });
      
      // Calculate climate indicators
      const extremeEventsFrequency = eventResult.rows
        .filter(evt => evt.avg_severity > 3.0)
        .reduce((sum, evt) => sum + evt.count, 0);
      
      const severeWeatherScore = eventResult.rows
        .filter(evt => evt.energy_impact_score > 5.0)
        .reduce((sum, evt) => sum + evt.energy_impact_score, 0);
      
      // Build the profile
      const weatherProfile: WeatherProfile = {
        location,
        climateIndicators: {
          annualHdd,
          annualCdd,
          heatingDominated: annualHdd > annualCdd,
          coolingDominated: annualCdd > annualHdd,
          extremeEventsFrequency,
          severeWeatherScore,
          estimatedAnnualEnergyImpact: (annualHdd * 0.5 + annualCdd * 0.7) / 1000
        },
        eventStats
      };
      
      return weatherProfile;
    } catch (error) {
      appLogger.error('Error getting weather profile:', {
        error: error instanceof Error ? error.message : String(error),
        locationId
      });
      throw new Error(`Failed to get weather profile: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (client) client.release();
    }
  }
}

// Export a singleton instance
export const weatherDataService = new WeatherDataService();
export default weatherDataService;
