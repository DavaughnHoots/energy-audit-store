import { AuditRecommendation } from './energyAudit';

/**
 * Interface for an individual audit history entry
 */
export interface AuditHistoryEntry {
  id: string;
  date: string;
  address: string;
  recommendations: number;
  title: string;
  status: 'completed' | 'in_progress';
}

/**
 * Interface for paginated audit history response
 */
export interface PaginatedAuditHistory {
  audits: AuditHistoryEntry[];
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

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
    yearBuilt: string | number;
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
    energyBreakdown: ChartDataPoint[];
    savingsAnalysis: SavingsChartDataPoint[];
    consumption: ChartDataPoint[];
  };
  summary: {
    totalEstimatedSavings: number;
    totalActualSavings: number;
    implementedCount: number;
    savingsAccuracy: number | null;
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: string;
}

export interface SavingsChartDataPoint {
  name: string;
  estimatedSavings: number;
  actualSavings: number;
}
