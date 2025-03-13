/**
 * Forecasting models for energy consumption analysis
 * These models are used to predict future energy consumption based on historical data
 */

/**
 * Interface for time series data point
 */
export interface TimeSeriesPoint {
  date: Date;
  value: number;
}

/**
 * Calculate simple moving average from time series data
 * @param data Array of data points with date and value
 * @param window Number of points to include in moving average window
 * @returns Array of moving average points
 */
export function simpleMovingAverage(data: TimeSeriesPoint[], window: number): TimeSeriesPoint[] {
  if (data.length < window) {
    throw new Error(`Insufficient data points (${data.length}) for window size ${window}`);
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const result: TimeSeriesPoint[] = [];
  
  for (let i = window - 1; i < sortedData.length; i++) {
    let sum = 0;
    for (let j = 0; j < window; j++) {
      sum += sortedData[i - j].value;
    }
    
    result.push({
      date: new Date(sortedData[i].date),
      value: sum / window
    });
  }
  
  return result;
}

/**
 * Calculate weighted moving average from time series data
 * @param data Array of data points with date and value
 * @param weights Array of weights for each point in the window (should sum to 1)
 * @returns Array of weighted moving average points
 */
export function weightedMovingAverage(data: TimeSeriesPoint[], weights: number[]): TimeSeriesPoint[] {
  if (data.length < weights.length) {
    throw new Error(`Insufficient data points (${data.length}) for weights length ${weights.length}`);
  }
  
  // Validate weights sum to 1 (or very close to it, accounting for floating point errors)
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (Math.abs(weightSum - 1) > 0.00001) {
    throw new Error(`Weights must sum to 1, got ${weightSum}`);
  }
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const result: TimeSeriesPoint[] = [];
  const window = weights.length;
  
  for (let i = window - 1; i < sortedData.length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < window; j++) {
      weightedSum += sortedData[i - j].value * weights[j];
    }
    
    result.push({
      date: new Date(sortedData[i].date),
      value: weightedSum
    });
  }
  
  return result;
}

/**
 * Calculate exponential moving average from time series data
 * @param data Array of data points with date and value
 * @param alpha Smoothing factor (0 < alpha < 1)
 * @returns Array of exponential moving average points
 */
export function exponentialMovingAverage(data: TimeSeriesPoint[], alpha: number): TimeSeriesPoint[] {
  if (data.length < 2) {
    throw new Error(`Insufficient data points (${data.length}), need at least 2`);
  }
  
  if (alpha <= 0 || alpha >= 1) {
    throw new Error(`Alpha must be between 0 and 1, got ${alpha}`);
  }
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const result: TimeSeriesPoint[] = [];
  
  // First point is the same as the first data point
  result.push({
    date: new Date(sortedData[0].date),
    value: sortedData[0].value
  });
  
  // Calculate EMA for the rest of the points
  for (let i = 1; i < sortedData.length; i++) {
    const ema = alpha * sortedData[i].value + (1 - alpha) * result[i - 1].value;
    
    result.push({
      date: new Date(sortedData[i].date),
      value: ema
    });
  }
  
  return result;
}

/**
 * Check for seasonality in time series data
 * @param data Array of data points with date and value
 * @param period Period to check for seasonality (e.g. 12 for monthly data with yearly seasonality)
 * @returns Correlation coefficient indicating seasonality strength (-1 to 1)
 */
