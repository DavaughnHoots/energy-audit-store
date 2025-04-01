import { API_ENDPOINTS } from '../config/api';
import { fetchWithAuth, getAccessToken } from '../utils/authUtils';
import { AuditRecommendation } from '../types/energyAudit';

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
}

/**
 * Maps recommendation types to product categories
 * @param type The recommendation type
 * @returns The corresponding product category
 */
export const mapRecommendationTypeToCategory = (type: string): string => {
  const typeToCategory: Record<string, string> = {
    'hvac': 'hvac',
    'heating': 'hvac',
    'cooling': 'hvac',
    'insulation': 'insulation',
    'windows': 'windows & doors',
    'doors': 'windows & doors',
    'lighting': 'lighting',
    'appliances': 'energy-efficient appliances',
    'water-heating': 'water heating',
    'smart-home': 'smart home devices',
    'renewable': 'renewable energy',
    'solar': 'renewable energy',
    'weatherization': 'windows & doors',
    'thermostat': 'smart home devices',
    'dehumidification': 'hvac'
  };

  // Convert to lowercase for case-insensitive matching
  const lowercaseType = type.toLowerCase();
  
  // Find the first match (some types might be substrings of others)
  for (const [key, value] of Object.entries(typeToCategory)) {
    if (lowercaseType.includes(key)) {
      return value;
    }
  }
  
  // Default to general category if no match
  return 'general';
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

    // Default mock product for testing if no products are available
    const mockProduct: Product = {
      id: 'mock-product-1',
      name: 'Energy Efficient LED Light Bulb Pack',
      category: 'lighting',
      price: 29.99,
      energyEfficiency: 'High',
      features: ['Energy Star certified', '10-year lifespan', 'Dimmable'],
      description: 'Pack of 10 energy-efficient LED bulbs that use 85% less energy than traditional bulbs.',
      annualSavings: 55,
      roi: 183,
      paybackPeriod: 0.5
    };
    const mockProduct2: Product = {
      id: 'mock-product-2',
      name: 'Smart Thermostat',
      category: 'hvac',
      price: 199.99,
      energyEfficiency: 'Very High',
      features: ['Wi-Fi enabled', 'Learning algorithms', 'Energy usage reports'],
      description: 'Smart thermostat that learns your habits and adjusts temperatures automatically to save energy.',
      annualSavings: 180,
      roi: 90,
      paybackPeriod: 1.1
    };
    
    // Use the enhanced fetching method first
    let productCatalog = await fetchEnhancedProductCatalog();
    console.log(`Enhanced product catalog has ${productCatalog.length} items`);
    
    // Fallback to the original method if that returned nothing
    if (productCatalog.length === 0) {
      console.log('Enhanced catalog empty, trying original method...');
      productCatalog = await fetchProductCatalog();
      console.log(`Original product catalog has ${productCatalog.length} items`);
    }
    
    // If product catalog is still empty, use mock products for testing
    if (productCatalog.length === 0) {
      console.log('Using mock products since catalog is empty');
      productCatalog = [mockProduct, mockProduct2];
    }
    
    // Create matches for each recommendation
    const matches: ProductRecommendationMatch[] = [];
    
    for (const recommendation of recommendations) {
      console.log(`Processing recommendation: ${recommendation.title} (type: ${recommendation.type})`);
      
      // Map recommendation type to product category
      const recommendationCategory = mapRecommendationTypeToCategory(recommendation.type);
      console.log(`Mapped recommendation type to category: ${recommendationCategory}`);
      
      // Skip recommendations that don't match user preferences if preferences are provided
      if (userCategoryPreferences.length > 0 && 
          !userCategoryPreferences.some(pref => pref.toLowerCase() === recommendationCategory.toLowerCase())) {
        console.log(`Skipping recommendation as it doesn't match user preferences`);
        continue;
      }
      
      // Find matching products for this recommendation
      const matchingProducts = productCatalog.filter(product => {
        // Match by category
        const categoryMatch = product.category.toLowerCase() === recommendationCategory.toLowerCase();
        
        // Check budget constraint if provided
        const withinBudget = budgetConstraint <= 0 || product.price <= budgetConstraint;
        
        return categoryMatch && withinBudget;
      });
      
      console.log(`Found ${matchingProducts.length} matching products for recommendation ${recommendation.title}`);
      
      // Sort by best value (highest ROI)
      const sortedProducts = matchingProducts.sort((a, b) => b.roi - a.roi);
      
      // Take top matches (limit to 3)
      const topMatches = sortedProducts.slice(0, 3);
      console.log(`Selected top ${topMatches.length} product matches`);
      
      matches.push({
        recommendationId: recommendation.id,
        products: topMatches
      });
    }
    
    console.log(`Returning ${matches.length} product recommendation matches`);
    return matches;
  } catch (error) {
    console.error('Error matching products to recommendations:', error);
    return [];
  }
};

/**
 * Filters recommendations by user's category preferences
 * @param recommendations The recommendations to filter
 * @param userCategoryPreferences User's preferred product categories
 * @returns Filtered recommendations
 */
export const filterRecommendationsByUserPreferences = (
  recommendations: AuditRecommendation[],
  userCategoryPreferences: string[] = []
): AuditRecommendation[] => {
  // If no preferences are provided, return all recommendations
  if (!userCategoryPreferences.length) {
    return recommendations;
  }
  
  // Filter recommendations by category match
  return recommendations.filter(recommendation => {
    const category = mapRecommendationTypeToCategory(recommendation.type);
    return userCategoryPreferences.some(pref => pref.toLowerCase() === category.toLowerCase());
  });
};
