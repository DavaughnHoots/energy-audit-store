import { describe, expect, test } from '@jest/globals';
import {
  TimeSeriesPoint,
  CyclicalPattern,
  simpleMovingAverage,
  exponentialMovingAverage,
  weightedMovingAverage,
  checkSeasonality,
  seasonalAdjustment,
  generateLinearForecast,
  generateSimpleForecast,
  detectAnomalies,
  gaussianSmooth,
  calculateROI,
  detectTrendChangePoints,
  calculateAutocorrelation,
  findCyclicalPatterns,
  calculateLinearRegressionSlope
} from '../utils/forecastingModels.js';

// Test data for various tests
const testData: TimeSeriesPoint[] = [
  { date: new Date('2025-01-01'), value: 100 },
  { date: new Date('2025-02-01'), value: 120 },
  { date: new Date('2025-03-01'), value: 130 },
  { date: new Date('2025-04-01'), value: 125 },
  { date: new Date('2025-05-01'), value: 150 },
  { date: new Date('2025-06-01'), value: 170 },
  { date: new Date('2025-07-01'), value: 190 },
  { date: new Date('2025-08-01'), value: 180 },
  { date: new Date('2025-09-01'), value: 160 },
  { date: new Date('2025-10-01'), value: 140 },
  { date: new Date('2025-11-01'), value: 130 },
  { date: new Date('2025-12-01'), value: 120 },
  { date: new Date('2026-01-01'), value: 110 },
  { date: new Date('2026-02-01'), value: 130 },
  { date: new Date('2026-03-01'), value: 140 },
  { date: new Date('2026-04-01'), value: 135 },
  { date: new Date('2026-05-01'), value: 160 },
  { date: new Date('2026-06-01'), value: 180 },
  { date: new Date('2026-07-01'), value: 200 },
  { date: new Date('2026-08-01'), value: 190 },
  { date: new Date('2026-09-01'), value: 170 },
  { date: new Date('2026-10-01'), value: 150 },
  { date: new Date('2026-11-01'), value: 140 },
  { date: new Date('2026-12-01'), value: 130 }
];

describe('Forecasting Models - Moving Averages', () => {
  test('Simple Moving Average - should calculate correctly', () => {
    const window = 3;
    const result = simpleMovingAverage(testData, window);
    
    // Length should be original length minus window - 1
    expect(result.length).toBe(testData.length - window + 1);
    
    // First SMA value should be average of first 3 points
    expect(result[0].value).toBeCloseTo((100 + 120 + 130) / 3, 10);
    
    // Check a few more values
    expect(result[1].value).toBeCloseTo((120 + 130 + 125) / 3, 10);
    expect(result[2].value).toBeCloseTo((130 + 125 + 150) / 3, 10);
  });

  test('Simple Moving Average - should throw error for insufficient data', () => {
    const shortData = testData.slice(0, 2); // Only two points
    const window = 3;
    
    expect(() => {
      simpleMovingAverage(shortData, window);
    }).toThrow(/Insufficient data points/);
  });

  test('Weighted Moving Average - should calculate correctly', () => {
    const weights = [0.5, 0.3, 0.2]; // Weights must sum to 1
    const result = weightedMovingAverage(testData, weights);
    
    // Length should be original length minus weights length + 1
    expect(result.length).toBe(testData.length - weights.length + 1);
    
    // First WMA value should be weighted average of first 3 points
    const expectedFirstValue = 
      100 * weights[0] + 
      120 * weights[1] + 
      130 * weights[2];
    
    expect(result[0].value).toBeCloseTo(expectedFirstValue, 10);
  });

  test('Weighted Moving Average - should throw error for invalid weights', () => {
    const invalidWeights = [0.5, 0.3, 0.1]; // Sum is 0.9, not 1
    
    expect(() => {
      weightedMovingAverage(testData, invalidWeights);
    }).toThrow(/Weights must sum to 1/);
  });

  test('Exponential Moving Average - should calculate correctly', () => {
    const alpha = 0.3;
    const result = exponentialMovingAverage(testData, alpha);
    
    // Length should be same as original data
    expect(result.length).toBe(testData.length);
    
    // First EMA value should be same as first data point
    expect(result[0].value).toBe(testData[0].value);
    
    // Second EMA value should be calculated using the formula
    const expectedSecondValue = 
      alpha * testData[1].value + 
      (1 - alpha) * result[0].value;
    
    expect(result[1].value).toBeCloseTo(expectedSecondValue, 10);
  });

  test('Exponential Moving Average - should throw error for invalid alpha', () => {
    const invalidAlpha = 1.2; // Alpha must be between 0 and 1
    
    expect(() => {
      exponentialMovingAverage(testData, invalidAlpha);
    }).toThrow(/Alpha must be between 0 and 1/);
  });
});

