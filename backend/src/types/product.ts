export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  mainCategory?: string; // Added to fix type errors
  subCategory?: string; // Added to fix type errors
  brand?: string; // Added to fix type errors
  model?: string; // Added to fix type errors
  rating: number;
  image: string;
  productUrl?: string; // Added to fix type errors
  energyRating?: string; // Added to fix type errors
  efficiency?: number; // Added to fix type errors
  rebateAmount?: number; // Added to fix type errors
  dateAdded: string;
  inStock: boolean;
  features?: string[];
  specifications?: Record<string, string>;
  greenCertified?: boolean;
  minUserRating?: number;
}

// Extended interface for price range with min/max
export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductFilter {
  category?: string;
  priceRange?: PriceRange; // Changed from tuple to object with min/max
  rating?: number;
  brand?: string;
  inStock?: boolean;
  mainCategory?: string; // Added to fix errors
  subCategory?: string; // Added to fix errors
  energyRating?: string; // Added to fix errors
  energyEfficiency?: number; // Added to fix errors
  hasRebate?: boolean; // Added to fix errors
  rebateEligible?: boolean; // Added to fix errors
  greenCertified?: boolean; // Added to fix errors
  minUserRating?: number; // Added to fix errors
  search?: string; // Added to fix errors
}

// Alias for backward compatibility
export type ProductFilters = ProductFilter;

// Add missing ProductRecommendation type
export interface ProductRecommendation {
  id: string;
  productId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  savingsEstimate: number;
  roi: number;
  installationComplexity: string;
  energySavingsPercentage: number;
  imageUrl?: string;
  recommended: boolean;
  priority: number;
  relevanceScore: number;
}
