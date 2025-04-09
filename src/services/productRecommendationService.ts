import { API_ENDPOINTS } from '../config/api';
import { fetchWithAuth, getAccessToken } from '../utils/authUtils';
import { AuditRecommendation } from '../types/energyAudit';
import { mapRecommendationTypeToCategory as importedMapRecommendationTypeToCategory } from './recommendation/categoryMapping';
import { isPreferenceMatchingCategory as importedIsPreferenceMatchingCategory } from './recommendation/preferenceMatching';
import { getDefaultProductsForCategory as importedGetDefaultProductsForCategory } from './recommendation/defaultProducts';
import { filterRecommendationsByUserPreferences as importedFilterRecommendationsByUserPreferences } from './recommendation/filtering';

// Critical category handling to ensure all important categories get recommendations
const CRITICAL_CATEGORIES = [
  'hvac', 'heating', 'cooling',
  'lighting', 
  'insulation',
  'windows', 'doors',
  'appliances',
  'water_heating', 'water-heating',
  'smart_home', 'smart-home',
  'renewable', 'solar',
  'humidity', 'dehumidification'
];

/**
 * Checks if a recommendation matches a critical category that should always be shown
 * @param recommendation The recommendation to check
 * @returns Whether the recommendation matches a critical category
 */
const matchesCriticalCategory = (recommendation: AuditRecommendation): boolean => {
  // Get the category mapping
  const mapping = importedMapRecommendationTypeToCategory(recommendation.type, recommendation.title);
  
  // Check if the recommendation type or mapped category matches any critical category
  return CRITICAL_CATEGORIES.some(category => 
    recommendation.type.toLowerCase().includes(category) ||
    mapping.mainCategory.toLowerCase().includes(category) ||
    mapping.subCategory.toLowerCase().includes(category) ||
    recommendation.title.toLowerCase().includes(category)
  );
};

// Product interface from ProductComparisons.tsx
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  energyEfficiency: string;
  features: string[];
  description: string;
  imageUrl?: string;
  annualSavings: number;
  roi: number;
  paybackPeriod: number;
  audit_id?: string;
  audit_date?: string;
}

export interface ProductRecommendationMatch {
  recommendationId: string;
  products: Product[];
  financialData?: {
    estimatedSavings: number;
    implementationCost: number;
    paybackPeriod: number;
  };
}

/**
 * Maps recommendation types to product categories and subcategories
 * @param type The recommendation type
 * @param title The recommendation title (optional)
 * @returns The corresponding product main category and subcategory
 */
export interface CategoryMapping {
  mainCategory: string;
  subCategory: string;
}

// Re-export from modules for backwards compatibility
export { 
  importedMapRecommendationTypeToCategory as mapRecommendationTypeToCategory, 
  importedIsPreferenceMatchingCategory as isPreferenceMatchingCategory, 
  importedGetDefaultProductsForCategory as getDefaultProductsForCategory,
  importedFilterRecommendationsByUserPreferences as filterRecommendationsByUserPreferences
};

/**
 * Fetches the product catalog
 * @returns Promise resolving to the product catalog
 */