describe('Forecasting Models - Time Series Analysis', () => {
  test('Calculate Linear Regression Slope - should calculate correctly', () => {
    // Create test data with known slope
    const slopeData: TimeSeriesPoint[] = [
      { date: new Date('2025-01-01'), value: 10 },
      { date: new Date('2025-01-02'), value: 20 },
      { date: new Date('2025-01-03'), value: 30 },
      { date: new Date('2025-01-04'), value: 40 },
      { date: new Date('2025-01-05'), value: 50 }
    ];
    
    const slope = calculateLinearRegressionSlope(slopeData);
    
    // The slope should be 10 (points increase by 10 for each time unit)
    expect(slope).toBeCloseTo(10, 5);
  });
  
  test('Calculate Linear Regression Slope - should handle flat data', () => {
    // Create flat test data (slope should be 0)
    const flatData: TimeSeriesPoint[] = [
      { date: new Date('2025-01-01'), value: 10 },
      { date: new Date('2025-01-02'), value: 10 },
      { date: new Date('2025-01-03'), value: 10 },
      { date: new Date('2025-01-04'), value: 10 }
    ];
    
    const slope = calculateLinearRegressionSlope(flatData);
    
    // The slope should be 0 (flat line)
    expect(slope).toBeCloseTo(0, 5);
  });
  
  test('Detect Trend Change Points - should identify trend changes', () => {
    // Create data with a clear trend change
    const trendChangeData: TimeSeriesPoint[] = [
      { date: new Date('2025-01-01'), value: 10 },
      { date: new Date('2025-01-02'), value: 20 },
      { date: new Date('2025-01-03'), value: 30 },
      { date: new Date('2025-01-04'), value: 40 },
      { date: new Date('2025-01-05'), value: 50 },
      // Change point here
      { date: new Date('2025-01-06'), value: 40 },
      { date: new Date('2025-01-07'), value: 30 },
      { date: new Date('2025-01-08'), value: 20 },
      { date: new Date('2025-01-09'), value: 10 },
      { date: new Date('2025-01-10'), value: 0 }
    ];
    
    const changePoints = detectTrendChangePoints(trendChangeData, 3, 2.0);
    
    // Should detect at least one change point
    expect(changePoints.length).toBeGreaterThan(0);
    
    // The change point should be around the 6th data point
    if (changePoints.length > 0) {
      const changePointDate = new Date('2025-01-06');
      const found = changePoints.some(point => 
        Math.abs(point.date.getTime() - changePointDate.getTime()) < 24 * 60 * 60 * 1000
      );
      expect(found).toBe(true);
    }
  });
  
  test('Detect Trend Change Points - should handle insufficient data', () => {
    const shortData = testData.slice(0, 3); // Only three points
    
    expect(() => {
      detectTrendChangePoints(shortData, 3);
    }).toThrow(/Insufficient data points/);
  });
  
  test('Calculate Autocorrelation - should calculate correctly', () => {
    // Create data with known autocorrelation
    const periodicData: TimeSeriesPoint[] = [
      { date: new Date('2025-01-01'), value: 10 },
      { date: new Date('2025-01-02'), value: 20 },
      { date: new Date('2025-01-03'), value: 10 },
      { date: new Date('2025-01-04'), value: 20 },
      { date: new Date('2025-01-05'), value: 10 },
      { date: new Date('2025-01-06'), value: 20 }
    ];
    
    // With lag 2, we should have perfect correlation (1.0)
    const correlation = calculateAutocorrelation(periodicData, 2);
    
    // Should be very close to 1.0 (perfect correlation)
    expect(correlation).toBeCloseTo(1.0, 5);
  });
  
  test('Calculate Autocorrelation - should handle insufficient data', () => {
    // Create short data
    const shortData = testData.slice(0, 3); // Only three points
    const lag = 3;
    
    expect(() => {
      calculateAutocorrelation(shortData, lag);
    }).toThrow(/Insufficient data points/);
  });
  
  test('Find Cyclical Patterns - should detect periodic patterns', () => {
    // Create data with a weekly pattern (period of 7)
    const weeklyData: TimeSeriesPoint[] = [];
    
    // Generate 8 weeks of data with weekly pattern
    for (let week = 0; week < 8; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date('2025-01-01');
        date.setDate(date.getDate() + week * 7 + day);
        
        // Set values to create a weekly pattern
        // Mondays (day 0) have value 100, Tuesdays 90, etc.
        const value = 100 - day * 10;
        
        weeklyData.push({ date, value });
      }
    }
    
    const patterns = findCyclicalPatterns(weeklyData, 15, 0.5);
    
    // Should detect at least one pattern
    expect(patterns.length).toBeGreaterThan(0);
    
    // Should find the weekly pattern (period 7)
    const foundWeeklyPattern = patterns.some(pattern => pattern.period === 7);
    expect(foundWeeklyPattern).toBe(true);
  });
  
  test('Find Cyclical Patterns - should sort by strength', () => {
    const patterns = findCyclicalPatterns(testData, 20, 0.1);
    
    // If we have multiple patterns, they should be sorted by strength
    if (patterns.length >= 2) {
      // Check that patterns are sorted by strength in descending order
      for (let i = 1; i < patterns.length; i++) {
        expect(Math.abs(patterns[i-1].strength)).toBeGreaterThanOrEqual(Math.abs(patterns[i].strength));
      }
    }
  });
  
  test('Find Cyclical Patterns - should handle insufficient data', () => {
    const shortData = testData.slice(0, 3); // Only three points
    
    expect(() => {
      findCyclicalPatterns(shortData);
    }).toThrow(/Insufficient data points/);
  });
});

