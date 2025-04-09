import { appLogger, createLogMetadata } from '../utils/logger.js';
import { EnergyAuditData, AuditRecommendation } from '../types/energyAudit.js';
import { reportGenerationService } from './ReportGenerationService.js';
import { getRecommendationCost, getRecommendationSavings } from '../utils/financialCalculations.js';

/**
 * Custom error class for Report Data Service errors
 * Includes HTTP status code for appropriate response handling
 */
class ReportDataError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ReportDataError';
    this.statusCode = statusCode;
  }
}

/**
 * Service to handle report data generation with enhanced error handling
 * and robust JSON parsing of audit data
 */
export class ReportDataService {
  /**
   * Safely parse JSON or return the original object if already parsed
   * @param data The data to parse
   * @returns Parsed object
   */
  private safeParseJson(data: any): any {
    if (!data) return null;
    
    // If already an object, return as is
    if (typeof data === 'object' && !Array.isArray(data)) return data;
    
    // Try to parse if it's a string
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        appLogger.debug('Failed to parse JSON data', { data: data.substring(0, 50) + '...' });
        return null; // Return null for invalid JSON
      }
    }
    
    return null; // Return null for other types
  }
  
  /**
   * Prepare a normalized version of the audit data with proper types
   * This ensures all fields are properly structured even if the database
   * returns stringified JSON
   * 
   * @param rawAudit Raw audit data from database
   * @returns Normalized audit data
   */
  private normalizeAuditData(rawAudit: any): EnergyAuditData {
    // Log what fields we have
    appLogger.debug('Normalizing audit data with fields', { 
      fields: Object.keys(rawAudit)
    });
    
    try {
      // Create a base structure for the normalized data
      const normalizedData: EnergyAuditData = {
        basicInfo: this.safeParseJson(rawAudit.basic_info) || this.safeParseJson(rawAudit.basicInfo) || {},
        homeDetails: this.safeParseJson(rawAudit.home_details) || this.safeParseJson(rawAudit.homeDetails) || {},
        currentConditions: this.safeParseJson(rawAudit.current_conditions) || this.safeParseJson(rawAudit.currentConditions) || {},
        heatingCooling: this.safeParseJson(rawAudit.heating_cooling) || this.safeParseJson(rawAudit.heatingCooling) || {},
        energyConsumption: this.safeParseJson(rawAudit.energy_consumption) || this.safeParseJson(rawAudit.energyConsumption) || {}
      };
      
      // Add product preferences if available
      if (rawAudit.product_preferences || rawAudit.productPreferences) {
        normalizedData.productPreferences = this.safeParseJson(rawAudit.product_preferences) || 
                                           this.safeParseJson(rawAudit.productPreferences);
      }
      
      // Debug log the structure of our normalized data
      appLogger.debug('Successfully normalized audit data', {
        basicInfoKeys: Object.keys(normalizedData.basicInfo),
        homeDetailsKeys: Object.keys(normalizedData.homeDetails),
        currentConditionsKeys: Object.keys(normalizedData.currentConditions),
        heatingCoolingKeys: Object.keys(normalizedData.heatingCooling),
        energyConsumptionKeys: Object.keys(normalizedData.energyConsumption),
        hasProductPreferences: !!normalizedData.productPreferences
      });
      
      // Validate the normalized data structure
      this.validateAuditData(normalizedData);
      
      return normalizedData;
    } catch (error) {
      appLogger.error('Error normalizing audit data', { 
        error: error instanceof Error ? error.message : String(error),
        rawAuditKeys: Object.keys(rawAudit)
      });
      throw new ReportDataError('Failed to normalize audit data for report generation', 500);
    }
  }
  
  /**
   * Validate the structure of audit data to ensure it has required fields
   * @param auditData Normalized audit data
   * @throws ReportDataError if validation fails
   */
  private validateAuditData(auditData: EnergyAuditData): void {
    // Check for essential fields
    if (!auditData.basicInfo || Object.keys(auditData.basicInfo).length === 0) {
      throw new ReportDataError('Basic information is missing or empty', 400);
    }
    
    if (!auditData.homeDetails || Object.keys(auditData.homeDetails).length === 0) {
      throw new ReportDataError('Home details are missing or empty', 400);
    }
    
    if (!auditData.currentConditions || Object.keys(auditData.currentConditions).length === 0) {
      throw new ReportDataError('Current conditions are missing or empty', 400);
    }
    
    if (!auditData.heatingCooling || Object.keys(auditData.heatingCooling).length === 0) {
      throw new ReportDataError('Heating/cooling information is missing or empty', 400);
    }
    
    if (!auditData.energyConsumption || Object.keys(auditData.energyConsumption).length === 0) {
      throw new ReportDataError('Energy consumption data is missing or empty', 400);
    }
    
    // For each section, ensure critical fields have default values if missing
    this.ensureDefaultValues(auditData);
    
    appLogger.debug('Audit data validation passed');
  }
  
  /**
   * Ensure audit data has default values for critical fields
   * This improves robustness by providing fallbacks for missing data
   * @param auditData Normalized audit data
   */
  private ensureDefaultValues(auditData: EnergyAuditData): void {
    // Ensure basicInfo has minimum required fields
    if (!auditData.basicInfo.address) auditData.basicInfo.address = 'Unknown Address';
    if (!auditData.basicInfo.propertyType) auditData.basicInfo.propertyType = 'single-family';
    if (!auditData.basicInfo.yearBuilt) auditData.basicInfo.yearBuilt = 2000;
    
    // Ensure homeDetails has minimum required fields
    if (!auditData.homeDetails.squareFootage) auditData.homeDetails.squareFootage = 1500;
    
    // Initialize product preferences if they don't exist
    if (!auditData.productPreferences) {
      auditData.productPreferences = {
        categories: [],
        features: [],
        budgetConstraint: 0
      };
    }
    
    // Ensure currentConditions.insulation exists and has structure
    if (!auditData.currentConditions.insulation) {
      auditData.currentConditions.insulation = {
        attic: 'average',
        walls: 'average',
        basement: 'average',
        floor: 'average'
      };
    }
    
    // Ensure heatingCooling systems exist
    if (!auditData.heatingCooling.heatingSystem) {
      auditData.heatingCooling.heatingSystem = {
        type: 'furnace',
        fuel: 'natural-gas',
        fuelType: 'natural-gas',
        age: 10,
        efficiency: 80,
        lastService: new Date().toISOString().split('T')[0] // Today's date
      };
    }
    
    if (!auditData.heatingCooling.coolingSystem) {
      auditData.heatingCooling.coolingSystem = {
        type: 'central-ac',
        age: 10,
        efficiency: 13 // SEER rating
      };
    }
    
    // Ensure energyConsumption has minimum values
    if (typeof auditData.energyConsumption.electricBill !== 'number') {
      auditData.energyConsumption.electricBill = 100;
    }
    
    if (typeof auditData.energyConsumption.gasBill !== 'number') {
      auditData.energyConsumption.gasBill = 50;
    }
  }
  
  /**
   * Prepare a normalized version of the recommendations list
   * @param recommendations Raw recommendations from database
   * @returns Normalized recommendations array
   */
  private normalizeRecommendations(recommendations: any[]): AuditRecommendation[] {
    if (!recommendations || !Array.isArray(recommendations)) {
      return [];
    }
    
    return recommendations.map(rec => {
      // Ensure all required fields exist with proper types
      return {
        id: rec.id || '',
        title: rec.title || 'Unnamed Recommendation',
        description: rec.description || '',
        type: rec.type || 'general',
        priority: rec.priority || 'medium',
        status: rec.status || 'active',
        estimatedSavings: typeof rec.estimated_savings === 'number' ? rec.estimated_savings : 
                         typeof rec.estimatedSavings === 'number' ? rec.estimatedSavings : 0,
        estimatedCost: typeof rec.estimated_cost === 'number' ? rec.estimated_cost : 
                      typeof rec.estimatedCost === 'number' ? rec.estimatedCost : 0,
        paybackPeriod: typeof rec.payback_period === 'number' ? rec.payback_period : 
                      typeof rec.paybackPeriod === 'number' ? rec.paybackPeriod : 0,
        actualSavings: 
          // First try to parse actual_savings as a number if it's a string
          typeof rec.actual_savings === 'string' ? parseFloat(rec.actual_savings) || null :
          // Next check if it's already a number
          typeof rec.actual_savings === 'number' ? rec.actual_savings : 
          // Then try camelCase version as string
          typeof rec.actualSavings === 'string' ? parseFloat(rec.actualSavings) || null :
          // Then try camelCase version as number
          typeof rec.actualSavings === 'number' ? rec.actualSavings : null,
        implementationDate: rec.implementation_date || rec.implementationDate || null,
        implementationCost: typeof rec.implementation_cost === 'number' ? rec.implementation_cost : 
                           typeof rec.implementationCost === 'number' ? rec.implementationCost : null,
        lastUpdate: rec.last_update || rec.lastUpdate || new Date().toISOString().split('T')[0],
        scope: rec.scope || '',
        isEstimated: rec.is_estimated || rec.isEstimated || false
      };
    });
  }
  
  /**
   * Generate report data with robust error handling and data validation
   * @param auditData Raw audit data from database
   * @param recommendations Raw recommendations from database
   * @returns Report data for frontend
   */
  async generateReportData(rawAudit: any, recommendations: any[]): Promise<any> {
    appLogger.info('Generating enhanced report data', {
      hasAuditData: !!rawAudit,
      recommendationsCount: Array.isArray(recommendations) ? recommendations.length : 0
    });
    
    try {
      // Normalize and validate the input data
      const normalizedAuditData = this.normalizeAuditData(rawAudit);
        // Normalize recommendations and ensure they use consistent financial calculation methods
        const normalizedRecommendations = this.normalizeRecommendations(recommendations);
      
      // Check if we have valid data after normalization
      if (!normalizedAuditData) {
        throw new ReportDataError('Failed to process audit data for report generation', 500);
      }
      
      // Prepare the report data with enhanced product recommendations
      try {
        // Extract product preferences from the audit data
        const productPreferences = normalizedAuditData.productPreferences || {
          categories: [],
          features: [],
          budgetConstraint: 0
        };
        
        // Generate report data using the report generation service
        const reportData = await reportGenerationService.prepareReportData(
          normalizedAuditData, 
          normalizedRecommendations
        );
        
        // Add product preferences to the report data
        reportData.productPreferences = {
          categories: productPreferences.categories || [],
          features: productPreferences.features || [],
          budgetConstraint: productPreferences.budgetConstraint || 0
        };
        
        appLogger.info('Report data generated successfully with product preferences');
        return reportData;
      } catch (error) {
        appLogger.error('Error in report generation service', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new ReportDataError(
          error instanceof Error ? error.message : 'Unknown error in report generation',
          500
        );
      }
    } catch (error) {
      // Re-throw ReportDataErrors with their status code
      if (error instanceof ReportDataError) {
        throw error;
      }
      
      // Convert other errors to ReportDataError
      appLogger.error('Unhandled error in report data generation', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new ReportDataError('Failed to generate report data', 500);
    }
  }
}

export const reportDataService = new ReportDataService();
