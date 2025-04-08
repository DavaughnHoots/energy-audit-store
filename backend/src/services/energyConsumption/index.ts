/**
 * Energy Consumption Service
 * Centralized module that exports all energy consumption related functionality
 */

// Re-export all operations from their respective files
export * from './basicOperations.js';
export * from './summaryOperations.js';
export * from './analysisOperations.js';
export * from './forecastOperations.js';

// Create a singleton class that can be used in routes
import { 
  addRecord, 
  getRecords, 
  updateRecord, 
  deleteRecord 
} from './basicOperations.js';

import {
  getMonthlySummary,
  getYearlyComparison,
  getAverageDailyConsumption,
  getTotalCosts,
  getConsumptionPercentile
} from './summaryOperations.js';

import {
  calculateBaseline,
  identifyPatterns,
  detectConsumptionAnomalies,
  analyzeConsumption
} from './analysisOperations.js';

import {
  forecastConsumption,
  calculateUpgradeROI,
  calculateCostProjections
} from './forecastOperations.js';

/**
 * Energy Consumption Service class
 * Combines all functionality into a single interface
 */
class EnergyConsumptionService {
  // Basic operations
  addRecord = addRecord;
  getRecords = getRecords;
  updateRecord = updateRecord;
  deleteRecord = deleteRecord;
  
  // Summary operations
  getMonthlySummary = getMonthlySummary;
  getYearlyComparison = getYearlyComparison;
  getAverageDailyConsumption = getAverageDailyConsumption;
  getTotalCosts = getTotalCosts;
  getConsumptionPercentile = getConsumptionPercentile;
  
  // Analysis operations
  calculateBaseline = calculateBaseline;
  identifyPatterns = identifyPatterns;
  detectConsumptionAnomalies = detectConsumptionAnomalies;
  analyzeConsumption = analyzeConsumption;
  
  // Forecast operations
  forecastConsumption = forecastConsumption;
  calculateUpgradeROI = calculateUpgradeROI;
  calculateCostProjections = calculateCostProjections;
}

// Export singleton instance
export const energyConsumptionService = new EnergyConsumptionService();
