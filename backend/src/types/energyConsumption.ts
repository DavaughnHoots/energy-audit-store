/**
 * Types related to energy consumption data and analysis
 */

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
 * Interface for property details used in normalization
 */
export interface PropertyNormalizationDetails {
  squareFootage?: number;
  occupants?: number;
  yearBuilt?: number;
  propertyType?: string;
  numBedrooms?: number;
  numBathrooms?: number;
  hasPool?: boolean;
}

/**
 * Interface for the result of a baseline calculation
 */
export interface BaselineCalculationResult {
  electricity: {
    baseline: number;
    normalizedBaseline: number;
    adjustedBaseline: number;
    seasonalAdjusted: boolean;
    squareFootageAdjusted: boolean;
    occupancyAdjusted: boolean;
    benchmarkAdjusted?: boolean;
    percentileRanking?: number | null;
  };
  gas: {
    baseline: number;
    normalizedBaseline: number;
    adjustedBaseline: number;
    seasonalAdjusted: boolean;
    squareFootageAdjusted: boolean;
    occupancyAdjusted: boolean;
    benchmarkAdjusted?: boolean;
    percentileRanking?: number | null;
  };
  water: {
    baseline: number;
    normalizedBaseline: number;
    adjustedBaseline: number;
    seasonalAdjusted: boolean;
    squareFootageAdjusted: boolean;
    occupancyAdjusted: boolean;
    benchmarkAdjusted?: boolean;
    percentileRanking?: number | null;
  };
  timeframe: {
    start: Date;
    end: Date;
  };
  confidenceScore: number;
  propertyDetails?: PropertyNormalizationDetails;
}

/**
 * Interface for pattern identification result
 */
export interface PatternIdentificationResult {
  seasonal: {
    electricity: number; // Correlation coefficient (-1 to 1)
    gas: number;
    water: number;
    hasSeasonality: boolean;
  };
  dayNight: {
    available: boolean;
    ratio?: number; // Day usage / night usage
    dayHeavy?: boolean;
  };
  weekdayWeekend: {
    available: boolean;
    ratio?: number; // Weekday usage / weekend usage
    weekdayHeavy?: boolean;
  };
  trend: {
    electricity: string; // "increasing", "decreasing", "stable"
    gas: string;
    water: string;
    overallTrend: string;
  };
}

/**
 * Interface for consumption forecast result
 */
export interface ConsumptionForecastResult {
  forecast: {
    electricity: Array<{date: Date; value: number}>;
    gas: Array<{date: Date; value: number}>;
    water: Array<{date: Date; value: number}>;
  };
  confidence: {
    electricity: number; // 0-1 scale
    gas: number;
    water: number;
  };
  methodology: string; // Description of forecasting method used
  timeframe: {
    start: Date;
    end: Date;
  };
}

/**
 * Interface for consumption anomaly
 */
export interface ConsumptionAnomaly {
  date: Date;
  type: string; // "electricity", "gas", "water"
  value: number;
  expectedValue: number;
  deviation: number; // Percent or absolute deviation
  zScore: number;
  suspected_cause?: string;
}

/**
 * Enhanced interface for consumption analysis result
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
    normalized?: {
      electricity: number;
      gas: number;
      water: number;
    };
  };
  efficiency_score: number;
  patterns: {
    seasonal_variation: {
      electricity: number;
      gas: number;
      water: number;
    };
    usage_trend: string;
    anomalies: Array<ConsumptionAnomaly>;
    dayNight?: {
      ratio: number;
      dayHeavy: boolean;
    };
    weekdayWeekend?: {
      ratio: number;
      weekdayHeavy: boolean;
    };
  };
  forecast?: {
    next_month: {
      electricity: number;
      gas: number;
      water: number;
      total_cost: number;
    };
    next_year: {
      electricity: number;
      gas: number;
      water: number;
      total_cost: number;
    };
  };
  weather_correlation?: {
    heating_correlation: number; // -1 to 1
    cooling_correlation: number; // -1 to 1
    temperature_sensitivity: number; // kWh per degree change
  };
  savings_opportunities: Array<{
    category: string;
    potential_savings: number;
    description: string;
    difficulty: string;
    roi?: {
      payback_period: number;
      roi_percentage: number;
      npv: number;
    };
  }>;
  comparison?: {
    similar_properties?: {
      electricity_percentile: number; // 0-100
      gas_percentile: number;
      water_percentile: number;
      overall_percentile: number;
    };
    previous_year?: {
      electricity_change: number; // percentage
      gas_change: number;
      water_change: number;
      total_cost_change: number;
    };
  };
}
