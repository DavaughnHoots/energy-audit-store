/**
 * Interface for product information
 */
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  energyEfficiency: string;
  features: string[];
  description: string;
  imageUrl?: string;
  annualSavings: number;
  roi: number;
  paybackPeriod: number;
  audit_id?: string;
  audit_date?: string;
}

/**
 * Interface for detailed product information
 */
export interface DetailedProduct extends Product {
  auditContext: AuditContext;
  enhancedMetrics: EnhancedMetrics;
  isSample: boolean;
}

/**
 * Interface for audit context
 */
export interface AuditContext {
  auditId: string;
  auditDate: string;
  propertyInfo: {
    propertySize?: number;
    propertyType?: string;
    buildingAge?: number;
    location?: string;
    occupants?: number;
  };
  energyInfo: {
    electricityUsage?: number;
    electricityCost?: number;
    gasUsage?: number;
    gasCost?: number;
  };
}

/**
 * Interface for enhanced product metrics
 */
export interface EnhancedMetrics {
  fiveYearSavings: number;
  tenYearSavings: number;
  monthlySavings: number;
  percentageReduction: number;
  co2Reduction: CO2Reduction;
}

/**
 * Interface for CO2 reduction metrics
 */
export interface CO2Reduction {
  annual: number;
  fiveYear: number;
  tenYear: number;
  equivalentTrees: number;
  equivalentMilesDriven: number;
}
