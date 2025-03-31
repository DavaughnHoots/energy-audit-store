import pkg from 'pg';
const { Pool } = pkg;
import {
  EnergyAuditData,
  HomeDetails,
  CurrentConditions,
  HeatingCooling,
  BasicInfo,
  EnergyConsumption,
  validateBasicInfo,
  validateHomeDetails,
  AuditRecommendation,
  RecommendationStatus,
  RecommendationPriority,
  LightingFixture
} from '../types/energyAudit.js';
import { 
  ExtendedEnergyAuditData,
  ExtendedCurrentConditions,
  ExtendedHeatingCooling,
  ExtendedEnergyConsumption,
  LightingData,
  HumidityData
} from '../types/energyAuditExtended.js';
import { reportGenerationService } from './ReportGenerationService.js';
import { calculationService } from './calculateService.js';
import { extendedCalculationService } from './extendedCalculationService.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

// Custom error class for audit-related errors
class AuditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditError';
  }
}

interface DbRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  estimatedSavings: number;
  estimatedCost: number;
  paybackPeriod: number;
  actualSavings: number | null;
  implementationDate: string | null;
  implementationCost: number | null;
  lastUpdate: string;
}

const mapDbToAuditRecommendation = (dbRec: DbRecommendation): AuditRecommendation => {
  const { category, ...recommendation } = dbRec;
  return {
    ...recommendation,
    type: category // Ensuring 'type' property is set from 'category'
  };
};

const mapAuditToDbRecommendation = (rec: AuditRecommendation, category: string): DbRecommendation => {
  return {
    ...rec,
    category
  };
};

export interface AuditData {
  id: string;
  userId?: string;
  basicInfo: BasicInfo;
  homeDetails: HomeDetails;
  currentConditions: CurrentConditions;
  heatingCooling: HeatingCooling;
  energyConsumption: EnergyConsumption;
  createdAt: Date;
  product_preferences?: any;
  product_recommendations?: Record<string, any[]>;
  product_savings?: {
    byCategory: Record<string, number>;
    total: number;
  };
}

interface ReportGenerationOptions {
  includeProducts?: boolean;
  includeSavingsProjections?: boolean;
  format?: 'detailed' | 'summary';
}

export class EnergyAuditService {
  private pool: any; // Using 'any' to avoid type issues with pg Pool

  constructor(pool: any) {
    this.pool = pool;
  }

