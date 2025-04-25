/**
 * Common interfaces for product estimation system
 */

/**
 * Estimation result interface
 * Contains calculated values and formatted display strings
 * Additional metrics can be added via additionalMetrics property
 */
export interface EstimateResult {
  // Calculated values
  price: number;
  annualSavings: number;
  roi: number;
  paybackPeriod: number;
  energyEfficiency: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  
  // Formatted values for UI display
  formattedPrice: string;
  formattedAnnualSavings: string;
  formattedRoi: string;
  formattedPaybackPeriod: string;

  // Additional metrics for extensibility (e.g., carbon footprint)
  additionalMetrics?: Record<string, any>;
}

/**
 * Base interface for all product estimators
 * 
 * @template T - The product type (DehumidifierProduct, RefrigeratorProduct, etc.)
 */
export interface ProductEstimator<T> {
  /**
   * Calculate estimates for a product
   * 
   * @param product - Product attributes
   * @returns Calculated estimates including price, savings, ROI, and more
   */
  estimate(product: T): EstimateResult;
}

/**
 * Custom error for unsupported product categories
 */
export class UnsupportedCategoryError extends Error {
  constructor(category: string) {
    super(`Unsupported product category: ${category}`);
    this.name = 'UnsupportedCategoryError';
  }
}
