/**
 * Frontend types for product data.
 * These match the backend types but include frontend-specific properties.
 */

/**
 * Product interface for the frontend.
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
  // Frontend-specific properties
  model?: string;
  specifications?: Record<string, unknown>;
  productUrl?: string;
}

/**
 * Interface for product filters
 */
export interface ProductFilter {
  mainCategory?: string;
  subCategory?: string;
  search?: string;
  efficiency?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  rebateEligible?: boolean;
  greenCertified?: boolean;
  minUserRating?: number;
  maxPaybackPeriod?: number;
}
