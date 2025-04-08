import { appLogger } from '../config/logger.js';
import { ExtendedEnergyAuditData } from '../types/energyAuditExtended.js';
import { performEnergyAnalysis } from './energyAnalysisService.js';
import { performHvacAnalysis } from './hvacAnalysisService.js';
import { performLightingAnalysis } from './lightingAnalysisService.js';
import { performHumidityAnalysis } from './humidityAnalysisService.js';
import { generateComprehensiveRecommendations } from './recommendationService.js';
import { calculateOverallEfficiencyScore } from './efficiencyScoreService.js';
import { performFinancialAnalysis } from './financialAnalysisService.js';

/**
 * Extended Calculation Service
 * 
 * This service coordinates the comprehensive energy audit analysis by delegating to specialized services:
 * - Energy Analysis: Analyzes energy consumption data
 * - HVAC Analysis: Analyzes heating and cooling system data
 * - Lighting Analysis: Analyzes lighting system data
 * - Humidity Analysis: Analyzes humidity control data
 * - Recommendation Generation: Generates recommendations based on analysis results
 * - Efficiency Scoring: Calculates overall efficiency scores
 * - Financial Analysis: Analyzes financial aspects of recommendations
 */
export class ExtendedCalculationService {
  /**
   * Perform comprehensive analysis (matching Python tool's perform_comprehensive_analysis)
   * 
   * This function coordinates the comprehensive analysis of energy audit data by:
   * 1. Analyzing energy consumption data
   * 2. Analyzing HVAC system data (if available)
   * 3. Analyzing lighting system data (if available)
   * 4. Analyzing humidity control data (if available)
   * 5. Generating recommendations based on analysis results
   * 6. Calculating overall efficiency scores
   * 7. Analyzing financial aspects of recommendations
   * 
   * @param auditData - Complete energy audit data with all components
   * @returns Comprehensive analysis results
   */
  performComprehensiveAnalysis(auditData: ExtendedEnergyAuditData) {
    appLogger.info('Starting comprehensive analysis');
    
    try {
      const results: any = {
        energy: {},
        hvac: {},
        lighting: {},
        humidity: {},
        recommendations: {},
      };
      
      // Energy Analysis
      results.energy = performEnergyAnalysis(auditData.energyConsumption);
      
      // HVAC Analysis
      if (auditData.heatingCooling) {
        results.hvac = performHvacAnalysis(auditData.heatingCooling);
      }
      
      // Lighting Analysis
      if (auditData.currentConditions.lighting) {
        results.lighting = performLightingAnalysis(auditData.currentConditions.lighting);
      }
      
      // Humidity Analysis
      if (auditData.currentConditions.humidity) {
        results.humidity = performHumidityAnalysis(auditData.currentConditions);
      }
      
      // Generate Recommendations
      results.recommendations = generateComprehensiveRecommendations(auditData);
      
      // Calculate overall efficiency score
      results.efficiency_score = calculateOverallEfficiencyScore(results);
      
      // Generate financial analysis
      results.financial_analysis = performFinancialAnalysis(results);
      
      // Add timestamp and metadata
      results.metadata = {
        timestamp: new Date(),
        analysis_version: '1.0',
        building_id: auditData.basicInfo.address,
        analysis_type: 'comprehensive',
      };
      
      appLogger.info('Comprehensive analysis completed successfully');
      return results;
    } catch (error) {
      appLogger.error('Comprehensive analysis failed', { error });
      throw error;
    }
  }
}

// Create and export a singleton instance
export const extendedCalculationService = new ExtendedCalculationService();
