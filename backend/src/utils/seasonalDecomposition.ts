/**
 * Seasonal Decomposition Utilities
 * 
 * This file contains functions for performing time series decomposition
 * to identify seasonal patterns in energy consumption data.
 * These functions support the pattern recognition capabilities of the
 * energy consumption analysis system.
 */

import { TimeSeriesPoint } from './forecastingModels.js';

/**
 * Interface for decomposition result
 */
export interface DecompositionResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
  seasonalStrength: number;
  dates: Date[];
}

/**
 * Interface for seasonal indices
 */
export interface SeasonalIndices {
  monthly: Record<number, number>; // Month number (1-12) -> index
  dailyOfWeek?: Record<number, number>; // Day of week (0-6) -> index
  dailyOfMonth?: Record<number, number>; // Day of month (1-31) -> index
  hourly?: Record<number, number>; // Hour (0-23) -> index
}

/**
 * Options for seasonal decomposition
 */
export interface DecompositionOptions {
  method?: 'multiplicative' | 'additive';
  periodicity?: number; // Default: 12 for monthly data
  smoothingWindowSize?: number; // For trend extraction
  includeConfidence?: boolean; // Whether to include confidence intervals
  adjustForExtremeDays?: boolean; // Whether to adjust for outliers
}

/**
 * Climatological normals type (for reference seasonal patterns)
 */
export interface ClimatologicalNormals {
  temperature?: Record<number, number>; // Month -> average temperature
  heatingDegreeDays?: Record<number, number>; // Month -> HDD
  coolingDegreeDays?: Record<number, number>; // Month -> CDD
  precipitation?: Record<number, number>; // Month -> precipitation
}

/**
 * Decompose time series data into trend, seasonal, and residual components
 * 
 * @param data Array of time series data points
 * @param options Decomposition options
 * @returns Decomposition result with trend, seasonal, and residual components
 */
