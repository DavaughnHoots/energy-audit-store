/**
 * Interface for product information. Matches the frontend Product interface
 * but includes backend-specific properties.
 */
export interface Product {
  id: string;
  name: string;
  category: string;
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
  rebateEligible: boolean;
  greenCertified: boolean;
  userRating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for product recommendation filters.
 * Used by the recommendation engine to filter products based on audit data.
 */
export interface ProductFilter {
  mainCategory?: string;
  subCategory?: string;
  energyEfficiency?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  rebateEligible?: boolean;
  greenCertified?: boolean;
  minUserRating?: number;
  maxPaybackPeriod?: number;
}

/**
 * Interface for recommendation context from an energy audit.
 * This provides the context needed to make personalized product recommendations.
 */
export interface RecommendationContext {
  auditId: string;
  propertyType: string;
  propertySize: number;
  buildingAge?: number;
  existingEquipment?: {
    lighting?: {
      types: string[];
      count: number;
      wattage: number;
    };
    hvac?: {
      type: string;
      age: number;
      efficiency: number;
    };
    appliances?: {
      type: string;
      count: number;
      age: number;
    }[];
  };
  energyUsage: {
    electricity: {
      annual: number;
      cost: number;
    };
    gas?: {
      annual: number;
      cost: number;
    };
  };
  prioritizedImprovements?: string[];
  budget?: number;
}

/**
 * Interface for a product recommendation.
 * Extends the Product interface with recommendation-specific properties.
 */
export interface ProductRecommendation extends Product {
  recommendationScore: number;
  savingsEstimate: {
    annual: number;
    fiveYear: number;
    tenYear: number;
  };
  environmentalImpact: {
    co2Reduction: number;
    equivalentTrees: number;
  };
  relevanceFactor: number;
  replacementFor?: string;
  installationComplexity: 'Low' | 'Medium' | 'High';
  auditContext: {
    auditId: string;
    recommendedDate: Date;
  };
}

/**
 * Interface for product recommendation response.
 * Wraps an array of product recommendations with metadata.
 */
export interface ProductRecommendationsResponse {
  recommendations: ProductRecommendation[];
  totalSavings: {
    annual: number;
    fiveYear: number;
    tenYear: number;
  };
  totalEnvironmentalImpact: {
    co2Reduction: number;
    equivalentTrees: number;
  };
  metadata: {
    generatedDate: Date;
    criteriaUsed: string[];
    count: number;
  };
}
