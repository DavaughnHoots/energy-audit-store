// src/types/product.ts
export interface Product {
  id: string;
  productUrl: string;
  mainCategory: string;
  subCategory: string;
  name: string;
  model: string;
  description: string;
  efficiency: string;
  features: string[];
  marketInfo: string;
  energyStarId: string;
  upcCodes?: string;
  additionalModels?: string;
  pdfUrl?: string;
  specifications: {
    [key: string]: string | number;
  };
}

export type ProductFilters = {
  mainCategory?: string;
  subCategory?: string;
  search?: string;
  efficiency?: string;
}