  /**
   * Get paginated audit history for a user
   * @param userId User ID to get audits for
   * @param page Page number (1-indexed)
   * @param limit Number of items per page
   * @returns Object with audits array and pagination metadata
   */
  async getPaginatedAuditHistory(userId: string, page: number = 1, limit: number = 5): Promise<{
    audits: {
      id: string;
      date: string;
      address: string;
      recommendations: number;
      title: string;
      status: string;
    }[];
    pagination: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }> {
    // Input validation
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;
    if (limit > 50) limit = 50;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    const client = await this.pool.connect();
    try {
      // Get count of total records for pagination
      const countResult = await client.query(
        'SELECT COUNT(*) FROM energy_audits WHERE user_id = $1',
        [userId]
      );

      if (!countResult || !countResult.rows || countResult.rows.length === 0) {
        // Return empty result if no records found
        return {
          audits: [],
          pagination: {
            totalRecords: 0,
            totalPages: 0,
            currentPage: page,
            limit
          }
        };
      }

      const totalRecords = parseInt(countResult.rows[0]?.count || '0');
      const totalPages = Math.ceil(totalRecords / limit) || 1; // Ensure at least 1 page

      // If no records return empty result
      if (totalRecords === 0) {
        return {
          audits: [],
          pagination: {
            totalRecords: 0,
            totalPages: 0,
            currentPage: page,
            limit
          }
        };
      }

      // Get paginated audits with recommendation count
      // Simplified, ultra-defensive SQL query that handles all potential null values
      const result = await client.query(
        `SELECT
          ea.id,
          ea.created_at as date,
          COALESCE(ea.basic_info->>'address', 'No address') as address,
          COALESCE((SELECT COUNT(*) FROM audit_recommendations WHERE audit_id = ea.id), 0) as recommendations,
          COALESCE(
            NULLIF(TRIM(ea.basic_info->>'propertyName'), ''),
            to_char(ea.created_at, 'Month DD, YYYY') || ' Energy Audit'
          ) as title,
          'completed' as status
        FROM energy_audits ea
        WHERE ea.user_id = $1
        ORDER BY ea.created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      appLogger.info('Successfully executed paginated audit history query', {
        userId: userId.substring(0, 8) + '...',
        resultCount: result.rows?.length || 0,
        page,
        limit,
        offset
      });

      // Process rows to extract address
      const audits = (result.rows || []).map((row: any) => {
        try {
          // Safe default values for all properties
          const id = row.id || '';
          const date = row.date ? new Date(row.date).toISOString() : new Date().toISOString();
          let title = row.title || 'Energy Audit';
          const status = row.status || 'completed';

          // Handle recommendations count safely
          let recommendations = 0;
          try {
            recommendations = parseInt(row.recommendations) || 0;
          } catch (e) {
            // If parsing fails use 0
          }

          // Handle address which might be stored in various formats
          let address = 'No address provided';
          
          if (row.address) {
            if (typeof row.address === 'string') {
              if (row.address.startsWith('{') || row.address.startsWith('[')) {
                try {
                  const addressObj = JSON.parse(row.address);
                  // Try various possible address fields
                  address = addressObj.street ||
                            addressObj.full ||
                            addressObj.line1 ||
                            addressObj.formatted ||
                            'No address provided';
                } catch (e) {
                  // If parsing fails use the raw string
                  address = row.address;
                }
              } else {
                address = row.address;
              }
            } else if (typeof row.address === 'object' && row.address !== null) {
              // Handle if it's already an object
              address = row.address.street ||
                        row.address.full ||
                        row.address.line1 ||
                        row.address.formatted ||
                        JSON.stringify(row.address);
            }
          }

          return {
            id,
            date,
            address: address.toString(),
            recommendations,
            title,
            status
          };
        } catch (error) {
          console.error('Error processing audit row:', error);
          // Return a default object if row processing fails
          return {
            id: row.id || '',
            date: new Date().toISOString(),
            address: 'Error processing address',
            recommendations: 0,
            title: 'Energy Audit',
            status: 'completed'
          };
        }
      });
      
      return {
        audits,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      console.error('Error in getPaginatedAuditHistory:', error);
      throw new AuditError(
        `Failed to retrieve audit history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      client.release();
    }
  }

  private calculateInsulationScore(conditions: CurrentConditions): number {
    type InsulationScore = 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
    const scores: Record<InsulationScore, number> = {
      poor: 0,
      average: 1,
      good: 2,
      excellent: 3,
      'not-sure': 1
    };

    const {attic, walls, basement, floor} = conditions.insulation;
    return (
      (scores[attic as InsulationScore] ?? 1) +
      (scores[walls as InsulationScore] ?? 1) +
      (scores[basement as InsulationScore] ?? 1) +
      (scores[floor as InsulationScore] ?? 1)
    ) / 4;
  }

  private calculateWindowScore(conditions: CurrentConditions): number {
    type WindowType = 'single' | 'double' | 'triple' | 'not-sure';
    type WindowCondition = 'poor' | 'fair' | 'good' | 'excellent';
    
    const windowTypeScores: Record<WindowType, number> = {
      single: 0,
      double: 2,
      triple: 3,
      'not-sure': 1
    };

    const conditionScores: Record<WindowCondition, number> = {
      poor: 0,
      fair: 1,
      good: 2,
      excellent: 3
    };

    return (
      (windowTypeScores[conditions.windowType as WindowType] ?? 1) +
      (conditionScores[conditions.windowCondition as WindowCondition] ?? 1)
    ) / 2;
  }

  private calculateHVACScore(hvac: HeatingCooling): number {
    let score = 3;

    // Age deductions
    if (hvac.heatingSystem.age > 15) score -= 2;
    else if (hvac.heatingSystem.age > 10) score -= 1;

    // Service history deductions
    const lastService = new Date(hvac.heatingSystem.lastService);
    const monthsSinceService = (Date.now() - lastService.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsSinceService > 12) score -= 1;
    if (monthsSinceService > 24) score -= 1;

    return Math.max(0, score);
  }

  async createAudit(
    auditData: EnergyAuditData, 
    userId?: string,
    clientId?: string
  ): Promise<string> {
    // For authenticated users, clientId should be null
    // For anonymous users, ensure clientId is set
    const finalClientId = clientId !== undefined ? clientId : `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Log the audit creation attempt
    console.log('Creating energy audit:', { 
      hasUserId: !!userId, 
      clientId: finalClientId,
      auditDataSections: Object.keys(auditData)
    });
    
    // Validate input data
    const basicInfoErrors = validateBasicInfo(auditData.basicInfo);
    const homeDetailsErrors = validateHomeDetails(auditData.homeDetails);

    const errors = [...(basicInfoErrors || []), ...(homeDetailsErrors || [])];
    if (errors.length > 0) {
      throw new Error('Invalid audit data: ' + errors.join(', '));
    }

    // Store audit data
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Format data as JSONB
      const jsonData = {
        basic_info: JSON.stringify(auditData.basicInfo),
        home_details: JSON.stringify(auditData.homeDetails),
        current_conditions: JSON.stringify(auditData.currentConditions),
        heating_cooling: JSON.stringify({
          ...auditData.heatingCooling,
          // Ensure waterHeatingSystem is properly included if it exists
          waterHeatingSystem: auditData.heatingCooling.waterHeatingSystem || {
            type: 'not-sure',
            age: 0
          },
          // Ensure renewableEnergy is properly included if it exists
          renewableEnergy: auditData.heatingCooling.renewableEnergy || {
            hasSolar: false,
            solarPanelCount: 0,
            solarCapacity: 0,
            solarAge: 0,
            solarGeneration: 0,
            otherRenewables: []
          }
        }),
        energy_consumption: JSON.stringify(auditData.energyConsumption),
        product_preferences: JSON.stringify(auditData.productPreferences || {
          categories: [],
          features: [],
          budgetConstraint: 5000
        })
      };

      console.log('Formatted JSONB data:', jsonData);

      // Insert audit data
      const insertQuery = `
        INSERT INTO energy_audits (
          user_id, client_id, basic_info, home_details,
          current_conditions, heating_cooling,
          energy_consumption, product_preferences, created_at
        ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, CURRENT_TIMESTAMP)
        RETURNING id
      `;

      console.log('Executing query:', insertQuery);
      console.log('Query parameters:', [
          userId || null,
          finalClientId,
        jsonData.basic_info,
        jsonData.home_details,
        jsonData.current_conditions,
        jsonData.heating_cooling,
        jsonData.energy_consumption,
        jsonData.product_preferences
      ]);

      const auditResult = await client.query(
        insertQuery,
        [
          userId || null,
          finalClientId,
          jsonData.basic_info,
          jsonData.home_details,
          jsonData.current_conditions,
          jsonData.heating_cooling,
          jsonData.energy_consumption,
          jsonData.product_preferences
        ]
      );

      const auditId = auditResult.rows[0].id;

      // Generate and store recommendations
      const recommendations = await this.generateRecommendations(auditData);
      for (const rec of recommendations) {
        await client.query(
          `INSERT INTO audit_recommendations (
            audit_id, category, priority, title,
            description, estimated_savings, estimated_cost,
            payback_period, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            auditId,
            rec.category,
            rec.priority,
            rec.title,
            rec.description,
            rec.estimatedSavings,
            rec.estimatedCost,
            rec.paybackPeriod,
            'active'
          ]
        );
      }

