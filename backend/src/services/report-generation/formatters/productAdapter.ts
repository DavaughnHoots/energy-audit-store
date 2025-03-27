/**
 * Product Adapter for Report Generation
 * 
 * This module provides functionality to adapt product data for use in report generation.
 * It handles compatibility between the product data format used in recommendations
 * and the format expected by the report generation system.
 */

import { Product, ProductRecommendation } from '../../../types/product.js';

/**
 * Adapts a product recommendation for use in report generation
 */
export function adaptProductForReport(product: ProductRecommendation): any {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    subCategory: product.subCategory || '',
    price: product.price,
    energyEfficiency: product.energyEfficiency,
    annualSavings: product.savingsEstimate?.annual || product.annualSavings,
    roi: product.roi,
    paybackPeriod: product.paybackPeriod,
    features: product.features || [],
    description: product.description,
    imageUrl: product.imageUrl || '',
    manufacturerUrl: product.manufacturerUrl || '',
    rebateEligible: product.rebateEligible || false,
    greenCertified: product.greenCertified || false,
    userRating: product.userRating || 0,
    installationComplexity: product.installationComplexity || 'Medium',
    environmentalImpact: {
      co2Reduction: product.environmentalImpact?.co2Reduction || 0,
      equivalentTrees: product.environmentalImpact?.equivalentTrees || 0
    },
    savingsEstimate: {
      annual: product.savingsEstimate?.annual || product.annualSavings,
      fiveYear: product.savingsEstimate?.fiveYear || (product.annualSavings * 5),
      tenYear: product.savingsEstimate?.tenYear || (product.annualSavings * 10)
    }
  };
}

/**
 * Converts a product recommendation to a report-friendly format with formatted values
 */
export function formatProductForReportDisplay(product: ProductRecommendation): any {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  
  const adapted = adaptProductForReport(product);
  
  return {
    ...adapted,
    priceFormatted: formatter.format(product.price),
    annualSavingsFormatted: formatter.format(adapted.savingsEstimate.annual),
    fiveYearSavingsFormatted: formatter.format(adapted.savingsEstimate.fiveYear),
    tenYearSavingsFormatted: formatter.format(adapted.savingsEstimate.tenYear),
    roiFormatted: percentFormatter.format(product.roi / 100),
    paybackPeriodFormatted: 
      product.paybackPeriod < 1 
        ? `${Math.round(product.paybackPeriod * 12)} months` 
        : `${product.paybackPeriod.toFixed(1)} years`,
    efficiencyRating: product.energyEfficiency,
    co2ReductionFormatted: `${Math.round(adapted.environmentalImpact.co2Reduction).toLocaleString()} kg`,
    treesEquivalentFormatted: Math.round(adapted.environmentalImpact.equivalentTrees).toLocaleString()
  };
}

/**
 * Groups product recommendations by category for better organization in reports
 */
export function groupProductsByCategory(products: ProductRecommendation[]): Record<string, ProductRecommendation[]> {
  const grouped: Record<string, ProductRecommendation[]> = {};
  
  for (const product of products) {
    const category = product.category;
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(product);
  }
  
  return grouped;
}

/**
 * Sorts products by various criteria for display in reports
 */
export function sortProductsForReport(
  products: ProductRecommendation[], 
  sortBy: 'savings' | 'roi' | 'payback' | 'price' = 'savings'
): ProductRecommendation[] {
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'savings':
        return (b.savingsEstimate?.annual || b.annualSavings) - (a.savingsEstimate?.annual || a.annualSavings);
      case 'roi':
        return b.roi - a.roi;
      case 'payback':
        return a.paybackPeriod - b.paybackPeriod;
      case 'price':
        return a.price - b.price;
      default:
        return (b.savingsEstimate?.annual || b.annualSavings) - (a.savingsEstimate?.annual || a.annualSavings);
    }
  });
}
