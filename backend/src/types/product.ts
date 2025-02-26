// src/types/product.ts
export interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  energyRating?: string;
  price?: number;
  rebateAmount?: number;
  description: string;
  imageUrl?: string;
  specifications: {
    [key: string]: string | number;
  };
  annualEnergySavings?: number;
  modelNumber?: string;
  warrantyYears?: number;
  // Required fields from productDataService
  productUrl: string;
  mainCategory: string;
  subCategory: string;
  efficiency: string;
  features: string[];
  marketInfo: string;
  energyStarId: string;
  model: string;
  upcCodes?: string;
  additionalModels?: string;
  pdfUrl?: string;
}

export interface ProductFilters {
  category?: string;
  energyRating?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  hasRebate?: boolean;
  search?: string;
  mainCategory?: string;
  subCategory?: string;
  efficiency?: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