describe('Forecasting Models - Seasonality Analysis', () => {
  test('Check Seasonality - should detect yearly seasonality', () => {
    const period = 12; // 12 months in a year
    const correlation = checkSeasonality(testData, period);
    
    // We should have a positive correlation indicating seasonality
    expect(correlation).toBeGreaterThan(0.5);
  });

  test('Check Seasonality - should throw error for insufficient data', () => {
    const shortData = testData.slice(0, 15); // Not enough for two periods of 12
    const period = 12;
    
    expect(() => {
      checkSeasonality(shortData, period);
    }).toThrow(/Insufficient data points/);
  });

  test('Seasonal Adjustment - should remove seasonality', () => {
    const period = 12;
    const adjustedData = seasonalAdjustment(testData, period);
    
    // Length should be same as original data
    expect(adjustedData.length).toBe(testData.length);
    
    // Check that seasonality is reduced
    const originalSeasonality = checkSeasonality(testData, period);
    const adjustedSeasonality = checkSeasonality(adjustedData, period);
    
    // The seasonality after adjustment should be lower
    expect(Math.abs(adjustedSeasonality)).toBeLessThan(Math.abs(originalSeasonality));
  });
});

describe('Forecasting Models - Forecasting', () => {
  test('Generate Simple Forecast - should create future points', () => {
    const periods = 3;
    const interval = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    const forecast = generateSimpleForecast(testData, periods, interval);
    
    // Should return the requested number of forecasted points
    expect(forecast.length).toBe(periods);
    
    // First forecasted date should be interval after the last data point
    const lastDate = testData[testData.length - 1].date;
    const expectedFirstDate = new Date(lastDate.getTime() + interval);
    
    expect(forecast[0].date.getTime()).toBe(expectedFirstDate.getTime());
    
    // Second forecasted date should be 2*interval after the last data point
    const expectedSecondDate = new Date(lastDate.getTime() + 2 * interval);
    expect(forecast[1].date.getTime()).toBe(expectedSecondDate.getTime());
  });

  test('Generate Linear Forecast - should forecast based on trend', () => {
    const periods = 3;
    const interval = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    const forecast = generateLinearForecast(testData, periods, interval);
    
    // Should return the requested number of forecasted points
    expect(forecast.length).toBe(periods);
    
    // Values should follow the linear trend
    expect(forecast[1].value - forecast[0].value).toBeCloseTo(forecast[2].value - forecast[1].value, 10);
  });
});

