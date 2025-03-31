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
  return recommendation;
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
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
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
      
      // Add lighting-specific recommendations based on bulb type
      this._addLightingRecommendations(auditData, recommendations, now);
      
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
        lastUpdate: now,
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
    
    // If we have detailed fixture data, add specific recommendations
    if (auditData.currentConditions.fixtures && auditData.currentConditions.fixtures.length > 0) {
      // Calculate inefficient fixtures (less than 50 lm/W is inefficient)
      const inefficientFixtures = auditData.currentConditions.fixtures.filter(
        fixture => (fixture.watts || 0) > 0 && (fixture.lumens || 0) / (fixture.watts || 1) < 50
      );
      
      if (inefficientFixtures.length > 0) {
        const fixtureSavings = Math.round(
          inefficientFixtures.reduce(
            (sum, f) => sum + (f.watts || 0) * (f.hoursPerDay || 0) * 365 * 0.12 / 1000 * 0.7, 
            0
          )
        ); // 70% savings
        
        const fixtureCost = inefficientFixtures.length * 25; // $25 per fixture
        
        recommendations.push({
          id: `LIGHT-FIXTURE-${Date.now()}`,
          category: 'Lighting',
          title: 'Replace Inefficient Light Fixtures',
          description: `Replace ${inefficientFixtures.length} inefficient light fixtures with high-efficiency LED alternatives.`,
          priority: 'medium',
          status: 'active',
          estimatedSavings: fixtureSavings,
          estimatedCost: fixtureCost,
          paybackPeriod: calculationService.calculatePaybackPeriod(fixtureCost, fixtureSavings),
          actualSavings: 0,
          implementationDate: null,
          implementationCost: 0,
          lastUpdate: now
        });
      }
    }
  }

  /**
   * Generate basic recommendations (original implementation as fallback)
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
        description: 'Schedule professional HVAC maintenance or consider upgrading to a more efficient system to improve performance and reduce energy use.',
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

    // Add lighting recommendation if not already covered
    if (savingsPotential.breakdowns.lighting > 100) { // Only if significant savings potential
      const lightingSavings = savingsPotential.breakdowns.lighting;
      const estimatedSavings = Math.round(lightingSavings * 0.12); // Convert kWh to dollars
      const estimatedCost = Math.round(auditData.homeDetails.squareFootage * 0.5); // $0.50 per sq ft for LED upgrades
      const paybackPeriod = calculationService.calculatePaybackPeriod(estimatedCost, estimatedSavings);
      
      recommendations.push({
        id: `LIGHT-${Date.now()}`,
        category: 'Lighting',
        title: 'Upgrade to LED Lighting',
        description: 'Replace conventional light bulbs with energy-efficient LED lighting throughout your home.',
        priority: estimatedSavings > 200 ? 'high' : 'medium',
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

  async getAuditById(auditId: string): Promise<AuditData> {
    const result = await this.pool.query(
      `SELECT 
        ea.*,
        COALESCE(json_agg(ar.*) FILTER (WHERE ar.id IS NOT NULL), '[]') as recommendations
      FROM energy_audits ea
      LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
      WHERE ea.id = $1
      GROUP BY ea.id`,
      [auditId]
    );

    if (result.rows.length === 0) {
      throw new Error('Audit not found');
    }

    return {
      ...result.rows[0],
      recommendations: (result.rows[0].recommendations as DbRecommendation[])
        .map(mapDbToAuditRecommendation)
    };
  }

  async getRecommendations(auditId: string): Promise<AuditRecommendation[]> {
    const result = await this.pool.query(
      'SELECT * FROM audit_recommendations WHERE audit_id = $1',
      [auditId]
    );

    return result.rows.map(row => mapDbToAuditRecommendation(row as DbRecommendation));
  }

  async getAuditHistory(userId: string): Promise<AuditData[]> {
    const result = await this.pool.query(
      `SELECT 
        ea.*,
        COALESCE(json_agg(ar.*) FILTER (WHERE ar.id IS NOT NULL), '[]') as recommendations
      FROM energy_audits ea
      LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
      WHERE ea.user_id = $1
      GROUP BY ea.id
      ORDER BY ea.created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      ...row,
      recommendations: (row.recommendations as DbRecommendation[]).map(mapDbToAuditRecommendation)
    }));
  }
  
  /**
   * Get paginated audit history for a user
   * @param userId User ID to get audits for
   * @param page Page number (1-indexed)
   * @param limit Number of items per page
   * @returns Object with audits array and pagination metadata
   */
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
      // Use more defensive SQL query that handles potential null values
      const result = await client.query(
        `SELECT
          ea.id,
          ea.created_at as date,
          COALESCE(ea.basic_info->>'address', '{}') as address,
          COALESCE((SELECT COUNT(*) FROM audit_recommendations WHERE audit_id = ea.id), 0) as recommendations,
          CASE
            WHEN ea.basic_info->>'propertyName' IS NOT NULL AND ea.basic_info->>'propertyName' != ''
            THEN ea.basic_info->>'propertyName'
            ELSE to_char(ea.created_at, 'Month YYYY') || ' Energy Audit'
          END as title,
          'completed' as status
        FROM energy_audits ea
        WHERE ea.user_id = $1
        ORDER BY ea.created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Process rows to extract address
      const audits = (result.rows || []).map(row => {
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

  async getAuditsByClientId(clientId: string): Promise<AuditData[]> {
    const result = await this.pool.query(
      `SELECT 
        ea.*,
        COALESCE(json_agg(ar.*) FILTER (WHERE ar.id IS NOT NULL), '[]') as recommendations
      FROM energy_audits ea
      LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
      WHERE ea.client_id = $1
      GROUP BY ea.id
      ORDER BY ea.created_at DESC`,
      [clientId]
    );

    return result.rows.map(row => ({
      ...row,
      recommendations: (row.recommendations as DbRecommendation[]).map(mapDbToAuditRecommendation)
    }));
  }

  async associateAuditsWithUser(userId: string, clientId: string): Promise<void> {
    await this.pool.query(
      'SELECT associate_anonymous_audits($1, $2)',
      [userId, clientId]
    );
  }

  async generateReport(auditId: string, options: ReportGenerationOptions = {}): Promise<Buffer> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get audit data with recommendations
      const result = await client.query(
        `SELECT 
          ea.*,
          COALESCE(json_agg(ar.*) FILTER (WHERE ar.id IS NOT NULL), '[]') as recommendations
        FROM energy_audits ea
        LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
        WHERE ea.id = $1
        GROUP BY ea.id`,
        [auditId]
      );

      if (result.rows.length === 0) {
        throw new Error('Audit not found');
      }

      const auditData = {
        ...result.rows[0],
        recommendations: (result.rows[0].recommendations as DbRecommendation[])
          .map(mapDbToAuditRecommendation)
      };

      // Update report generation status
      await client.query(
        `UPDATE energy_audits 
        SET report_generated = true,
            report_generated_at = CURRENT_TIMESTAMP,
            report_download_count = report_download_count + 1
        WHERE id = $1`,
        [auditId]
      );

      await client.query('COMMIT');

      // Get the recommendations
      const recommendations = await this.getRecommendations(auditId);
      
      // Use the reportGenerationService to generate the PDF
      return await reportGenerationService.generateReport(auditData, recommendations);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateAudit(auditId: string, userId: string, auditData: Partial<EnergyAuditData>): Promise<AuditData | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      const audit = await client.query(
        'SELECT * FROM energy_audits WHERE id = $1 AND user_id = $2',
        [auditId, userId]
      );

      if (audit.rows.length === 0) {
        return null;
      }

      // Format data as JSONB for the fields that are provided
      const jsonData: Record<string, string | null> = {};
      
      if (auditData.basicInfo) {
        jsonData.basic_info = JSON.stringify(auditData.basicInfo);
      }
      
      if (auditData.homeDetails) {
        jsonData.home_details = JSON.stringify(auditData.homeDetails);
      }
      
      if (auditData.currentConditions) {
        jsonData.current_conditions = JSON.stringify(auditData.currentConditions);
      }
      
      if (auditData.heatingCooling) {
        jsonData.heating_cooling = JSON.stringify(auditData.heatingCooling);
      }
      
      if (auditData.energyConsumption) {
        jsonData.energy_consumption = JSON.stringify(auditData.energyConsumption);
      }
      
      if (auditData.productPreferences) {
        jsonData.product_preferences = JSON.stringify(auditData.productPreferences);
      }

      // Build the SQL query dynamically based on what fields are provided
      const setClauses = [];
      const queryParams = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(jsonData)) {
        if (value !== null) {
          setClauses.push(`${key} = $${paramIndex}::jsonb`);
          queryParams.push(value);
          paramIndex++;
        }
      }
      
      // Always add updated_at
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add the WHERE clause parameters
      queryParams.push(auditId);
      queryParams.push(userId);
      
      // If no fields to update, just return the current audit
      if (setClauses.length === 1) { // Only updated_at
        const currentAudit = await client.query(
          'SELECT * FROM energy_audits WHERE id = $1',
          [auditId]
        );
        await client.query('COMMIT');
        return currentAudit.rows[0];
      }
      
      // Build and execute the query
      const updateQuery = `
        UPDATE energy_audits
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, queryParams);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteAudit(auditId: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      const audit = await client.query(
        'SELECT * FROM energy_audits WHERE id = $1 AND user_id = $2',
        [auditId, userId]
      );

      if (audit.rows.length === 0) {
        throw new Error('Audit not found or not authorized');
      }

      // Delete recommendations first due to foreign key constraint
      await client.query(
        'DELETE FROM audit_recommendations WHERE audit_id = $1',
        [auditId]
      );

      // Delete the audit
      await client.query(
        'DELETE FROM energy_audits WHERE id = $1 AND user_id = $2',
        [auditId, userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateRecommendationStatus(
    auditId: string,
    recommendationId: string,
    status: RecommendationStatus,
    actualSavings?: number,
    notes?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE audit_recommendations
      SET status = $1,
          actual_savings = COALESCE($2, actual_savings),
          notes = COALESCE($3, notes),
          implementation_date = CASE WHEN $1 = 'implemented' THEN CURRENT_TIMESTAMP ELSE implementation_date END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND audit_id = $5`,
      [status, actualSavings, notes, recommendationId, auditId]
    );
  }
}

// Error handling
export class AuditError extends Error {
constructor(message: string) {
    super(message);
    this.name = 'AuditError';
  }
}
