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
}

export interface ProductFilter {
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  brand?: string;
  inStock?: boolean;
}

// Alias for backward compatibility
export type ProductFilters = ProductFilter;
