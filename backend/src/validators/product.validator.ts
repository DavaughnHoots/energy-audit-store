// backend/src/validators/product.validator.ts

import { z } from 'zod';
import { appLogger } from '../config/logger.js';

// Regular expressions for validation
const URL_REGEX = /^https?:\/\/.+/;
const ENERGY_STAR_ID_REGEX = /^[A-Z0-9]{6,20}$/;
const MODEL_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;
const UPC_CODE_REGEX = /^\d{12,14}$/;

// Product specification schema
const productSpecificationSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()])
).refine((specs) => Object.keys(specs).length > 0, {
  message: 'At least one specification is required'
});

// Product features schema
const productFeaturesSchema = z.array(z.string()
  .min(3, 'Feature description must be at least 3 characters')
  .max(200, 'Feature description must not exceed 200 characters')
).min(1, 'At least one feature is required');

// Market information schema
const marketInfoSchema = z.object({
  price: z.number()
    .positive('Price must be positive')
    .optional(),
  availability: z.enum(['in-stock', 'out-of-stock', 'pre-order', 'discontinued'])
    .optional(),
  retailer: z.string()
    .min(2, 'Retailer name must be at least 2 characters')
    .optional(),
  region: z.string()
    .min(2, 'Region must be at least 2 characters')
    .optional(),
  warranty: z.object({
    duration: z.number().positive('Warranty duration must be positive'),
    unit: z.enum(['days', 'months', 'years']),
    description: z.string()
  }).optional()
});

// Main product validation schema
const productSchema = z.object({
  energyStarId: z.string()
    .regex(ENERGY_STAR_ID_REGEX, 'Invalid ENERGY STAR ID format')
    .optional(),
  
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters'),
  
  mainCategory: z.string()
    .min(2, 'Main category must be at least 2 characters')
    .max(50, 'Main category must not exceed 50 characters'),
  
  subCategory: z.string()
    .min(2, 'Sub category must be at least 2 characters')
    .max(50, 'Sub category must not exceed 50 characters'),
  
  model: z.string()
    .regex(MODEL_NUMBER_REGEX, 'Invalid model number format'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  
  efficiency: z.object({
    rating: z.string()
      .min(1, 'Efficiency rating is required'),
    value: z.number()
      .positive('Efficiency value must be positive'),
    unit: z.string()
      .min(1, 'Efficiency unit is required')
  }),
  
  features: productFeaturesSchema,
  
  specifications: productSpecificationSchema,
  
  marketInfo: marketInfoSchema,
  
  productUrl: z.string()
    .regex(URL_REGEX, 'Invalid product URL format'),
  
  pdfUrl: z.string()
    .regex(URL_REGEX, 'Invalid PDF URL format')
    .optional(),
  
  upcCodes: z.array(z.string()
    .regex(UPC_CODE_REGEX, 'Invalid UPC code format'))
    .min(1, 'At least one UPC code is required')
    .optional(),
  
  additionalModels: z.array(z.string()
    .regex(MODEL_NUMBER_REGEX, 'Invalid model number format'))
    .optional(),
  
  active: z.boolean()
    .default(true),
  
  metadata: z.record(z.string(), z.unknown())
    .optional()
});

// Product filter validation schema
const productFilterSchema = z.object({
  mainCategory: z.string().optional(),
  subCategory: z.string().optional(),
  search: z.string().optional(),
  efficiency: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sortBy: z.enum(['price', 'efficiency', 'name', 'relevance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
}).refine(
  (data) => !(data.minPrice && data.maxPrice && data.minPrice > data.maxPrice),
  {
    message: 'Minimum price cannot be greater than maximum price',
    path: ['minPrice']
  }
);

// Product batch operation schema
const productBatchSchema = z.object({
  products: z.array(productSchema)
    .min(1, 'At least one product is required')
    .max(1000, 'Batch size cannot exceed 1000 products'),
  operation: z.enum(['create', 'update', 'delete'])
});

// Validation function that returns typed results
export interface ValidationResult<T> {
  success: boolean;
  errors?: z.ZodError;
  data?: T;
}

export const validateProduct = (data: unknown): ValidationResult<z.infer<typeof productSchema>> => {
  try {
    const validatedData = productSchema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      appLogger.warn('Product validation failed', {
        errors: error.errors
      });
      return {
        success: false,
        errors: error
      };
    }
    throw error;
  }
};

export const validateProductFilter = (data: unknown): ValidationResult<z.infer<typeof productFilterSchema>> => {
  try {
    const validatedData = productFilterSchema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      appLogger.warn('Product filter validation failed', {
        errors: error.errors
      });
      return {
        success: false,
        errors: error
      };
    }
    throw error;
  }
};

export const validateProductBatch = (data: unknown): ValidationResult<z.infer<typeof productBatchSchema>> => {
  try {
    const validatedData = productBatchSchema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      appLogger.warn('Product batch validation failed', {
        errors: error.errors
      });
      return {
        success: false,
        errors: error
      };
    }
    throw error;
  }
};

// Export types for use in other parts of the application
export type ProductType = z.infer<typeof productSchema>;
export type ProductFilterType = z.infer<typeof productFilterSchema>;
export type ProductBatchType = z.infer<typeof productBatchSchema>;
export type ProductSpecificationType = z.infer<typeof productSpecificationSchema>;
export type MarketInfoType = z.infer<typeof marketInfoSchema>;
