/**
 * Interface for product information in the frontend.
 * Similar to the backend Product interface but optimized for UI display.
 */
export interface Product {
  id: string;
  name: string;
  category: string; // Main category (replacing mainCategory)
  subCategory?: string;
  price: number;
  energyEfficiency: string; // e.g. "A++", "A+", "A", etc.
  features: string[];
  description: string;
  imageUrl?: string;
  manufacturerUrl?: string;
  annualSavings: number;
  roi: number;
  paybackPeriod: number;
  rebateEligible?: boolean;
  greenCertified?: boolean;
  userRating?: number;
  model?: string; // For backward compatibility with existing code
  audit_id?: string;
  audit_date?: string;
}

/**
 * Interface for product filters used in the frontend.
 */
export interface ProductFilter {
  mainCategory?: string; // For backward compatibility (maps to category)
  subCategory?: string;
  efficiency?: string; // Maps to energyEfficiency
  search?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  rebateEligible?: boolean;
  greenCertified?: boolean;
  minUserRating?: number;
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
