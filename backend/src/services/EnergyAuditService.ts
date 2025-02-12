// src/services/EnergyAuditService.ts

import { Pool } from 'pg';
import {
  EnergyAuditData,
  HomeDetails,
  CurrentConditions,
  HeatingCooling,
  BasicInfo,
  EnergyConsumption,
  validateBasicInfo,
  validateHomeDetails
} from '../types/energyAudit';

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

export interface AuditRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  estimatedCost: number;
  paybackPeriod: number;
  implementationStatus?: 'pending' | 'in_progress' | 'completed';
  products?: string[];
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
    const scores = {
      poor: 0,
      average: 1,
      good: 2,
      excellent: 3,
      'not-sure': 1
    };

    const {attic, walls, basement, floor} = conditions.insulation;
    return (
      scores[attic] +
      scores[walls] +
      scores[basement] +
      scores[floor]
    ) / 4;
  }

  private calculateWindowScore(conditions: CurrentConditions): number {
    const windowTypeScores = {
      single: 0,
      double: 2,
      triple: 3,
      'not-sure': 1
    };

    const conditionScores = {
      poor: 0,
      fair: 1,
      good: 2,
      excellent: 3
    };

    return (
      windowTypeScores[conditions.windowType] +
      conditionScores[conditions.windowCondition]
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

  async submitAudit(auditData: EnergyAuditData, userId?: string): Promise<string> {
    // Validate input data
    const basicInfoErrors = validateBasicInfo(auditData.basicInfo);
    const homeDetailsErrors = validateHomeDetails(auditData.homeDetails);

    if (basicInfoErrors.length > 0 || homeDetailsErrors.length > 0) {
      throw new Error('Invalid audit data: ' +
        [...basicInfoErrors, ...homeDetailsErrors].join(', '));
    }

    // Store audit data
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert audit data
      const auditResult = await client.query(
        `INSERT INTO energy_audits (
          user_id, basic_info, home_details,
          current_conditions, heating_cooling,
          energy_consumption, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id`,
        [
          userId,
          auditData.basicInfo,
          auditData.homeDetails,
          auditData.currentConditions,
          auditData.heatingCooling,
          auditData.energyConsumption
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
            payback_period, implementation_status
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
            'pending'
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

  async generateRecommendations(auditData: EnergyAuditData): Promise<AuditRecommendation[]> {

    // Calculate component scores
    const insulation = this.calculateInsulationScore(auditData.currentConditions);
    const windows = this.calculateWindowScore(auditData.currentConditions);
    const hvac = this.calculateHVACScore(auditData.heatingCooling);

    const recommendations: AuditRecommendation[] = [];

    // Generate recommendations based on scores
    if (insulation < 2) {
      recommendations.push({
        category: 'Insulation',
        priority: 'high',
        title: 'Improve Home Insulation',
        description: 'Add or upgrade insulation in walls and attic',
        estimatedSavings: 500,
        estimatedCost: 2000,
        paybackPeriod: 4,
        products: ['INS-001', 'INS-002']
      });
    }

    if (windows < 1.5) {
      recommendations.push({
        category: 'Windows',
        priority: 'medium',
        title: 'Upgrade Windows',
        description: 'Replace single-pane windows with double-pane',
        estimatedSavings: 300,
        estimatedCost: 5000,
        paybackPeriod: 16.7,
        products: ['WIN-001', 'WIN-002']
      });
    }

    if (hvac < 2) {
      recommendations.push({
        category: 'HVAC',
        priority: 'high',
        title: 'HVAC Maintenance/Upgrade',
        description: 'Schedule HVAC maintenance or consider upgrade',
        estimatedSavings: 400,
        estimatedCost: 1000,
        paybackPeriod: 2.5,
        products: ['HVAC-001']
      });
    }

    return recommendations;
  }

  async getAuditById(auditId: string): Promise<AuditData> {
    const result = await this.pool.query(
      'SELECT * FROM energy_audits WHERE id = $1',
      [auditId]
    );

    if (result.rows.length === 0) {
      throw new Error('Audit not found');
    }

    return result.rows[0];
  }

  async getRecommendations(auditId: string): Promise<AuditRecommendation[]> {
    const result = await this.pool.query(
      'SELECT * FROM audit_recommendations WHERE audit_id = $1',
      [auditId]
    );

    return result.rows;
  }

  async getAuditHistory(userId: string): Promise<AuditData[]> {
    const result = await this.pool.query(
      `SELECT 
        ea.*,
        json_agg(ar.*) as recommendations
      FROM energy_audits ea
      LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
      WHERE ea.user_id = $1
      GROUP BY ea.id
      ORDER BY ea.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async generateReport(auditId: string, options: ReportGenerationOptions = {}): Promise<Buffer> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get audit data with recommendations
      const result = await client.query(
        `SELECT 
          ea.*,
          json_agg(ar.*) as recommendations
        FROM energy_audits ea
        LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
        WHERE ea.id = $1
        GROUP BY ea.id`,
        [auditId]
      );

      if (result.rows.length === 0) {
        throw new Error('Audit not found');
      }

      const auditData = result.rows[0];

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

      // Generate PDF report (implementation depends on your PDF generation library)
      // This is a placeholder - you'll need to implement the actual PDF generation
      return Buffer.from('PDF Report');

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
    status: 'pending' | 'in_progress' | 'completed'
  ): Promise<void> {
    await this.pool.query(
      `UPDATE audit_recommendations
      SET implementation_status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND audit_id = $3`,
      [status, recommendationId, auditId]
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