      await client.query('COMMIT');
      return auditId;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Convert standard audit data to extended audit data format
   * This allows us to use the extended calculation service
   */
  private convertToExtendedAuditData(auditData: EnergyAuditData): ExtendedEnergyAuditData {
    // Create extended energy consumption
    const extendedEnergyConsumption: ExtendedEnergyConsumption = {
      ...auditData.energyConsumption,
      seasonalFactor: this._calculateSeasonalFactor(auditData.energyConsumption.seasonalVariation),
      occupancyFactor: this._calculateOccupancyFactor(auditData.energyConsumption.occupancyPattern),
      powerFactor: auditData.energyConsumption.powerFactor || 0.9,
      durationHours: auditData.energyConsumption.durationHours || 8760 // Default to 24 hours * 365 days
    };
    
    // Create extended heating/cooling
    const extendedHeatingCooling: ExtendedHeatingCooling = {
      ...auditData.heatingCooling,
      heatingSystem: {
        ...auditData.heatingCooling.heatingSystem,
        outputCapacity: auditData.heatingCooling.heatingSystem.outputCapacity || 0,
        inputPower: auditData.heatingCooling.heatingSystem.inputPower || 0,
        targetEfficiency: auditData.heatingCooling.heatingSystem.targetEfficiency || 95
      },
      coolingSystem: {
        ...auditData.heatingCooling.coolingSystem,
        outputCapacity: auditData.heatingCooling.coolingSystem.outputCapacity || 0,
        inputPower: auditData.heatingCooling.coolingSystem.inputPower || 0,
        targetEfficiency: auditData.heatingCooling.coolingSystem.targetEfficiency || 16
      },
      temperatureDifference: auditData.heatingCooling.temperatureDifference || 15,
      airDensity: 1.225,
      specificHeat: 1005
    };
    
    // Create lighting data
    const lightingData: LightingData = {
      fixtures: this._createLightingFixtures(auditData.currentConditions)
    };
    
    // Create humidity data
    const humidityData: HumidityData = {
      currentHumidity: 50, // Default value
      targetHumidity: 40, // Default value
      temperature: 22 // Default value in Celsius
    };
    
    // Create extended current conditions
    const extendedCurrentConditions: ExtendedCurrentConditions = {
      ...auditData.currentConditions,
      humidity: humidityData,
      lighting: lightingData
    };
    
    return {
      ...auditData,
      currentConditions: extendedCurrentConditions,
      heatingCooling: extendedHeatingCooling,
      energyConsumption: extendedEnergyConsumption,
      productPreferences: auditData.productPreferences || {
        categories: [],
        features: [],
        budgetConstraint: 5000
      }
    };
  }