export function decomposeTimeSeries(
  data: TimeSeriesPoint[],
  options: DecompositionOptions = {}
): DecompositionResult {
  if (data.length < 24) {
    throw new Error('Insufficient data for seasonal decomposition. Need at least 24 data points.');
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Extract values and dates
  const values = sortedData.map(point => point.value);
  const dates = sortedData.map(point => new Date(point.date));
  
  // Set default options
  const method = options.method || 'additive';
  const periodicity = options.periodicity || 12; // Default to monthly seasonality
  const smoothingWindowSize = options.smoothingWindowSize || Math.max(periodicity, Math.floor(values.length / 8));
  
  // 1. Extract trend using centered moving average
  const trend = extractTrend(values, smoothingWindowSize);
  
  // 2. De-trend the series
  const detrendedValues = values.map((value, i) => {
    if (method === 'multiplicative' && trend[i] !== 0) {
      return value / trend[i];
    } else {
      return value - trend[i];
    }
  });
  
  // 3. Extract seasonal component
  const rawSeasonal = extractSeasonalComponent(detrendedValues, dates, periodicity);
  
  // 4. Normalize seasonal component to ensure it sums to zero (additive) or averages to 1 (multiplicative)
  const seasonal = normalizeSeasonal(rawSeasonal, method);
  
  // 5. Calculate residual component
  const residual = values.map((value, i) => {
    if (method === 'multiplicative' && trend[i] !== 0 && seasonal[i] !== 0) {
      return value / (trend[i] * seasonal[i]);
    } else {
      return value - trend[i] - seasonal[i];
    }
  });
  
  // 6. Calculate seasonal strength
  const seasonalStrength = calculateSeasonalStrength(seasonal, residual);
  
  return {
    trend,
    seasonal,
    residual,
    seasonalStrength,
    dates
  };
}

/**
 * Extract trend component using centered moving average
 * 
 * @param values Array of time series values
 * @param windowSize Size of moving average window
 * @returns Trend component
 */
function extractTrend(values: number[], windowSize: number): number[] {
  const n = values.length;
  const trend: number[] = new Array(n).fill(0);
  
  // For points that can't have a complete window, extend the first/last calculated trend value
  const halfWindow = Math.floor(windowSize / 2);
  
  // Calculate centered moving average for middle points
  for (let i = halfWindow; i < n - halfWindow; i++) {
    let sum = 0;
    for (let j = i - halfWindow; j <= i + halfWindow; j++) {
      sum += values[j];
    }
    trend[i] = sum / windowSize;
  }
  
  // Extend trend to endpoints
  for (let i = 0; i < halfWindow; i++) {
    trend[i] = trend[halfWindow];
  }
  
  for (let i = n - halfWindow; i < n; i++) {
    trend[i] = trend[n - halfWindow - 1];
  }
  
  return trend;
}

/**
 * Extract seasonal component from detrended data
 * 
 * @param detrendedValues Detrended time series values
 * @param dates Dates corresponding to values
 * @param periodicity Seasonal periodicity
 * @returns Seasonal component
 */
function extractSeasonalComponent(
  detrendedValues: number[],
  dates: Date[],
  periodicity: number
): number[] {
  const n = detrendedValues.length;
  const seasonal: number[] = new Array(n).fill(0);
  
  // Calculate seasonal indices based on periodicity
  const seasonalIndices: Record<number, number[]> = {};
  
  // Group values by their seasonal position
  for (let i = 0; i < n; i++) {
    let seasonalPosition: number;
    
    // Determine seasonal position based on periodicity
    if (periodicity === 12) {
      // Monthly seasonality
      seasonalPosition = dates[i].getMonth();
    } else if (periodicity === 7) {
      // Weekly seasonality
      seasonalPosition = dates[i].getDay();
    } else if (periodicity === 24) {
      // Hourly seasonality
      seasonalPosition = dates[i].getHours();
    } else {
      // Generic periodicity - use modulo
      seasonalPosition = i % periodicity;
    }
    
    if (!seasonalIndices[seasonalPosition]) {
      seasonalIndices[seasonalPosition] = [];
    }
    
    seasonalIndices[seasonalPosition].push(detrendedValues[i]);
  }
  
  // Calculate average for each seasonal position
  const seasonalFactors: Record<number, number> = {};
  for (const [position, values] of Object.entries(seasonalIndices)) {
    const positionIndex = parseInt(position);
    seasonalFactors[positionIndex] = values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  // Apply seasonal factors to the original series
  for (let i = 0; i < n; i++) {
    let seasonalPosition: number;
    
    if (periodicity === 12) {
      seasonalPosition = dates[i].getMonth();
    } else if (periodicity === 7) {
      seasonalPosition = dates[i].getDay();
    } else if (periodicity === 24) {
      seasonalPosition = dates[i].getHours();
    } else {
      seasonalPosition = i % periodicity;
    }
    
    seasonal[i] = seasonalFactors[seasonalPosition] || 0;
  }
  
  return seasonal;
}

/**
 * Normalize seasonal component to ensure it sums to zero (additive) or averages to 1 (multiplicative)
 * 
 * @param seasonal Seasonal component
 * @param method Decomposition method ('additive' or 'multiplicative')
 * @returns Normalized seasonal component
 */
function normalizeSeasonal(seasonal: number[], method: 'multiplicative' | 'additive'): number[] {
  if (method === 'additive') {
    // For additive method, ensure seasonal component sums to zero
    const seasonalMean = seasonal.reduce((sum, val) => sum + val, 0) / seasonal.length;
    return seasonal.map(val => val - seasonalMean);
  } else {
    // For multiplicative method, ensure seasonal component averages to 1
    const seasonalMean = seasonal.reduce((sum, val) => sum + val, 0) / seasonal.length;
    if (seasonalMean === 0) return seasonal; // Avoid division by zero
    return seasonal.map(val => val / seasonalMean);
  }
}

/**
 * Calculate seasonal strength as proportion of variance explained by seasonality
 * 
 * @param seasonal Seasonal component
 * @param residual Residual component
 * @returns Seasonal strength (0-1)
 */
function calculateSeasonalStrength(seasonal: number[], residual: number[]): number {
  const seasonalVar = calculateVariance(seasonal);
  const residualVar = calculateVariance(residual);
  
  if (seasonalVar + residualVar === 0) return 0;
  
  return Math.max(0, Math.min(1, seasonalVar / (seasonalVar + residualVar)));
}

/**
 * Calculate variance of an array of numbers
 * 
 * @param values Array of numbers
 * @returns Variance
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Detect seasonality periods in time series data
 * 
 * @param data Array of time series data points
 * @returns Array of detected seasonal periods
 */
export function detectSeasonalPeriods(data: TimeSeriesPoint[]): number[] {
  if (data.length < 24) {
    throw new Error('Insufficient data for detecting seasonal periods. Need at least 24 data points.');
  }
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Extract values
  const values = sortedData.map(point => point.value);
  
  // Calculate autocorrelation for different lags
  const maxLag = Math.floor(values.length / 3); // Don't check lags greater than 1/3 of series length
  const autocorrelations: { lag: number; value: number }[] = [];
  
  for (let lag = 1; lag <= maxLag; lag++) {
    const acf = calculateAutocorrelation(values, lag);
    autocorrelations.push({ lag, value: acf });
  }
  
  // Sort autocorrelations by value (descending)
  autocorrelations.sort((a, b) => b.value - a.value);
  
  // Find significant peaks in autocorrelation
  const significantThreshold = 0.3; // Autocorrelation threshold for significance
  const significantPeriods = autocorrelations
    .filter(ac => ac.value > significantThreshold)
    .map(ac => ac.lag);
  
  // Check for common seasonal periods
  const commonPeriods = [12, 24, 7, 30, 365];
  for (const period of commonPeriods) {
    if (period <= maxLag && !significantPeriods.includes(period)) {
      const acf = calculateAutocorrelation(values, period);
      if (acf > 0.2) { // Lower threshold for common periods
        significantPeriods.push(period);
      }
    }
  }
  
  return significantPeriods;
}

/**
 * Calculate autocorrelation of a time series at a specific lag
 * 
 * @param values Array of time series values
 * @param lag Lag to calculate autocorrelation for
 * @returns Autocorrelation value (-1 to 1)
 */
function calculateAutocorrelation(values: number[], lag: number): number {
  const n = values.length;
  if (lag >= n) return 0;
  
  // Calculate mean
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate variance
  let variance = 0;
  for (let i = 0; i < n; i++) {
    variance += Math.pow(values[i] - mean, 2);
  }
  
  if (variance === 0) return 0; // Avoid division by zero
  
  // Calculate autocorrelation
  let autocorrelation = 0;
  for (let i = 0; i < n - lag; i++) {
    autocorrelation += (values[i] - mean) * (values[i + lag] - mean);
  }
  
  return autocorrelation / variance;
}

/**
 * Calculate seasonal indices for monthly, daily, and hourly patterns
 * 
 * @param data Array of time series data points
 * @param options Options for index calculation
 * @returns Seasonal indices for different time periods
 */
export function calculateSeasonalIndices(
  data: TimeSeriesPoint[],
  options: {
    calculateMonthly?: boolean;
    calculateDaily?: boolean;
    calculateHourly?: boolean;
    method?: 'multiplicative' | 'additive';
  } = {}
): SeasonalIndices {
  if (data.length < 24) {
    throw new Error('Insufficient data for calculating seasonal indices. Need at least 24 data points.');
  }
  
  // Default options
  const calculateMonthly = options.calculateMonthly !== undefined ? options.calculateMonthly : true;
  const calculateDaily = options.calculateDaily !== undefined ? options.calculateDaily : false;
  const calculateHourly = options.calculateHourly !== undefined ? options.calculateHourly : false;
  const method = options.method || 'multiplicative';
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const result: SeasonalIndices = {
    monthly: {}
  };
  
  // Calculate monthly indices
  if (calculateMonthly) {
    const monthlyData: Record<number, number[]> = {};
    
    // Group data by month
    for (const point of sortedData) {
      const month = point.date.getMonth() + 1; // 1-12
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(point.value);
    }
    
    // Calculate average for each month
    const monthlyAverages: Record<number, number> = {};
    for (const [month, values] of Object.entries(monthlyData)) {
      const monthNum = parseInt(month);
      monthlyAverages[monthNum] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    // Calculate overall average
    const allValues = sortedData.map(point => point.value);
    const overallAverage = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    
    // Calculate indices
    for (const month of Object.keys(monthlyAverages).map(Number)) {
      if (method === 'multiplicative' && overallAverage !== 0) {
        result.monthly[month] = monthlyAverages[month] / overallAverage;
      } else {
        result.monthly[month] = monthlyAverages[month] - overallAverage;
      }
    }
  }
  
  // Calculate daily indices if requested
  if (calculateDaily) {
    result.dailyOfWeek = {};
    result.dailyOfMonth = {};
    
    // Calculate daily of week indices (grouping by day of week)
    const dailyOfWeekData: Record<number, number[]> = {};
    for (const point of sortedData) {
      const dayOfWeek = point.date.getDay(); // 0-6
      if (!dailyOfWeekData[dayOfWeek]) {
        dailyOfWeekData[dayOfWeek] = [];
      }
      dailyOfWeekData[dayOfWeek].push(point.value);
    }
    
    // Calculate average for each day of week
    const dailyOfWeekAverages: Record<number, number> = {};
    for (const [day, values] of Object.entries(dailyOfWeekData)) {
      const dayNum = parseInt(day);
      dailyOfWeekAverages[dayNum] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    // Calculate overall average
    const allValues = sortedData.map(point => point.value);
    const overallAverage = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    
    // Calculate indices for day of week
    for (const day of Object.keys(dailyOfWeekAverages).map(Number)) {
      if (method === 'multiplicative' && overallAverage !== 0) {
        result.dailyOfWeek[day] = dailyOfWeekAverages[day] / overallAverage;
      } else {
        result.dailyOfWeek[day] = dailyOfWeekAverages[day] - overallAverage;
      }
    }
    
    // Similarly calculate day of month indices
    const dailyOfMonthData: Record<number, number[]> = {};
    for (const point of sortedData) {
      const dayOfMonth = point.date.getDate(); // 1-31
      if (!dailyOfMonthData[dayOfMonth]) {
        dailyOfMonthData[dayOfMonth] = [];
      }
      dailyOfMonthData[dayOfMonth].push(point.value);
    }
    
    // Calculate average for each day of month
    const dailyOfMonthAverages: Record<number, number> = {};
    for (const [day, values] of Object.entries(dailyOfMonthData)) {
      const dayNum = parseInt(day);
      dailyOfMonthAverages[dayNum] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    // Calculate indices for day of month
    for (const day of Object.keys(dailyOfMonthAverages).map(Number)) {
      if (method === 'multiplicative' && overallAverage !== 0) {
        result.dailyOfMonth[day] = dailyOfMonthAverages[day] / overallAverage;
      } else {
        result.dailyOfMonth[day] = dailyOfMonthAverages[day] - overallAverage;
      }
    }
  }
  
  // Calculate hourly indices if requested
  if (calculateHourly) {
    result.hourly = {};
    
    // Check if data has hourly resolution
    const hasHourlyResolution = sortedData.some((point, i) => {
      if (i === 0) return false;
      const diffMs = point.date.getTime() - sortedData[i - 1].date.getTime();
      return diffMs < 24 * 60 * 60 * 1000; // Less than a day
    });
    
    if (!hasHourlyResolution) {
      console.warn('Data does not have hourly resolution. Hourly indices may not be meaningful.');
    }
    
    // Group data by hour
    const hourlyData: Record<number, number[]> = {};
    for (const point of sortedData) {
      const hour = point.date.getHours(); // 0-23
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(point.value);
    }
    
    // Calculate average for each hour
    const hourlyAverages: Record<number, number> = {};
    for (const [hour, values] of Object.entries(hourlyData)) {
      const hourNum = parseInt(hour);
      hourlyAverages[hourNum] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    // Calculate overall average
    const allValues = sortedData.map(point => point.value);
    const overallAverage = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    
    // Calculate indices for hour
    for (const hour of Object.keys(hourlyAverages).map(Number)) {
      if (method === 'multiplicative' && overallAverage !== 0) {
        result.hourly[hour] = hourlyAverages[hour] / overallAverage;
      } else {
        result.hourly[hour] = hourlyAverages[hour] - overallAverage;
      }
    }
  }
  
  return result;
}

/**
 * Apply seasonal adjustment to time series data
 * 
 * @param data Time series data points
 * @param seasonalIndices Seasonal indices to apply
 * @param options Adjustment options
 * @returns Seasonally adjusted data
 */
export function applySeasonalAdjustment(
  data: TimeSeriesPoint[],
  seasonalIndices: SeasonalIndices,
  options: {
    method?: 'multiplicative' | 'additive';
    adjustForMonthly?: boolean;
    adjustForDaily?: boolean;
    adjustForHourly?: boolean;
  } = {}
): TimeSeriesPoint[] {
  // Default options
  const method = options.method || 'multiplicative';
  const adjustForMonthly = options.adjustForMonthly !== undefined ? options.adjustForMonthly : true;
  const adjustForDaily = options.adjustForDaily !== undefined ? options.adjustForDaily : false;
  const adjustForHourly = options.adjustForHourly !== undefined ? options.adjustForHourly : false;
  
  // Create a copy of the data
  const adjustedData: TimeSeriesPoint[] = data.map(point => ({
    date: new Date(point.date),
    value: point.value
  }));
  
  // Apply monthly adjustment if requested
  if (adjustForMonthly && seasonalIndices.monthly) {
    for (const point of adjustedData) {
      const month = point.date.getMonth() + 1; // 1-12
      const monthlyIndex = seasonalIndices.monthly[month];
      
      if (monthlyIndex !== undefined) {
        if (method === 'multiplicative' && monthlyIndex !== 0) {
          point.value /= monthlyIndex;
        } else {
          point.value -= monthlyIndex;
        }
      }
    }
  }
  
  // Apply daily adjustment if requested
  if (adjustForDaily && seasonalIndices.dailyOfWeek) {
    for (const point of adjustedData) {
      const dayOfWeek = point.date.getDay(); // 0-6
      const dailyIndex = seasonalIndices.dailyOfWeek[dayOfWeek];
      
      if (dailyIndex !== undefined) {
        if (method === 'multiplicative' && dailyIndex !== 0) {
          point.value /= dailyIndex;
        } else {
          point.value -= dailyIndex;
        }
      }
    }
  }
  
  // Apply hourly adjustment if requested
  if (adjustForHourly && seasonalIndices.hourly) {
    for (const point of adjustedData) {
      const hour = point.date.getHours(); // 0-23
      const hourlyIndex = seasonalIndices.hourly[hour];
      
      if (hourlyIndex !== undefined) {
        if (method === 'multiplicative' && hourlyIndex !== 0) {
          point.value /= hourlyIndex;
        } else {
          point.value -= hourlyIndex;
        }
      }
    }
  }
  
  return adjustedData;
}

/**
 * Calculate heating and cooling degree days from temperature data
 * 
 * @param data Temperature time series data
 * @param options Degree day calculation options
 * @returns Object containing HDD and CDD arrays
 */
export function calculateDegreeDays(
  data: TimeSeriesPoint[],
  options: {
    baseHeatingTemp?: number;
    baseCoolingTemp?: number;
    unit?: 'fahrenheit' | 'celsius';
  } = {}
): { 
  heatingDegreeDays: TimeSeriesPoint[]; 
  coolingDegreeDays: TimeSeriesPoint[];
  monthlyHdd: Record<number, number>;
  monthlyCdd: Record<number, number>;
} {
  // Default options
  const baseHeatingTemp = options.baseHeatingTemp || (options.unit === 'celsius' ? 18 : 65); // 18°C or 65°F
  const baseCoolingTemp = options.baseCoolingTemp || (options.unit === 'celsius' ? 18 : 65); // 18°C or 65°F
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const heatingDegreeDays: TimeSeriesPoint[] = [];
  const coolingDegreeDays: TimeSeriesPoint[] = [];
  
  // Calculate HDD and CDD for each day
  for (const point of sortedData) {
    const hdd = Math.max(0, baseHeatingTemp - point.value);
    const cdd = Math.max(0, point.value - baseCoolingTemp);
    
    heatingDegreeDays.push({
      date: new Date(point.date),
      value: hdd
    });
    
    coolingDegreeDays.push({
      date: new Date(point.date),
      value: cdd
    });
  }
  
  // Also calculate monthly totals
  const monthlyHdd: Record<number, number> = {};
  const monthlyCdd: Record<number, number> = {};
  
  for (let i = 0; i < sortedData.length; i++) {
    const month = sortedData[i].date.getMonth() + 1; // 1-12
    
    if (monthlyHdd[month] === undefined) {
      monthlyHdd[month] = 0;
      monthlyCdd[month] = 0;
    }
    
    monthlyHdd[month] += heatingDegreeDays[i].value;
    monthlyCdd[month] += coolingDegreeDays[i].value;
  }
  
  return {
    heatingDegreeDays,
    coolingDegreeDays,
    monthlyHdd,
    monthlyCdd
  };
}

/**
 * Calculate temperature sensitivity (energy usage per degree day)
 * 
 * @param energyData Energy consumption time series data
 * @param temperatureData Temperature time series data
 * @param options Sensitivity calculation options
 * @returns Temperature sensitivity coefficient
 */
export function calculateTemperatureSensitivity(
  energyData: TimeSeriesPoint[],
  temperatureData: TimeSeriesPoint[],
  options: {
    baseHeatingTemp?: number;
    baseCoolingTemp?: number;
    unit?: 'fahrenheit' | 'celsius';
    splitHeatingCooling?: boolean;
  } = {}
): {
  heatingSensitivity: number;
  coolingSensitivity: number;
  r2: number;
} {
  if (energyData.length < 10 || temperatureData.length < 10) {
    throw new Error('Insufficient data for calculating temperature sensitivity.');
  }
  
  // Default options
  const baseHeatingTemp = options.baseHeatingTemp || (options.unit === 'celsius' ? 18 : 65);
  const baseCoolingTemp = options.baseCoolingTemp || (options.unit === 'celsius' ? 18 : 65);
  const splitHeatingCooling = options.splitHeatingCooling !== undefined ? options.splitHeatingCooling : true;
  
  // Calculate degree days
  const degreeDays = calculateDegreeDays(temperatureData, {
    baseHeatingTemp,
    baseCoolingTemp,
    unit: options.unit
  });
  
  // Match energy data with degree days
  // This assumes both datasets cover the same period and have similar sampling
  
  // Create a map of dates to degree days for easier lookup
  const hddMap = new Map<string, number>();
  const cddMap = new Map<string, number>();
  
  for (const point of degreeDays.heatingDegreeDays) {
    const dateStr = point.date.toISOString().split('T')[0];
    hddMap.set(dateStr, point.value);
  }
  
  for (const point of degreeDays.coolingDegreeDays) {
    const dateStr = point.date.toISOString().split('T')[0];
    cddMap.set(dateStr, point.value);
  }
  
  // Prepare data for regression
  const data: { energy: number; hdd: number; cdd: number }[] = [];
  
  for (const point of energyData) {
    const dateStr = point.date.toISOString().split('T')[0];
    const hdd = hddMap.get(dateStr) || 0;
    const cdd = cddMap.get(dateStr) || 0;
    
    data.push({
      energy: point.value,
      hdd,
      cdd
    });
  }
  
  if (splitHeatingCooling) {
    // Perform multivariate regression (energy = baseload + hddCoef * hdd + cddCoef * cdd)
    return multipleLinearRegression(data);
  } else {
    // Combine HDD and CDD and perform simple regression
    const combinedData = data.map(point => ({
      energy: point.energy,
      dd: point.hdd + point.cdd
    }));
    
    const result = simpleLinearRegression(combinedData);
    return {
      heatingSensitivity: result.slope,
      coolingSensitivity: result.slope,
      r2: result.r2
    };
  }
}

/**
 * Perform simple linear regression
 * 
 * @param data Array of {x, y} points
 * @returns Regression results
 */
/**
 * Perform multiple linear regression with two independent variables
 * 
 * @param data Array of data points with energy, hdd, and cdd values
 * @returns Regression results
 */
function multipleLinearRegression(
  data: { energy: number; hdd: number; cdd: number }[]
): {
  heatingSensitivity: number;
  coolingSensitivity: number;
  r2: number;
} {
  if (data.length < 3) {
    throw new Error('Insufficient data for multiple linear regression. Need at least 3 data points.');
  }
  
  // Calculate means
  let sumEnergy = 0, sumHdd = 0, sumCdd = 0;
  for (const point of data) {
    sumEnergy += point.energy;
    sumHdd += point.hdd;
    sumCdd += point.cdd;
  }
  
  const meanEnergy = sumEnergy / data.length;
  const meanHdd = sumHdd / data.length;
  const meanCdd = sumCdd / data.length;
  
  // Calculate sums of squares and products
  let sumHddEnergy = 0, sumCddEnergy = 0, sumHddCdd = 0;
  let sumHddSq = 0, sumCddSq = 0, sumEnergySq = 0;
  
  for (const point of data) {
    // Center the variables to improve numerical stability
    const hddCentered = point.hdd - meanHdd;
    const cddCentered = point.cdd - meanCdd;
    const energyCentered = point.energy - meanEnergy;
    
    sumHddEnergy += hddCentered * energyCentered;
    sumCddEnergy += cddCentered * energyCentered;
    sumHddCdd += hddCentered * cddCentered;
    
    sumHddSq += hddCentered * hddCentered;
    sumCddSq += cddCentered * cddCentered;
    sumEnergySq += energyCentered * energyCentered;
  }
  
  // Calculate regression coefficients
  // For solving the normal equations:
  // b1 * sumHddSq + b2 * sumHddCdd = sumHddEnergy
  // b1 * sumHddCdd + b2 * sumCddSq = sumCddEnergy
  
  const denominator = sumHddSq * sumCddSq - sumHddCdd * sumHddCdd;
  
  if (Math.abs(denominator) < 1e-10) {
    // Near-singular matrix, fall back to individual regressions
    const heatingSensitivity = sumHddSq === 0 ? 0 : sumHddEnergy / sumHddSq;
    const coolingSensitivity = sumCddSq === 0 ? 0 : sumCddEnergy / sumCddSq;
    
    return {
      heatingSensitivity,
      coolingSensitivity,
      r2: 0.5 // Approximate R² as we can't calculate it properly
    };
  }
  
  const heatingSensitivity = (sumHddEnergy * sumCddSq - sumCddEnergy * sumHddCdd) / denominator;
  const coolingSensitivity = (sumCddEnergy * sumHddSq - sumHddEnergy * sumHddCdd) / denominator;
  
  // Calculate R²
  let sumPredictionSquaredError = 0;
  let sumTotalSquaredError = 0;
  
  for (const point of data) {
    const predicted = meanEnergy + 
      heatingSensitivity * (point.hdd - meanHdd) + 
      coolingSensitivity * (point.cdd - meanCdd);
    
    sumPredictionSquaredError += Math.pow(point.energy - predicted, 2);
    sumTotalSquaredError += Math.pow(point.energy - meanEnergy, 2);
  }
  
  // Calculate R²
  const r2 = Math.max(0, 1 - (sumPredictionSquaredError / sumTotalSquaredError));
  
  return {
    heatingSensitivity,
    coolingSensitivity,
    r2
  };
}

/**
 * Perform simple linear regression
 * 
 * @param data Array of {energy, dd} points for degree days
 * @returns Regression results
 */
function simpleLinearRegression(
  data: { energy: number; dd: number }[]
): { slope: number; intercept: number; r2: number } {
  if (data.length < 2) {
    throw new Error('Insufficient data for simple linear regression. Need at least 2 data points.');
  }
  
  // Calculate means
  let sumX = 0, sumY = 0;
  for (const point of data) {
    sumX += point.dd;
    sumY += point.energy;
  }
  
  const meanX = sumX / data.length;
  const meanY = sumY / data.length;
  
  // Calculate regression coefficients
  let sumXY = 0, sumXX = 0, sumYY = 0;
  for (const point of data) {
    const xCentered = point.dd - meanX;
    const yCentered = point.energy - meanY;
    
    sumXY += xCentered * yCentered;
    sumXX += xCentered * xCentered;
    sumYY += yCentered * yCentered;
  }
  
  if (sumXX === 0) {
    return {
      slope: 0,
      intercept: meanY,
      r2: 0
    };
  }
  
  const slope = sumXY / sumXX;
  const intercept = meanY - slope * meanX;
  
  // Calculate R²
  let sumPredictionSquaredError = 0;
  for (const point of data) {
    const predicted = intercept + slope * point.dd;
    sumPredictionSquaredError += Math.pow(point.energy - predicted, 2);
  }
  
  const r2 = Math.max(0, 1 - (sumPredictionSquaredError / sumYY));
  
  return {
    slope,
    intercept,
    r2
  };
}