describe('Forecasting Models - Anomaly Detection', () => {
  test('Detect Anomalies - should identify outliers', () => {
    // Create data with anomalies
    const dataWithAnomalies = [
      ...testData,
      { date: new Date('2027-01-01'), value: 500 }, // Anomaly - much higher
      { date: new Date('2027-02-01'), value: 10 }   // Anomaly - much lower
    ];
    
    const anomalies = detectAnomalies(dataWithAnomalies, 2); // Z-score threshold of 2
    
    // Should detect the two anomalies
    expect(anomalies.length).toBe(2);
    expect(anomalies[0].value).toBe(500);
    expect(anomalies[1].value).toBe(10);
  });

  test('Gaussian Smooth - should smooth out noise', () => {
    // Create noisy data
    const noisyData = testData.map(point => ({
      date: new Date(point.date),
      value: point.value + (Math.random() - 0.5) * 20 // Add noise
    }));
    
    const smoothedData = gaussianSmooth(noisyData, 1, 5);
    
    // Length should be original length minus kernel size - 1
    const kernelSize = 5;
    const halfKernel = Math.floor(kernelSize / 2);
    expect(smoothedData.length).toBe(noisyData.length - 2 * halfKernel);
    
    // The variance of smoothed data should be less than noisy data
    const noisyValues = noisyData.map(point => point.value);
    const smoothedValues = smoothedData.map(point => point.value);
    
    const noisyVariance = calculateVariance(noisyValues);
    const smoothedVariance = calculateVariance(smoothedValues);
    
    expect(smoothedVariance).toBeLessThan(noisyVariance);
  });
});

describe('Forecasting Models - ROI Calculations', () => {
  test('Calculate ROI - should compute investment metrics', () => {
    const implementationCost = 10000;
    const annualSavings = 2000;
    const yearsOfOperation = 10;
    const discountRate = 0.05;
    
    const result = calculateROI(
      implementationCost, 
      annualSavings, 
      yearsOfOperation, 
      discountRate
    );
    
    // Payback period should be implementation cost / annual savings
    expect(result.simplePaybackPeriod).toBeCloseTo(implementationCost / annualSavings, 10);
    
    // ROI should be (total savings - cost) / cost
    const totalSavings = annualSavings * yearsOfOperation;
    expect(result.roi).toBeCloseTo((totalSavings - implementationCost) / implementationCost, 10);
    
    // NPV should be positive if investment is good
    expect(result.npv).toBeGreaterThan(0);
    
    // IRR should exist and be positive
    expect(result.irr).toBeDefined();
    expect(result.irr).toBeGreaterThan(0);
  });

  test('Calculate ROI - should handle edge cases', () => {
    const implementationCost = 10000;
    const annualSavings = 0; // No savings
    const yearsOfOperation = 10;
    
    const result = calculateROI(implementationCost, annualSavings, yearsOfOperation);
    
    // Payback period should be Infinity when savings are zero
    expect(result.simplePaybackPeriod).toBe(Infinity);
    
    // ROI should be negative
    expect(result.roi).toBeLessThan(0);
    
    // IRR should be null for negative/zero cash flows
    expect(result.irr).toBeNull();
  });
});

// Helper functions
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}