export function checkSeasonality(data: TimeSeriesPoint[], period: number): number {
  if (data.length < period * 2) {
    throw new Error(`Insufficient data points (${data.length}) for period ${period}, need at least ${period * 2}`);
  }
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Extract values for correlation calculation
  const values = sortedData.map(point => point.value);
  
  // Calculate correlation between values separated by one period
  const n = values.length - period;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  
  for (let i = 0; i < n; i++) {
    const x = values[i];
    const y = values[i + period];
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  if (denominator === 0) {
    return 0;
  }
  
  return numerator / denominator;
}

/**
 * Apply seasonal adjustment to time series data
 * @param data Array of data points with date and value
 * @param period Seasonality period (e.g. 12 for monthly data with yearly seasonality)
 * @returns Array of seasonally adjusted data points
 */
export function seasonalAdjustment(data: TimeSeriesPoint[], period: number): TimeSeriesPoint[] {
  if (data.length < period * 2) {
    throw new Error(`Insufficient data points (${data.length}) for period ${period}, need at least ${period * 2}`);
  }
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate seasonal indices
  const seasonalIndices: number[] = new Array(period).fill(0);
  const seasonalCounts: number[] = new Array(period).fill(0);
  
  for (let i = 0; i < sortedData.length; i++) {
    const month = sortedData[i].date.getMonth();
    seasonalIndices[month] += sortedData[i].value;
    seasonalCounts[month]++;
  }
  
  // Calculate average for each period
  for (let i = 0; i < period; i++) {
    if (seasonalCounts[i] > 0) {
      seasonalIndices[i] /= seasonalCounts[i];
    }
  }
  
  // Calculate overall average
  const overallAverage = seasonalIndices.reduce((sum, value) => sum + value, 0) / period;
  
  // Normalize seasonal indices
  for (let i = 0; i < period; i++) {
    seasonalIndices[i] = seasonalIndices[i] / overallAverage;
  }
  
  // Apply seasonal adjustment
  const result: TimeSeriesPoint[] = [];
  
  for (const point of sortedData) {
    const month = point.date.getMonth();
    const seasonalIndex = seasonalIndices[month];
    
    result.push({
      date: new Date(point.date),
      value: seasonalIndex !== 0 ? point.value / seasonalIndex : point.value
    });
  }
  
  return result;
}

/**
 * Generate forecast based on time series data using a simple method
 * @param data Array of data points with date and value
 * @param periods Number of periods to forecast
 * @param interval Time interval in milliseconds between forecast points
 * @returns Array of forecast points
 */
export function generateSimpleForecast(data: TimeSeriesPoint[], periods: number, interval: number): TimeSeriesPoint[] {
  if (data.length < 3) {
    throw new Error(`Insufficient data points (${data.length}), need at least 3`);
  }
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Use simple moving average to forecast
  const sma = simpleMovingAverage(sortedData, Math.min(sortedData.length, 3));
  const lastSMA = sma[sma.length - 1].value;
  const lastDate = sortedData[sortedData.length - 1].date;
  
  const result: TimeSeriesPoint[] = [];
  
  for (let i = 0; i < periods; i++) {
    const forecastDate = new Date(lastDate.getTime() + interval * (i + 1));
    result.push({
      date: forecastDate,
      value: lastSMA
    });
  }
  
  return result;
}

/**
 * Generate forecast based on time series data using linear regression
 * @param data Array of data points with date and value
 * @param periods Number of periods to forecast
 * @param interval Time interval in milliseconds between forecast points
 * @returns Array of forecast points
 */
export function generateLinearForecast(data: TimeSeriesPoint[], periods: number, interval: number): TimeSeriesPoint[] {
  if (data.length < 2) {
    throw new Error(`Insufficient data points (${data.length}), need at least 2`);
  }
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Prepare data for linear regression
  const n = sortedData.length;
  const x: number[] = sortedData.map((_, i) => i);
  const y: number[] = sortedData.map(point => point.value);
  
  // Calculate linear regression
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate forecast points
  const result: TimeSeriesPoint[] = [];
  const lastDate = sortedData[sortedData.length - 1].date;
  
  for (let i = 0; i < periods; i++) {
    const forecastDate = new Date(lastDate.getTime() + interval * (i + 1));
    const forecastValue = intercept + slope * (n + i);
    
    result.push({
      date: forecastDate,
      value: forecastValue
    });
  }
  
  return result;
}

/**
 * Calculate the z-score for each point in time series data
 * @param data Array of data points with date and value
 * @returns Array of data points with z-score values
 */
export function calculateZScores(data: TimeSeriesPoint[]): TimeSeriesPoint[] {
  if (data.length < 2) {
    throw new Error(`Insufficient data points (${data.length}), need at least 2`);
  }
  
  // Calculate mean
  const values = data.map(point => point.value);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  
  // Calculate standard deviation
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) {
    return data.map(point => ({
      date: new Date(point.date),
      value: 0 // Z-score is 0 when standard deviation is 0
    }));
  }
  
  // Calculate z-scores
  return data.map(point => ({
    date: new Date(point.date),
    value: (point.value - mean) / stdDev
  }));
}

/**
 * Detect anomalies in time series data using z-scores
 * @param data Array of data points with date and value
 * @param threshold Z-score threshold for anomaly detection
 * @returns Array of anomalous data points
 */
export function detectAnomalies(data: TimeSeriesPoint[], threshold: number = 2): TimeSeriesPoint[] {
  const zScores = calculateZScores(data);
  
  return data.filter((point, i) => 
    Math.abs(zScores[i].value) > threshold
  ).map(point => ({
    date: new Date(point.date),
    value: point.value
  }));
}

