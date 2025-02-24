// backend/src/services/recommendationService.ts

import { Pool } from 'pg';
import { Product } from '../types/product.js';
import { EnergyAuditData } from '../types/energyAudit.js';

export interface Recommendation {
  id: string;
  userId: string;
  productId: string;
  type: 'product' | 'improvement';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  potentialSavings: number;
  createdAt: Date;
}

interface EnergyProfile {
  heatingEfficiency: number;
  coolingEfficiency: number;
  insulationScore: number;
  windowEfficiency: number;
  applianceAge: number;
}

export class RecommendationService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async generateRecommendations(userId: string, auditData: EnergyAuditData): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Get user's energy profile
    const energyProfile = await this.analyzeEnergyProfile(auditData);
    
    // Get matching products
    const products = await this.findMatchingProducts(energyProfile);
    
    // Generate product recommendations
    for (const product of products) {
      const savings = await this.calculatePotentialSavings(product, auditData);
      
      if (savings > 0) {
        recommendations.push({
          id: crypto.randomUUID(),
          userId,
          productId: product.id,
          type: 'product',
          priority: this.calculatePriority(savings),
          reason: this.generateRecommendationReason(product, savings),
          potentialSavings: savings,
          createdAt: new Date()
        });
      }
    }

    return recommendations;
  }

  private async analyzeEnergyProfile(auditData: EnergyAuditData): Promise<EnergyProfile> {
    const profile: EnergyProfile = {
      heatingEfficiency: this.calculateHeatingEfficiency(auditData),
      coolingEfficiency: this.calculateCoolingEfficiency(auditData),
      insulationScore: this.calculateInsulationScore(auditData),
      windowEfficiency: this.calculateWindowEfficiency(auditData),
      applianceAge: this.getApplianceAge(auditData)
    };

    return profile;
  }

  private calculateHeatingEfficiency(auditData: EnergyAuditData): number {
    const { heatingSystem } = auditData.heatingCooling;
    let efficiency = 1.0;

    // Reduce efficiency based on system age
    if (heatingSystem.age > 15) efficiency *= 0.7;
    else if (heatingSystem.age > 10) efficiency *= 0.85;

    // Factor in fuel type efficiency
    const fuelEfficiency: Record<string, number> = {
      'natural-gas': 0.95,
      'oil': 0.85,
      'electric': 1.0,
      'propane': 0.90
    };
    efficiency *= fuelEfficiency[heatingSystem.fuelType as keyof typeof fuelEfficiency] || 0.85;

    return efficiency;
  }

  private calculateCoolingEfficiency(auditData: EnergyAuditData): number {
    const { coolingSystem } = auditData.heatingCooling;
    let efficiency = 1.0;

    // Adjust based on system type and age
    if (coolingSystem.type === 'central') {
      if (coolingSystem.age > 10) efficiency *= 0.75;
      else if (coolingSystem.age > 5) efficiency *= 0.9;
    } else if (coolingSystem.type === 'window-unit') {
      efficiency *= 0.8;
    }

    return efficiency;
  }

  private calculateInsulationScore(auditData: EnergyAuditData): number {
    const { insulation } = auditData.currentConditions;
    const scores: Record<string, number> = {
      'poor': 0,
      'average': 1,
      'good': 2,
      'excellent': 3
    };

    return (
      scores[insulation.attic as keyof typeof scores] +
      scores[insulation.walls as keyof typeof scores] +
      scores[insulation.basement as keyof typeof scores] +
      scores[insulation.floor as keyof typeof scores]
    ) / 12; // Normalize to 0-1 scale
  }

  private calculateWindowEfficiency(auditData: EnergyAuditData): number {
    const { windowType, windowCondition } = auditData.currentConditions;
    
    const typeScores: Record<string, number> = {
      'single': 0.3,
      'double': 0.7,
      'triple': 1.0,
      'not-sure': 0.5
    };

    const conditionScores: Record<string, number> = {
      'poor': 0.3,
      'fair': 0.6,
      'good': 0.8,
      'excellent': 1.0
    };

    const typeScore = typeScores[windowType as keyof typeof typeScores] || 0.5;
    const conditionScore = conditionScores[windowCondition as keyof typeof conditionScores] || 0.5;

    return (typeScore + conditionScore) / 2;
  }

  private getApplianceAge(auditData: EnergyAuditData): number {
    // Average age of major appliances
    return auditData.heatingCooling.heatingSystem.age;
  }

  private async findMatchingProducts(energyProfile: EnergyProfile): Promise<Product[]> {
    // Query database for products matching the energy profile
    const result = await this.pool.query(
      `SELECT * FROM products WHERE 
       category = ANY($1) AND 
       efficiency_rating >= $2
       ORDER BY efficiency_rating DESC
       LIMIT 10`,
      [this.determineRelevantCategories(energyProfile), 
       this.calculateMinEfficiencyThreshold(energyProfile)]
    );

    return result.rows;
  }

  private determineRelevantCategories(profile: EnergyProfile): string[] {
    const categories: string[] = [];
    
    if (profile.heatingEfficiency < 0.8) categories.push('heating');
    if (profile.coolingEfficiency < 0.8) categories.push('cooling');
    if (profile.insulationScore < 0.7) categories.push('insulation');
    if (profile.windowEfficiency < 0.6) categories.push('windows');
    
    return categories;
  }

  private calculateMinEfficiencyThreshold(profile: EnergyProfile): number {
    // Dynamic threshold based on current efficiency levels
    const values = Object.values(profile) as number[];
    return Math.min(...values) + 0.2;
  }

  private async calculatePotentialSavings(product: Product, auditData: EnergyAuditData): Promise<number> {
    // Calculate potential annual savings based on product specs and current usage
    const baselineUsage = this.calculateBaselineUsage(auditData);
    const projectedUsage = this.calculateProjectedUsage(baselineUsage, product);
    const energyRate = await this.getEnergyRate(auditData.basicInfo.address);
    
    return (baselineUsage - projectedUsage) * energyRate;
  }

  private calculateBaselineUsage(auditData: EnergyAuditData): number {
    return auditData.energyConsumption.monthlyBill * 12;
  }

  private calculateProjectedUsage(baselineUsage: number, product: Product): number {
    const efficiencyImprovement = parseFloat(product.efficiency.replace(/[^0-9.]/g, '')) / 100;
    return baselineUsage * (1 - efficiencyImprovement);
  }

  private async getEnergyRate(address: string): Promise<number> {
    // Lookup energy rate by location
    // For now, using US average
    return 0.14; // $0.14 per kWh
  }

  private calculatePriority(savings: number): 'high' | 'medium' | 'low' {
    if (savings > 500) return 'high';
    if (savings > 200) return 'medium';
    return 'low';
  }

  private generateRecommendationReason(product: Product, savings: number): string {
    return `Based on your energy audit, replacing your current ${product.mainCategory.toLowerCase()} ` +
           `with this ${product.name} could save you $${Math.round(savings)} annually`;
  }

  async storeRecommendations(recommendations: Recommendation[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const rec of recommendations) {
        await client.query(
          `INSERT INTO recommendations (
            id, user_id, product_id, type, priority,
            reason, potential_savings, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [rec.id, rec.userId, rec.productId, rec.type, rec.priority,
           rec.reason, rec.potentialSavings, rec.createdAt]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserRecommendations(userId: string): Promise<Recommendation[]> {
    const result = await this.pool.query(
      `SELECT * FROM recommendations 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}
