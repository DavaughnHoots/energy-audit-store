/**
 * Product interface representing an energy-efficient product
 */
export interface Product {
  id: string;
  name: string;
  manufacturer: string; // Company that makes the product
  brand?: string; // Brand name if different from manufacturer
  model?: string; // Model number or identifier
  category: string; // Main category (HVAC, Lighting, etc.)
  subCategory: string; // More specific type (heat-pump, led-bulb, etc.)
  description: string;
  features: string[]; // Key features/benefits
  specs: {
    [key: string]: any; // Technical specifications
  };
  efficiency: {
    rating: string; // Text label (Excellent, Good, etc.)
    value: number; // Numeric efficiency value
    unit: string; // Unit of measurement (SEER, EER, lumens/watt, etc.)
  };
  price: number;
  currency?: string; // Currency code (USD, EUR, etc.)
  imageUrl?: string;
  productUrl?: string; // URL to purchase or view details
  rebateEligible?: boolean;
  rebateAmount?: number;
  greenCertified?: boolean;
  userRating?: number; // Average user rating
  reviewCount?: number; // Number of reviews
  mainCategory?: string; // Fallback for API compatibility
}

/**
 * Filter parameters for product API queries
 */
export interface ProductFilter {
  mainCategory?: string;
  subCategory?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  efficiencyRating?: string;
  rebateEligible?: boolean;
  greenCertified?: boolean;
  minUserRating?: number;
}

/**
 * Product category metadata
 */
export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  subCategories: string[];
}