  /**
   * Create lighting fixtures from current conditions data
   */
  private _createLightingFixtures(currentConditions: CurrentConditions): import('../types/energyAuditExtended.js').LightingFixture[] {
    // If we already have fixtures, use them
    if (currentConditions.fixtures && currentConditions.fixtures.length > 0) {
      return currentConditions.fixtures.map(fixture => ({
        name: fixture.name || 'Unknown',
        watts: fixture.watts || 0,
        hours: fixture.hoursPerDay || 0,
        lumens: fixture.lumens || 0,
        electricityRate: 0.12 // Default electricity rate
      }));
    }
    
    // Otherwise, create default fixtures based on bulb type
    const fixtures: import('../types/energyAuditExtended.js').LightingFixture[] = [];
    const bulbType = currentConditions.primaryBulbType || 'mixed';
    
    // Create different fixture profiles based on bulb type
    if (bulbType === 'mostly-led') {
      fixtures.push(
        { name: 'Living Room', watts: 10, hours: 5, lumens: 800, electricityRate: 0.12 },
        { name: 'Kitchen', watts: 12, hours: 4, lumens: 1000, electricityRate: 0.12 },
        { name: 'Bedroom', watts: 8, hours: 2, lumens: 600, electricityRate: 0.12 }
      );
    } else if (bulbType === 'mostly-incandescent') {
      fixtures.push(
        { name: 'Living Room', watts: 60, hours: 5, lumens: 800, electricityRate: 0.12 },
        { name: 'Kitchen', watts: 75, hours: 4, lumens: 1000, electricityRate: 0.12 },
        { name: 'Bedroom', watts: 40, hours: 2, lumens: 600, electricityRate: 0.12 }
      );
    } else { // mixed
      fixtures.push(
        { name: 'Living Room', watts: 30, hours: 5, lumens: 800, electricityRate: 0.12 },
        { name: 'Kitchen', watts: 40, hours: 4, lumens: 1000, electricityRate: 0.12 },
        { name: 'Bedroom', watts: 20, hours: 2, lumens: 600, electricityRate: 0.12 }
      );
    }
    
    return fixtures;
  }

  /**
   * Calculate seasonal factor from seasonal variation
   */
  private _calculateSeasonalFactor(seasonalVariation: string): number {
    switch (seasonalVariation) {
      case 'highest-summer': return 1.2;
      case 'highest-winter': return 1.2;
      case 'consistent': return 1.0;
      default: return 1.0;
    }
  }

  /**
   * Calculate occupancy factor from occupancy pattern
   */
  private _calculateOccupancyFactor(occupancyPattern: string): number {
    switch (occupancyPattern) {
      case 'home-all-day': return 1.0;
      case 'away-during-day': return 0.7;
      case 'minimal-occupancy': return 0.6;
      default: return 0.8;
    }
  }

