import { getEstimator, ProductCategory, RegionCode } from './productEstimation/estimatorFactory';
import { Dehumidifier } from './productEstimation/DehumidifierEstimator';
import { validateConfig, ProductEstimationsConfig } from '../schemas/productEstimationSchema';
import { EstimateResult } from './productEstimation/types';
import { requestCache } from '../utils/requestCache';

// This cache stores the configuration once loaded to avoid multiple network requests
let configCache: ProductEstimationsConfig | null = null;

/**
 * Load the product estimations configuration from the server
 * with caching to avoid repeated network requests
 * 
 * @returns Promise resolving to the validated configuration
 */
export async function loadEstimationsConfig(): Promise<ProductEstimationsConfig> {
  // Return from cache if available
  if (configCache) {
    return configCache;
  }

  try {
    // Fetch configuration from server
    const response = await fetch('/data/product-estimations.json', {
      signal: requestCache.createSignal('estimations-config')
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load estimations config: ${response.status} ${response.statusText}`);
    }
    
    const configData = await response.json();
    
    // Validate configuration before returning
    const validConfig = validateConfig(configData);
    
    // Cache the validated config
    configCache = validConfig;
    
    return validConfig;
  } catch (error) {
    console.error('Error loading estimations config:', error);
    throw new Error('Failed to load product estimation configuration. Please try again later.');
  }
}

/**
 * Determine product category based on product data
 * 
 * @param product - The product object from the API
 * @returns The determined product category or throws if unable to determine
 */
export function determineProductCategory(product: any): ProductCategory {
  // Use product category or name to determine the appropriate category
  const category = product.category?.toLowerCase() || '';
  const name = product.name?.toLowerCase() || '';
  
  if (category.includes('dehumidifier') || name.includes('dehumidifier')) {
    return 'dehumidifier';
  }
  
  if (category.includes('refrigerator') || name.includes('refrigerator') || name.includes('fridge')) {
    return 'refrigerator';
  }
  
  if (category.includes('hvac') || 
      name.includes('hvac') || 
      name.includes('heating') || 
      name.includes('cooling') ||
      name.includes('air conditioner') ||
      name.includes('heat pump')) {
    return 'hvac';
  }
  
  // Default to dehumidifier for demo purposes
  // In production, we would want to handle this differently or throw an error
  return 'dehumidifier';
}

/**
 * Extract relevant attributes for a dehumidifier product
 * 
 * @param product - The product object from the API
 * @returns Extracted attributes specific to dehumidifiers
 */
export function extractDehumidifierAttributes(product: any): Dehumidifier {
  // Extract capacity information
  let capacityPintsPerDay: number | undefined;
  
  // Try to extract capacity from various fields
  if (product.specifications?.capacity) {
    capacityPintsPerDay = parseFloat(product.specifications.capacity);
  } else if (product.description) {
    // Try to extract capacity from the description
    const capacityMatch = product.description.match(/([\d.]+)\s*(?:pints?|pt)(?:\s*\/|\s+per)?\s*(?:day|24h|24 hours)/i);
    if (capacityMatch) {
      capacityPintsPerDay = parseFloat(capacityMatch[1]);
    }
  }
  
  // Determine if product is ENERGY STAR or Most Efficient
  const isEnergyStar = (
    (product.energyEfficiency?.toLowerCase()?.includes('energy star')) ||
    (product.description?.toLowerCase()?.includes('energy star')) ||
    (product.features?.some((f: string) => f.toLowerCase().includes('energy star')))
  ) || false;
  
  const isMostEfficient = (
    (product.energyEfficiency?.toLowerCase()?.includes('most efficient')) ||
    (product.description?.toLowerCase()?.includes('most efficient')) ||
    (product.features?.some((f: string) => f.toLowerCase().includes('most efficient')))
  ) || false;
  
  return {
    capacityPintsPerDay,
    isEnergyStar,
    isMostEfficient
  };
}

/**
 * Get user's region code, either from preferences or geolocation
 * 
 * @returns The region code or US-avg if unable to determine
 */
export function getUserRegion(): RegionCode {
  // In a real app, this would come from user preferences or geolocation
  // For now, we'll just return US average
  return 'US-avg';
}

/**
 * Generate estimation values for a product
 * 
 * @param product - The product object from the API
 * @returns Promise resolving to the estimate result
 */
export async function generateProductEstimates(product: any): Promise<EstimateResult> {
  try {
    // Load configuration
    const config = await loadEstimationsConfig();
    
    // Determine product category
    const category = determineProductCategory(product);
    
    // Get region code
    const region = getUserRegion();
    
    // Get the appropriate estimator
    const estimator = getEstimator(category, config, region);
    
    // Extract attributes based on category
    let attributes: any;
    switch (category) {
      case 'dehumidifier':
        attributes = extractDehumidifierAttributes(product);
        break;
      // Add other categories as they're implemented
      default:
        attributes = {};
    }
    
    // Calculate estimates
    const estimates = estimator.estimate(attributes);
    
    return estimates;
  } catch (error) {
    console.error('Error generating product estimates:', error);
    throw new Error('Failed to generate product estimates. Please try again later.');
  }
}

/**
 * Enhance product object with estimation values
 * 
 * @param product - The product object from the API
 * @returns Promise resolving to the enhanced product object
 */
export async function enhanceProductWithEstimates(product: any): Promise<any> {
  try {
    // Only calculate if we're missing essential values
    if (product && (product.price === 0 || product.annualSavings === 0 || product.roi === 0)) {
      const estimates = await generateProductEstimates(product);
      
      // Merge the estimates with the product
      return {
        ...product,
        price: estimates.price,
        annualSavings: estimates.annualSavings,
        roi: estimates.roi,
        paybackPeriod: estimates.paybackPeriod,
        energyEfficiency: estimates.energyEfficiency || product.energyEfficiency,
        formattedPrice: estimates.formattedPrice,
        formattedAnnualSavings: estimates.formattedAnnualSavings,
        formattedRoi: estimates.formattedRoi,
        formattedPaybackPeriod: estimates.formattedPaybackPeriod,
        additionalMetrics: estimates.additionalMetrics,
        confidenceLevel: estimates.confidenceLevel
      };
    }
    
    // If we already have values, just return the product as is
    return product;
  } catch (error) {
    console.error('Error enhancing product with estimates:', error);
    // Return original product if enhancement fails
    return product;
  }
}
