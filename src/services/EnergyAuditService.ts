// src/services/energyAuditService.ts

import { EnergyAuditData, HomeDetails, CurrentConditions, HeatingCooling } from '../types/energyAudit';

export interface AuditRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  estimatedCost: number;
  paybackPeriod: number;
  products?: string[]; // Product IDs from the catalog
}

export class EnergyAuditService {
  private calculateInsulationScore(conditions: CurrentConditions): number {
    const scores = {
      poor: 0,
      average: 1,
      good: 2,
      excellent: 3,
      'not-sure': 1,
    };

    return (
      scores[conditions.insulation.attic]: +
      scores[conditions.insulation.walls] +
      scores[conditions.insulation.basement] +
      scores[conditions.insulation.floor]
    ) / 4;
  }

  private calculateWindowScore(conditions: CurrentConditions): number {
    const windowTypeScores = {
      single: 0,
      double: 2,
      triple: 3,
      'not-sure': 1,
    };

    const conditionScores = {
      poor: 0,
      fair: 1,
      good: 2,
      excellent: 3,
    };

    return (windowTypeScores[conditions.windowType as keyof typeof windowTypeScores] + conditionScores[conditions.windowCondition as keyof typeof conditionScores]) / 2;
  }

  private calculateHVACScore(hvac: HeatingCooling): number {
    let score = 3; // Start with maximum score

    // Reduce score based on system age
    if (hvac.heatingSystem.age > 15) score -= 2;
    else if (hvac.heatingSystem.age > 10) score -= 1;

    // Reduce score if service is overdue
    const lastService = new Date(hvac.heatingSystem.lastService);
    const monthsSinceService = (new Date().getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24 * 30);

    return score;