  /**
   * Generate basic recommendations based on audit data
   * This is used as a fallback when extended calculation service fails
   */
  private _generateBasicRecommendations(auditData: EnergyAuditData): DbRecommendation[] {
    // Calculate component scores
    const insulation = this.calculateInsulationScore(auditData.currentConditions);
    const windows = this.calculateWindowScore(auditData.currentConditions);
    const hvac = this.calculateHVACScore(auditData.heatingCooling);
    
    // Calculate potential savings using calculationService
    const savingsPotential = calculationService.calculateSavingsPotential(auditData);
    
    const recommendations: DbRecommendation[] = [];
    const now = new Date().toISOString();

    // Generate recommendations based on scores and calculated savings
    if (insulation < 2) {
      // Calculate insulation-specific savings
      const envelopeSavings = savingsPotential.breakdowns.envelope;
      const estimatedSavings = Math.round(envelopeSavings * 0.12); // Convert kWh to dollars using average rate
      const estimatedCost = 2000; // Base cost for insulation upgrades
      const paybackPeriod = calculationService.calculatePaybackPeriod(estimatedCost, estimatedSavings);
      
      recommendations.push({
        id: `INS-${Date.now()}`,
        category: 'Insulation',
        title: 'Improve Home Insulation',
        description: 'Add or upgrade insulation in walls and attic to reduce heat transfer and improve energy efficiency.',
        priority: 'high',
        status: 'active',
        estimatedSavings,
        estimatedCost,
        paybackPeriod,
        actualSavings: 0,
        implementationDate: null,
        implementationCost: 0,
        lastUpdate: now
      });
    }

    if (windows < 1.5) {
      // Calculate window-specific savings
      // Windows typically account for about 30% of envelope losses
      const windowSavings = savingsPotential.breakdowns.envelope * 0.3;
      const estimatedSavings = Math.round(windowSavings * 0.12); // Convert kWh to dollars
      
      // Window costs vary by home size
      const windowCount = auditData.currentConditions.numWindows || 
                           Math.ceil(auditData.homeDetails.squareFootage / 100); // Estimate 1 window per 100 sq ft
      const estimatedCost = windowCount * 500; // Average cost per window
      const paybackPeriod = calculationService.calculatePaybackPeriod(estimatedCost, estimatedSavings);
      
      recommendations.push({
        id: `WIN-${Date.now()}`,
        category: 'Windows',
        title: 'Upgrade Windows',
        description: 'Replace single-pane windows with energy-efficient double-pane windows to reduce heat loss and improve comfort.',
        priority: 'medium',
        status: 'active',
        estimatedSavings,
        estimatedCost,
        paybackPeriod,
        actualSavings: 0,
        implementationDate: null,
        implementationCost: 0,
        lastUpdate: now
      });
    }

    if (hvac < 2) {
      // Calculate HVAC-specific savings
      const hvacSavings = savingsPotential.breakdowns.hvac;
      const estimatedSavings = Math.round(hvacSavings * 0.12); // Convert kWh to dollars
      
      // HVAC costs depend on system type and home size
      const homeSize = auditData.homeDetails.squareFootage;
      const estimatedCost = Math.max(1000, Math.round(homeSize * 7)); // $7 per sq ft with $1000 minimum
      const paybackPeriod = calculationService.calculatePaybackPeriod(estimatedCost, estimatedSavings);
      
      recommendations.push({
        id: `HVAC-${Date.now()}`,
        category: 'HVAC',
        title: 'HVAC Maintenance/Upgrade',
        description: 'Service or upgrade your heating and cooling systems to improve efficiency and reduce energy costs.',
        priority: 'high',
        status: 'active',
        estimatedSavings,
        estimatedCost,
        paybackPeriod,
        actualSavings: 0,
        implementationDate: null,
        implementationCost: 0,
        lastUpdate: now
      });
    }

    // Add appliance recommendations if high energy use
    // Safely access energy consumption data with type checking
    const energyUse = (auditData.energyConsumption as any).annualKwh || 
                     (auditData.energyConsumption as any).monthlyKwh * 12 || 
                     10000; // Default value for calculation
    
    if (energyUse > 10000) {
      // Try to access the appliances breakdown, with fallback
      const applianceSavings = 
        (savingsPotential.breakdowns as any).appliances || 
        (savingsPotential.breakdowns as any).other || 
        savingsPotential.breakdowns.lighting * 0.5; // Use lighting as fallback if no appliance data
        
      const estimatedSavings = Math.round(applianceSavings * 0.12);
      const estimatedCost = 1500; // Average cost for appliance upgrades
      const paybackPeriod = calculationService.calculatePaybackPeriod(estimatedCost, estimatedSavings);
      
      recommendations.push({
        id: `APPL-${Date.now()}`,
        category: 'Appliances',
        title: 'Upgrade High-Usage Appliances',
        description: 'Replace older appliances with ENERGY STAR certified models to reduce electricity consumption.',
        priority: 'medium',
        status: 'active',
        estimatedSavings,
        estimatedCost,
        paybackPeriod,
        actualSavings: 0,
        implementationDate: null,
        implementationCost: 0,
        lastUpdate: now
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations using both basic and extended calculation services
   */
  async generateRecommendations(auditData: EnergyAuditData): Promise<DbRecommendation[]> {
    try {
      // Try to use extended calculation service first
      const extendedAuditData = this.convertToExtendedAuditData(auditData);
      const analysisResults = extendedCalculationService.performComprehensiveAnalysis(extendedAuditData);
      
      // Extract recommendations from analysis results
      const recommendations: DbRecommendation[] = [];
      const now = new Date().toISOString();
      
      // Process immediate actions
      if (analysisResults.recommendations.immediate_actions) {
        for (const rec of analysisResults.recommendations.immediate_actions) {
          recommendations.push({
            id: `${rec.category.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            category: rec.category,
            title: rec.title,
            description: rec.description,
            priority: rec.priority as RecommendationPriority,
            status: 'active' as RecommendationStatus,
            estimatedSavings: rec.estimated_savings,
            estimatedCost: rec.implementation_cost,
            paybackPeriod: rec.estimated_savings > 0 ? rec.implementation_cost / rec.estimated_savings : 0,
            actualSavings: 0,
            implementationDate: null,
            implementationCost: 0,
            lastUpdate: now
          });
        }
      }
      
      // Process short-term actions
      if (analysisResults.recommendations.short_term) {
        for (const rec of analysisResults.recommendations.short_term) {
          recommendations.push({
            id: `${rec.category.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            category: rec.category,
            title: rec.title,
            description: rec.description,
            priority: 'medium' as RecommendationPriority,
            status: 'active' as RecommendationStatus,
            estimatedSavings: rec.estimated_savings,
            estimatedCost: rec.implementation_cost,
            paybackPeriod: rec.estimated_savings > 0 ? rec.implementation_cost / rec.estimated_savings : 0,
            actualSavings: 0,
            implementationDate: null,
            implementationCost: 0,
            lastUpdate: now
          });
        }
      }
      
      // Process long-term actions
      if (analysisResults.recommendations.long_term) {
        for (const rec of analysisResults.recommendations.long_term) {
          recommendations.push({
            id: `${rec.category.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            category: rec.category,
            title: rec.title,
            description: rec.description,
            priority: 'low' as RecommendationPriority,
            status: 'active' as RecommendationStatus,
            estimatedSavings: rec.estimated_savings,
            estimatedCost: rec.implementation_cost,
            paybackPeriod: rec.estimated_savings > 0 ? rec.implementation_cost / rec.estimated_savings : 0,
            actualSavings: 0,
            implementationDate: null,
            implementationCost: 0,
            lastUpdate: now
          });
        }
      }
      
      // Skip adding lighting recommendations
      // If no recommendations were generated, fall back to the original method
      if (recommendations.length === 0) {
        return this._generateBasicRecommendations(auditData);
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error using extended calculation service:', error);
      // Fall back to basic recommendations
      return this._generateBasicRecommendations(auditData);
    }
  }

  /**
   * Add lighting-specific recommendations based on bulb type
   */
  private _addLightingRecommendations(
    auditData: EnergyAuditData, 
    recommendations: DbRecommendation[], 
    now: string
  ): void {
    // Calculate potential savings using calculationService
    const savingsPotential = calculationService.calculateSavingsPotential(auditData);
    const lightingSavings = savingsPotential.breakdowns.lighting;
    
    // Only add lighting recommendations if there's significant savings potential
    if (lightingSavings <= 100) {
      return;
    }
    
    // Check if we already have a lighting recommendation
    const hasLightingRec = recommendations.some(rec => rec.category.toLowerCase() === 'lighting');
    if (hasLightingRec) {
      return;
    }
    
    // Add recommendations based on bulb type
    if (auditData.currentConditions.primaryBulbType === 'mostly-incandescent') {
      // Higher savings for incandescent-heavy homes
      const adjustedSavings = Math.round(lightingSavings * 0.12 * 1.5); // 50% more savings potential
      recommendations.push({
        id: `LIGHT-${Date.now()}`,
        category: 'Lighting',
        title: 'Upgrade to LED Lighting',
        description: 'Replace conventional incandescent bulbs with energy-efficient LED lighting throughout your home.',
        priority: 'high',
        status: 'active',
        estimatedSavings: adjustedSavings,
        estimatedCost: Math.round(auditData.homeDetails.squareFootage * 0.5), // $0.50 per sq ft for LED upgrades
        paybackPeriod: 0, // Will be calculated below
        actualSavings: 0,
        implementationDate: null,
        implementationCost: 0,
        lastUpdate: now
      });
    } else if (auditData.currentConditions.primaryBulbType === 'mixed') {
      // Medium savings for mixed bulb types
      const adjustedSavings = Math.round(lightingSavings * 0.12);
      recommendations.push({
        id: `LIGHT-${Date.now()}`,
        category: 'Lighting',
        title: 'Complete LED Lighting Conversion',
        description: 'Convert all remaining conventional bulbs to energy-efficient LED lighting for maximum savings.',
        priority: 'medium',
        status: 'active',
        estimatedSavings: adjustedSavings,
        estimatedCost: Math.round(auditData.homeDetails.squareFootage * 0.3), // $0.30 per sq ft for partial LED upgrades
        paybackPeriod: 0, // Will be calculated below
        actualSavings: 0,
        implementationDate: null,
        implementationCost: 0,
        lastUpdate: now
      });
    } else if (!auditData.currentConditions.primaryBulbType || auditData.currentConditions.primaryBulbType === 'mostly-led') {
      // Lower savings for LED-heavy homes, but still recommend smart controls
      const adjustedSavings = Math.round(lightingSavings * 0.12 * 0.5); // 50% less savings potential
      recommendations.push({
        id: `LIGHT-CTRL-${Date.now()}`,
        category: 'Lighting',
        title: 'Install Smart Lighting Controls',
        description: 'Add motion sensors and smart controls to further reduce energy use from your efficient lighting.',
        priority: 'low',
        status: 'active',
        estimatedSavings: adjustedSavings,
        estimatedCost: Math.round(auditData.homeDetails.squareFootage * 0.2), // $0.20 per sq ft for controls
        paybackPeriod: 0, // Will be calculated below
        actualSavings: 0,
        implementationDate: null,
        implementationCost: 0,
        lastUpdate: now
      });
    }
    
    // Calculate payback periods for all recommendations
    for (const rec of recommendations) {
      if (rec.category === 'Lighting' && rec.paybackPeriod === 0 && rec.estimatedSavings > 0) {
        rec.paybackPeriod = calculationService.calculatePaybackPeriod(rec.estimatedCost, rec.estimatedSavings);
      }
    }
  }

  /**
   * Get all energy audits for a user
   */
  async getAuditHistory(userId: string): Promise<AuditData[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM energy_audits WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      
      return result.rows.map((row: any) => this._transformDbRowToAuditData(row));
    } catch (error) {
      console.error('Error fetching audit history:', error);
      throw new AuditError('Failed to retrieve audit history');
    } finally {
      client.release();
    }
  }

  /**
   * Get audits by client ID (for anonymous users)
   */
  async getAuditsByClientId(clientId: string): Promise<AuditData[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM energy_audits WHERE client_id = $1 ORDER BY created_at DESC`,
        [clientId]
      );
      
      return result.rows.map((row: any) => this._transformDbRowToAuditData(row));
    } catch (error) {
      console.error('Error fetching audits by client ID:', error);
      throw new AuditError('Failed to retrieve audits');
    } finally {
      client.release();
    }
  }

  /**
   * Get a specific audit by ID
   */
  async getAuditById(auditId: string): Promise<AuditData> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM energy_audits WHERE id = $1`,
        [auditId]
      );
      
      if (result.rows.length === 0) {
        throw new AuditError('Audit not found');
      }
      
      return this._transformDbRowToAuditData(result.rows[0]);
    } catch (error) {
      console.error('Error fetching audit by ID:', error);
      throw new AuditError(`Failed to retrieve audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get recommendations for an audit
   */
  async getRecommendations(auditId: string): Promise<AuditRecommendation[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM audit_recommendations WHERE audit_id = $1`,
        [auditId]
      );
      
      return result.rows.map((row: any) => mapDbToAuditRecommendation(row));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new AuditError('Failed to retrieve recommendations');
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing audit
   */
  async updateAudit(auditId: string, userId: string, auditData: Partial<EnergyAuditData>): Promise<AuditData | null> {
    const client = await this.pool.connect();
    try {
      // First check if audit exists and belongs to user
      const checkResult = await client.query(
        `SELECT id FROM energy_audits WHERE id = $1 AND user_id = $2`,
        [auditId, userId]
      );
      
      if (checkResult.rows.length === 0) {
        return null;
      }
      
      // Build update query dynamically based on provided fields
      const updates = [];
      const values = [auditId];
      let paramIndex = 2;
      
      if (auditData.basicInfo) {
        updates.push(`basic_info = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(auditData.basicInfo));
        paramIndex++;
      }
      
      if (auditData.homeDetails) {
        updates.push(`home_details = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(auditData.homeDetails));
        paramIndex++;
      }
      
      if (auditData.currentConditions) {
        updates.push(`current_conditions = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(auditData.currentConditions));
        paramIndex++;
      }
      
      if (auditData.heatingCooling) {
        updates.push(`heating_cooling = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(auditData.heatingCooling));
        paramIndex++;
      }
      
      if (auditData.energyConsumption) {
        updates.push(`energy_consumption = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(auditData.energyConsumption));
        paramIndex++;
      }
      
      if (updates.length === 0) {
        // Nothing to update
        const audit = await this.getAuditById(auditId);
        return audit;
      }
      
      // Execute update
      await client.query('BEGIN');
      
      const updateQuery = `
        UPDATE energy_audits 
        SET ${updates.join(', ')}
        WHERE id = $1
      `;
      
      await client.query(updateQuery, values);
      
      // Generate and store new recommendations if data changed significantly
      if (auditData.currentConditions || auditData.heatingCooling || auditData.energyConsumption) {
        // Get current full audit data
        const currentAudit = await this.getAuditById(auditId);
        
        // Delete existing recommendations
        await client.query(
          `DELETE FROM audit_recommendations WHERE audit_id = $1`,
          [auditId]
        );
        
        // Generate new recommendations
        const recommendations = await this.generateRecommendations({
          basicInfo: currentAudit.basicInfo,
          homeDetails: currentAudit.homeDetails,
          currentConditions: currentAudit.currentConditions,
          heatingCooling: currentAudit.heatingCooling,
          energyConsumption: currentAudit.energyConsumption,
          productPreferences: currentAudit.product_preferences
        });
        
        // Store new recommendations
        for (const rec of recommendations) {
          await client.query(
            `INSERT INTO audit_recommendations (
              audit_id, category, priority, title,
              description, estimated_savings, estimated_cost,
              payback_period, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              auditId,
              rec.category,
              rec.priority,
              rec.title,
              rec.description,
              rec.estimatedSavings,
              rec.estimatedCost,
              rec.paybackPeriod,
              'active'
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Return updated audit
      const updatedAudit = await this.getAuditById(auditId);
      return updatedAudit;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating audit:', error);
      throw new AuditError(`Failed to update audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Delete an audit
   */
  async deleteAudit(auditId: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // First check if audit exists and belongs to user
      const checkResult = await client.query(
        `SELECT id FROM energy_audits WHERE id = $1 AND user_id = $2`,
        [auditId, userId]
      );
      
      if (checkResult.rows.length === 0) {
        throw new AuditError('Audit not found or not authorized');
      }
      
      await client.query('BEGIN');
      
      // Delete recommendations
      await client.query(
        `DELETE FROM audit_recommendations WHERE audit_id = $1`,
        [auditId]
      );
      
      // Delete audit
      await client.query(
        `DELETE FROM energy_audits WHERE id = $1`,
        [auditId]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting audit:', error);
      throw new AuditError(`Failed to delete audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Associate anonymous audits with user
   */
  async associateAuditsWithUser(userId: string, clientId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE energy_audits SET user_id = $1 WHERE client_id = $2 AND user_id IS NULL`,
        [userId, clientId]
      );
    } catch (error) {
      console.error('Error associating audits with user:', error);
      throw new AuditError('Failed to associate audits with user');
    } finally {
      client.release();
    }
  }

  /**
   * Helper method to transform database row to AuditData object
   */
  private _transformDbRowToAuditData(row: any): AuditData {
    return {
      id: row.id,
      userId: row.user_id,
      basicInfo: typeof row.basic_info === 'string' ? JSON.parse(row.basic_info) : row.basic_info,
      homeDetails: typeof row.home_details === 'string' ? JSON.parse(row.home_details) : row.home_details,
      currentConditions: typeof row.current_conditions === 'string' ? JSON.parse(row.current_conditions) : row.current_conditions,
      heatingCooling: typeof row.heating_cooling === 'string' ? JSON.parse(row.heating_cooling) : row.heating_cooling,
      energyConsumption: typeof row.energy_consumption === 'string' ? JSON.parse(row.energy_consumption) : row.energy_consumption,
      createdAt: row.created_at,
      product_preferences: typeof row.product_preferences === 'string' ? JSON.parse(row.product_preferences) : row.product_preferences
    };
  }
}
