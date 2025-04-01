import { appLogger, createLogMetadata } from '../utils/logger.js';
import { EnergyAuditData, AuditRecommendation } from '../types/energyAudit.js';
import { reportGenerationService } from './ReportGenerationService.js';
import { getRecommendationCost, getRecommendationSavings } from '../utils/financialCalculations.js';
import { RecommendationUpdate } from '../types/recommendationUpdate.js';
import { pool } from '../config/database.js';

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
 * Enhanced service to handle report data generation with improved state persistence
 * Now incorporates recommendation updates from user interactions
 */
export class EnhancedReportDataService {
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
   * Fetch recommendation updates for a specific user and audit
   * @param auditId The audit ID to fetch updates for
   * @param userId The user ID to fetch updates for
   * @returns Array of recommendation updates
   */
  async getRecommendationUpdates(auditId: string, userId: string): Promise<RecommendationUpdate[]> {
    try {
      appLogger.info('Fetching recommendation updates', { auditId, userId });
      
      const client = await pool.connect();
      try {
        // Query the recommendation_updates table for user-specific updates
        // Join with audit_recommendations to ensure we only get updates for the specified audit
        const result = await client.query(`
          SELECT ru.* 
          FROM recommendation_updates ru
          JOIN audit_recommendations ar ON ru.recommendation_id = ar.id
          WHERE ar.audit_id = $1 AND ru.user_id = $2
        `, [auditId, userId]);
        
        appLogger.debug('Retrieved recommendation updates', { 
          count: result.rows.length,
          auditId,
          userId
        });
        
        // Transform the row data into our RecommendationUpdate type
        return result.rows.map((row: any) => ({
          id: row.id,
          recommendationId: row.recommendation_id,
          userId: row.user_id,
          status: row.status,
          priority: row.priority,
          actualSavings: row.actual_savings,
          implementationDate: row.implementation_date ? row.implementation_date.toISOString().split('T')[0] : null,
          implementationCost: row.implementation_cost,
          updatedAt: row.updated_at.toISOString()
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      appLogger.error('Error fetching recommendation updates', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        auditId,
        userId
      });
      
      // Return empty array on error rather than failing completely
      return [];
    }
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
        actualSavings: typeof rec.actual_savings === 'number' ? rec.actual_savings : 
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
   * Merge base recommendations with user-specific updates
   * @param baseRecommendations Base recommendations from the audit
   * @param updates User-specific updates
   * @returns Merged recommendations
   */
  private mergeRecommendationsWithUpdates(
    baseRecommendations: AuditRecommendation[],
    updates: RecommendationUpdate[]
  ): AuditRecommendation[] {
    if (!updates || updates.length === 0) {
      return baseRecommendations;
    }
    
    appLogger.info('Merging recommendations with user updates', {
      baseCount: baseRecommendations.length,
      updatesCount: updates.length
    });
    
    // Create a lookup map of updates by recommendation ID
    const updatesMap = new Map(
      updates.map(update => [update.recommendationId, update])
    );
    
    // Apply updates to base recommendations
    return baseRecommendations.map(rec => {
      const update = updatesMap.get(rec.id);
      
      if (!update) return rec;
      
      appLogger.debug('Applying update to recommendation', {
        recId: rec.id,
        originalStatus: rec.status,
        updateStatus: update.status,
        hasActualSavings: update.actualSavings !== undefined
      });
      
      return {
        ...rec,
        status: update.status || rec.status,
        priority: update.priority || rec.priority,
        actualSavings: update.actualSavings !== undefined ? update.actualSavings : rec.actualSavings,
        implementationDate: update.implementationDate || rec.implementationDate,
        implementationCost: update.implementationCost !== undefined ? update.implementationCost : rec.implementationCost,
        lastUpdate: update.updatedAt ? update.updatedAt.split('T')[0] : rec.lastUpdate
      };
    });
  }
  
  /**
   * Updates savings analysis chart data with actual savings from recommendations
   * @param chartData Original chart data
   * @param recommendations Recommendations with potential updates
   * @returns Updated chart data
   */
  private updateSavingsAnalysisCharts(chartData: any[], recommendations: AuditRecommendation[]): any[] {
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      return chartData;
    }
    
    appLogger.debug('Updating savings analysis charts with actual savings data', {
      chartPointCount: chartData.length,
      recommendationsCount: recommendations.length
    });
    
    // Create a map of recommendations grouped by type
    const recByType = recommendations.reduce((acc, rec) => {
      const type = rec.type || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(rec);
      return acc;
    }, {} as Record<string, AuditRecommendation[]>);
    
    // Update each chart data point with actual savings from matching recommendations
    return chartData.map(point => {
      const name = point.name;
      const typeRecs = recByType[name] || [];
      
      // Calculate total actual savings for this category
      const totalActualSavings = typeRecs.reduce((sum, rec) => {
        // Only include actual savings if recommendation is implemented
        if (rec.status === 'implemented' && rec.actualSavings !== null && rec.actualSavings !== undefined) {
          return sum + rec.actualSavings;
        }
        return sum;
      }, 0);
      
      // Update point with calculated actual savings if we have any
      if (totalActualSavings > 0) {
        appLogger.debug(`Updating chart point ${name} with actual savings: ${totalActualSavings}`);
        return {
          ...point,
          actualSavings: totalActualSavings
        };
      }
      
      return point;
    });
  }
  
  /**
   * Recalculates summary metrics based on recommendation data
   * @param recommendations Recommendations with potential updates
   * @returns Updated summary metrics
   */
  private recalculateSummaryMetrics(recommendations: AuditRecommendation[]): any {
    // Calculate total estimated savings
    const totalEstimatedSavings = recommendations.reduce(
      (sum, rec) => sum + (typeof rec.estimatedSavings === 'number' ? rec.estimatedSavings : 0), 
      0
    );
    
    // Get implemented recommendations
    const implementedRecs = recommendations.filter(
      rec => rec.status === 'implemented'
    );
    
    // Calculate actual savings from implemented recommendations
    const totalActualSavings = implementedRecs.reduce(
      (sum, rec) => sum + (typeof rec.actualSavings === 'number' ? rec.actualSavings : 0), 
      0
    );
    
    // Count implemented recommendations
    const implementedCount = implementedRecs.length;
    
    // Calculate savings accuracy ratio (actual / estimated for implemented recs)
    let savingsAccuracy = null;
    
    if (implementedCount > 0) {
      const totalEstimatedForImplemented = implementedRecs.reduce(
        (sum, rec) => sum + (typeof rec.estimatedSavings === 'number' ? rec.estimatedSavings : 0),
        0
      );
      
      if (totalEstimatedForImplemented > 0) {
        savingsAccuracy = totalActualSavings / totalEstimatedForImplemented;
      }
    }
    
    appLogger.debug('Recalculated summary metrics', {
      totalEstimatedSavings,
      totalActualSavings,
      implementedCount,
      savingsAccuracy
    });
    
    return {
      totalEstimatedSavings,
      totalActualSavings,
      implementedCount,
      savingsAccuracy
    };
  }

  /**
   * Generate report data with robust error handling and user-specific updates
   * @param rawAudit Raw audit data from database
   * @param recommendations Raw recommendations from database
   * @param userId Optional user ID to fetch user-specific updates
   * @returns Report data for frontend
   */
  async generateReportData(rawAudit: any, recommendations: any[], userId?: string): Promise<any> {
    appLogger.info('Generating enhanced report data with state persistence', {
      hasAuditData: !!rawAudit,
      recommendationsCount: Array.isArray(recommendations) ? recommendations.length : 0,
      hasUserId: !!userId
    });
    
    try {
      // Normalize and validate the input data
      const normalizedAuditData = this.normalizeAuditData(rawAudit);
      let normalizedRecommendations = this.normalizeRecommendations(recommendations);
      
      // Check if we have valid data after normalization
      if (!normalizedAuditData) {
        throw new ReportDataError('Failed to process audit data for report generation', 500);
      }
      
      // If user ID is provided, fetch and apply recommendation updates
      if (userId && normalizedRecommendations.length > 0) {
        try {
          // Get the audit ID from the first recommendation
          const auditId = rawAudit.id;
          
          if (auditId) {
            // Fetch user-specific updates for this audit
            const recommendationUpdates = await this.getRecommendationUpdates(
              auditId,
              userId
            );
            
            if (recommendationUpdates.length > 0) {
              appLogger.info('Found user-specific recommendation updates', {
                updatesCount: recommendationUpdates.length,
                auditId,
                userId
              });
              
              // Merge base recommendations with user-specific updates
              normalizedRecommendations = this.mergeRecommendationsWithUpdates(
                normalizedRecommendations,
                recommendationUpdates
              );
            }
          }
        } catch (error) {
          appLogger.error('Error applying recommendation updates', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // Continue with base recommendations if there was an error
        }
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
        
        // Update savings analysis charts with actual savings data if we have user updates
        if (userId && reportData.charts?.savingsAnalysis) {
          reportData.charts.savingsAnalysis = this.updateSavingsAnalysisCharts(
            reportData.charts.savingsAnalysis,
            normalizedRecommendations
          );
        }
        
        // Recalculate summary metrics based on potentially updated recommendation data
        reportData.summary = this.recalculateSummaryMetrics(
          normalizedRecommendations
        );
        
        appLogger.info('Report data generated successfully with user-specific updates');
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

export const enhancedReportDataService = new EnhancedReportDataService();