export const fetchProductCatalog = async (): Promise<Product[]> => {
  try {
    console.log('Fetching product catalog...');
    console.log('API URL:', API_ENDPOINTS.PRODUCTS);
    console.log('Auth token present:', !!getAccessToken());
    
    const response = await fetchWithAuth(`${API_ENDPOINTS.PRODUCTS}`, {
      method: 'GET'
    });

    if (!response.ok) {
      console.error(`Failed to fetch product catalog: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch product catalog: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Product catalog data:', data);
    console.log('Response status:', response.status);
    console.log('First 100 chars of response:', JSON.stringify(data).substring(0, 100));
    
    const products = data.products || [];
    console.log(`Retrieved ${products.length} products from the catalog`);
    return products;
  } catch (error) {
    console.error('Error fetching product catalog:', error);
    return []; // Return empty array on error
  }
};

/**
 * Enhanced product catalog fetching that tries multiple methods
 * @returns Promise resolving to the product catalog
 */
export const fetchEnhancedProductCatalog = async (): Promise<Product[]> => {
  try {
    console.log('Fetching product catalog using enhanced method...');
    
    // First try the product history endpoint (which we know works)
    const historyResponse = await fetch(`${API_ENDPOINTS.DASHBOARD.PRODUCT_HISTORY}`, {
      method: 'GET',
      credentials: 'include'  // Critical for auth cookies
    });
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      const products = historyData.productHistory || [];
      console.log(`Retrieved ${products.length} products from history`);
      
      if (products.length > 0) {
        return products;
      }
    }
    
    // If history fails or returns empty, try the products endpoint
    const productsResponse = await fetch(`${API_ENDPOINTS.PRODUCTS}`, {
      method: 'GET',
      credentials: 'include'  // Critical for auth cookies
    });
    
    if (!productsResponse.ok) {
      console.error(`Failed to fetch product catalog: ${productsResponse.status} ${productsResponse.statusText}`);
      return [];
    }
    
    const data = await productsResponse.json();
    console.log('Product catalog data:', data);
    
    // Try different response formats that the API might be using
    const products = data.products || data.items || data.productCatalog || [];
    console.log(`Retrieved ${products.length} products from catalog`);
    
    return products;
  } catch (error) {
    console.error('Error fetching enhanced product catalog:', error);
    return []; // Return empty array on error
  }
};

/**
 * Fetches product history (products from past audits)
 * @returns Promise resolving to product history
 */
export const fetchProductHistory = async (): Promise<Product[]> => {
  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.DASHBOARD.PRODUCT_HISTORY}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product history: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.productHistory || [];
  } catch (error) {
    console.error('Error fetching product history:', error);
    return []; // Return empty array on error
  }
};

/**
 * Fetches detailed information for a specific product
 * @param productId The product ID
 * @returns Promise resolving to the product details
 */
export const fetchProductDetails = async (productId: string): Promise<Product | null> => {
  try {
    const response = await fetchWithAuth(
      `${API_ENDPOINTS.RECOMMENDATIONS.GET_PRODUCT_DETAIL(productId)}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch product details: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.product || null;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
};

/**
 * Matches recommendations with suitable products
 * @param recommendations The recommendations to match products for
 * @param userCategoryPreferences User's preferred product categories
 * @param budgetConstraint User's budget constraint
 * @returns Promise resolving to matched product recommendations
 */
export const matchProductsToRecommendations = async (
  recommendations: AuditRecommendation[],
  userCategoryPreferences: string[] = [],
  budgetConstraint: number = 0
): Promise<ProductRecommendationMatch[]> => {
  try {
    console.log('matchProductsToRecommendations called with:', {
      recommendations: recommendations.length,
      userCategoryPreferences,
      budgetConstraint
    });
    
    // Use the enhanced fetching method first
    let productCatalog = await fetchEnhancedProductCatalog();
    console.log(`Enhanced product catalog has ${productCatalog.length} items`);
    
    // Fallback to the original method if that returned nothing
    if (productCatalog.length === 0) {
      console.log('Enhanced catalog empty, trying original method...');
      productCatalog = await fetchProductCatalog();
      console.log(`Original product catalog has ${productCatalog.length} items`);
    }
    
    // If product catalog is still empty, create default products
    if (productCatalog.length === 0) {
      console.log('Using default products since catalog is empty');
      // Create a varied set of default products across categories
      productCatalog = [
        ...importedGetDefaultProductsForCategory('Lighting & Fans', 'Light Bulbs', 'lighting'),
        ...importedGetDefaultProductsForCategory('Lighting & Fans', 'Light Fixtures', 'lighting'),
        ...importedGetDefaultProductsForCategory('Heating & Cooling', 'HVAC Systems', 'hvac'),
        ...importedGetDefaultProductsForCategory('Heating & Cooling', 'Thermostats', 'hvac'),
        ...importedGetDefaultProductsForCategory('Building Products', 'Insulation', 'insulation'),
        ...importedGetDefaultProductsForCategory('Water Heaters', '', 'water-heating')
      ];
      console.log(`Created ${productCatalog.length} default products`);
    }
    
    // Create matches for each recommendation
    const matches: ProductRecommendationMatch[] = [];
    
    for (const recommendation of recommendations) {
      console.log(`Processing recommendation: ${recommendation.title} (type: ${recommendation.type})`);
      
      // Map recommendation type and title to product category
      const recommendationCategory = importedMapRecommendationTypeToCategory(recommendation.type, recommendation.title);
      console.log(`Mapped recommendation type and title to category: ${JSON.stringify(recommendationCategory)}`);
      
      // Modified preference filtering logic
      if (userCategoryPreferences.length > 0) {
        // Check if the recommendation matches any user preference
        const matchesUserPreference = userCategoryPreferences.some(pref => 
          importedIsPreferenceMatchingCategory(pref, recommendationCategory.mainCategory) || 
          importedIsPreferenceMatchingCategory(pref, recommendationCategory.subCategory) ||
          pref.toLowerCase() === recommendation.type.toLowerCase()
        );
        
        // Check if it's a critical category that should always be shown
        const isCriticalCategory = matchesCriticalCategory(recommendation);
        
        // Only skip if it doesn't match preferences AND it's not a critical category
        if (!matchesUserPreference && !isCriticalCategory) {
          console.log(`Skipping recommendation as it doesn't match user preferences and isn't a critical category`);
          continue;
        } else if (!matchesUserPreference && isCriticalCategory) {
          console.log(`Including recommendation that doesn't match preferences because it's a critical category: ${recommendation.type}`);
        }
      }
      
      // Find matching products for this recommendation
      let matchingProducts = productCatalog.filter((product: Product) => {
        // Match by main category or subcategory
        const categoryMatch = 
          product.category.toLowerCase() === recommendationCategory.mainCategory.toLowerCase() || 
          product.category.toLowerCase() === recommendationCategory.subCategory.toLowerCase();
        
        // Check budget constraint if provided
        const withinBudget = budgetConstraint <= 0 || product.price <= budgetConstraint;
        
        return categoryMatch && withinBudget;
      });
      
      console.log(`Found ${matchingProducts.length} matching products for recommendation ${recommendation.title}`);
      
      // If no products match this recommendation, use default products for its category
      if (matchingProducts.length === 0) {
        console.log(`Using default products for recommendation ${recommendation.title}`);
        matchingProducts = importedGetDefaultProductsForCategory(
          recommendationCategory.mainCategory, 
          recommendationCategory.subCategory,
          recommendation.type
        );
        console.log(`Added ${matchingProducts.length} default products for this recommendation`);
      }
      
      // Sort by best value (highest ROI)
      const sortedProducts = matchingProducts.sort((a: Product, b: Product) => b.roi - a.roi);
      
      // Take top matches (limit to 3)
      const topMatches = sortedProducts.slice(0, 3);
      console.log(`Selected top ${topMatches.length} product matches`);
      
      // Calculate financial data for the recommendation based on matched products
      if (topMatches.length > 0) {
        // Update recommendation financial data with products' average values
        const avgSavings = Math.round(topMatches.reduce((sum: number, p: Product) => sum + p.annualSavings, 0) / topMatches.length);
        const avgCost = Math.round(topMatches.reduce((sum: number, p: Product) => sum + p.price, 0) / topMatches.length);
        const avgPayback = +(topMatches.reduce((sum: number, p: Product) => sum + p.paybackPeriod, 0) / topMatches.length).toFixed(1);
        
        // Directly attempt to update the recommendation object with this financial data
        // Update both estimatedSavings and related fields to ensure consistency across UI components
        if (recommendation.estimatedSavings === undefined || recommendation.estimatedSavings === 0) {
          recommendation.estimatedSavings = avgSavings;
          console.log(`Updated recommendation savings to $${avgSavings}`);
        }
        
        // Update both cost fields for proper display in all UI components
        // This ensures costs show up regardless of which field components check first
        if (recommendation.estimatedCost === undefined || recommendation.estimatedCost === 0) {
          recommendation.estimatedCost = avgCost;
          console.log(`Updated recommendation estimatedCost to $${avgCost}`);
        }
        
        if (recommendation.implementationCost === undefined || recommendation.implementationCost === 0) {
          recommendation.implementationCost = avgCost;
          console.log(`Updated recommendation implementationCost to $${avgCost}`);
        }
        
        if (recommendation.paybackPeriod === undefined || recommendation.paybackPeriod === 0) {
          recommendation.paybackPeriod = avgPayback;
          console.log(`Updated recommendation payback to ${avgPayback} years`);
        }
      }
      
      matches.push({
        recommendationId: recommendation.id,
        products: topMatches,
        // Also include financial data in the match response
        financialData: topMatches.length > 0 ? {
          estimatedSavings: Math.round(topMatches.reduce((sum: number, p: Product) => sum + p.annualSavings, 0) / topMatches.length),
          implementationCost: Math.round(topMatches.reduce((sum: number, p: Product) => sum + p.price, 0) / topMatches.length),
          paybackPeriod: +(topMatches.reduce((sum: number, p: Product) => sum + p.paybackPeriod, 0) / topMatches.length).toFixed(1)
        } : undefined
      });
    }
    
    console.log(`Returning ${matches.length} product recommendation matches`);
    return matches;
  } catch (error) {
    console.error('Error matching products to recommendations:', error);
    return [];
  }
};