/**
 * Smooth time series data using Gaussian filter
 * @param data Array of data points with date and value
 * @param sigma Standard deviation of the Gaussian filter
 * @param kernelSize Size of the kernel (should be odd)
 * @returns Array of smoothed data points
 */
export function gaussianSmooth(data: TimeSeriesPoint[], sigma: number = 1, kernelSize: number = 5): TimeSeriesPoint[] {
  if (data.length < kernelSize) {
    throw new Error(`Insufficient data points (${data.length}) for kernel size ${kernelSize}`);
  }
  
  if (kernelSize % 2 === 0) {
    throw new Error(`Kernel size must be odd, got ${kernelSize}`);
  }
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Generate Gaussian kernel
  const kernel: number[] = [];
  const halfKernel = Math.floor(kernelSize / 2);
  
  for (let i = -halfKernel; i <= halfKernel; i++) {
    kernel.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  }
  
  // Normalize kernel
  const kernelSum = kernel.reduce((sum, value) => sum + value, 0);
  const normalizedKernel = kernel.map(value => value / kernelSum);
  
  // Apply smoothing
  const result: TimeSeriesPoint[] = [];
  
  for (let i = halfKernel; i < sortedData.length - halfKernel; i++) {
    let smoothedValue = 0;
    
    for (let j = -halfKernel; j <= halfKernel; j++) {
      smoothedValue += sortedData[i + j].value * normalizedKernel[j + halfKernel];
    }
    
    result.push({
      date: new Date(sortedData[i].date),
      value: smoothedValue
    });
  }
  
  return result;
}

/**
 * Calculate return on investment (ROI) for energy efficiency upgrades
 * @param implementationCost Total cost of implementing the upgrade
 * @param annualSavings Annual monetary savings from the upgrade
 * @param yearsOfOperation Expected years of operation for the upgrade
 * @param discountRate Annual discount rate for future cash flows (decimal)
 * @returns Object containing ROI metrics
 */
export function calculateROI(
  implementationCost: number,
  annualSavings: number,
  yearsOfOperation: number,
  discountRate: number = 0.03
): {
  simplePaybackPeriod: number;
  roi: number;
  npv: number;
  irr: number | null;
} {
  if (implementationCost <= 0) {
    throw new Error(`Implementation cost must be positive, got ${implementationCost}`);
  }
  
  if (yearsOfOperation <= 0) {
    throw new Error(`Years of operation must be positive, got ${yearsOfOperation}`);
  }
  
  if (discountRate < 0) {
    throw new Error(`Discount rate cannot be negative, got ${discountRate}`);
  }
  
  // Simple payback period (years)
  const simplePaybackPeriod = annualSavings > 0 ? implementationCost / annualSavings : Infinity;
  
  // Return on investment (as a decimal)
  const totalUndiscountedSavings = annualSavings * yearsOfOperation;
  const roi = (totalUndiscountedSavings - implementationCost) / implementationCost;
  
  // Net present value calculation
  let npv = -implementationCost;
  for (let year = 1; year <= yearsOfOperation; year++) {
    npv += annualSavings / Math.pow(1 + discountRate, year);
  }
  
  // Internal rate of return calculation
  // Uses numerical method to find IRR
  let irr: number | null = null;
  
  if (annualSavings > 0) {
    // Basic polynomial solver for IRR
    let low = -0.999; // Can't use -1 as it would cause division by zero
    let high = 1.0;
    
    // Function to calculate NPV with a given rate
    const calculateNPV = (rate: number): number => {
      let npv = -implementationCost;
      for (let year = 1; year <= yearsOfOperation; year++) {
        npv += annualSavings / Math.pow(1 + rate, year);
      }
      return npv;
    };
    
    // Binary search for IRR
    for (let i = 0; i < 1000; i++) { // Max 1000 iterations to prevent infinite loops
      const mid = (low + high) / 2;
      const npvAtMid = calculateNPV(mid);
      
      if (Math.abs(npvAtMid) < 0.0001) {
        irr = mid;
        break;
      } else if (npvAtMid > 0) {
        low = mid;
      } else {
        high = mid;
      }
      
      // If we've narrowed it down enough, break
      if (high - low < 0.0001) {
        irr = mid;
        break;
      }
    }
  }
  
  return {
    simplePaybackPeriod,
    roi,
    npv,
    irr
  };
}
