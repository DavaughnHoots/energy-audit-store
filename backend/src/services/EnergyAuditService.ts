import { Pool } from 'pg';
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
  RecommendationPriority
} from '../types/energyAudit.js';
import { reportGenerationService } from './ReportGenerationService.js';
import { calculationService } from './calculateService.js';

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
        heating_cooling: JSON.stringify(auditData.heatingCooling),
        energy_consumption: JSON.stringify(auditData.energyConsumption)
      };

      console.log('Formatted JSONB data:', jsonData);

      // Insert audit data
      const insertQuery = `
        INSERT INTO energy_audits (
          user_id, client_id, basic_info, home_details,
          current_conditions, heating_cooling,
          energy_consumption, created_at
        ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, CURRENT_TIMESTAMP)
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
        jsonData.energy_consumption
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
          jsonData.energy_consumption
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

  async generateRecommendations(auditData: EnergyAuditData): Promise<DbRecommendation[]> {
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

      // Update audit data
      const result = await client.query(
        `UPDATE energy_audits
        SET basic_info = COALESCE($1, basic_info),
            home_details = COALESCE($2, home_details),
            current_conditions = COALESCE($3, current_conditions),
            heating_cooling = COALESCE($4, heating_cooling),
            energy_consumption = COALESCE($5, energy_consumption),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND user_id = $7
        RETURNING *`,
        [
          auditData.basicInfo || null,
          auditData.homeDetails || null,
          auditData.currentConditions || null,
          auditData.heatingCooling || null,
          auditData.energyConsumption || null,
          auditId,
          userId
        ]
      );

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
