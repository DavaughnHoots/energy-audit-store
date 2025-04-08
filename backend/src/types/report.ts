import { AuditRecommendation } from './energyAudit.js';

export interface ReportData {
  metadata: {
    reportId: string;
    reportDate: string;
    analysisType: string;
    version: string;
  };
  executiveSummary: {
    totalEnergy: number;
    efficiencyScore: number;
    energyEfficiency: number;
    potentialSavings: number;
  };
  propertyInfo: {
    address: string;
    propertyType: string;
    yearBuilt: string;
    squareFootage: number;
  };
  currentConditions: {
    insulation: string;
    windows: string;
    hvacSystemAge: number;
  };
  energyConsumption: {
    electricityUsage: number;
    gasUsage: number;
    usageHours: number;
    powerFactor: number;
    seasonalFactor: number;
    occupancyFactor: number;
  };
  lighting: {
    bulbTypes: {
      led: number;
      cfl: number;
      incandescent: number;
    };
    naturalLight: string;
    controls: string;
  };
  recommendations: AuditRecommendation[];
  charts: {
    energyBreakdown: any[];
    savingsAnalysis: any[];
    consumption: any[];
  };
  summary: {
    totalEstimatedSavings: number;
    totalActualSavings: number;
    implementedCount: number;
    savingsAccuracy: number | null;
  };
}
