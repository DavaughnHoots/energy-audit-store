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
 * Maps recommendation types to product categories and subcategories
 * @param type The recommendation type
 * @param title The recommendation title (optional)
 * @returns The corresponding product main category and subcategory
 */
export interface CategoryMapping {
  mainCategory: string;
  subCategory: string;
}

export const mapRecommendationTypeToCategory = (type: string, title?: string): CategoryMapping => {
  // Basic category mapping
  const typeToMainCategory: Record<string, string> = {
    'hvac': 'Heating & Cooling',
    'heating': 'Heating & Cooling',
    'cooling': 'Heating & Cooling',
    'insulation': 'Building Products',
    'windows': 'Building Products',
    'doors': 'Building Products',
    'lighting': 'Lighting & Fans',
    'appliances': 'Appliances',
    'water-heating': 'Water Heaters',
    'smart-home': 'Electronics',
    'renewable': 'Electronics',
    'solar': 'Electronics',
    'weatherization': 'Building Products',
    'thermostat': 'Heating & Cooling',
    'dehumidification': 'Heating & Cooling'
  };

  // Subcategory mappings
  const typeToSubCategory: Record<string, Record<string, string>> = {
    'lighting': {
      'fixture': 'Light Fixtures',
      'bulb': 'Light Bulbs',
      'led': 'Light Bulbs',
      'lamp': 'Light Fixtures',
      'ceiling': 'Ceiling Fans',
      'default': 'Light Bulbs'
    },
    'hvac': {
      'furnace': 'Furnaces',
      'air conditioner': 'Air Conditioners',
      'heat pump': 'Heat Pumps',
      'thermostat': 'Thermostats',
      'default': 'HVAC Systems'
    },
    'insulation': {
      'default': 'Insulation'
    },
    'windows': {
      'default': 'Windows'
    },
    'doors': {
      'default': 'Doors'
    }
  };

  // Convert to lowercase for case-insensitive matching
  const lowercaseType = type.toLowerCase();
  const lowercaseTitle = title ? title.toLowerCase() : '';
  
  // Find main category
  let mainCategory = 'General';
  for (const [key, value] of Object.entries(typeToMainCategory)) {
    if (lowercaseType.includes(key)) {
      mainCategory = value;
      break;
    }
  }
  
  // Find subcategory based on title and type
  let subCategory = '';
  
  // Special case for differentiating fixtures vs bulbs using the title
  if (lowercaseType.includes('lighting')) {
    const subCategoryMap = typeToSubCategory['lighting'] || { default: 'Light Bulbs' };
    
    // Check title for keywords if available
    if (lowercaseTitle) {
      // Check for fixture-related keywords in title
      if (lowercaseTitle.includes('fixture') || 
          lowercaseTitle.includes('ceiling') || 
          lowercaseTitle.includes('replace')) {
        subCategory = subCategoryMap['fixture'] || 'Light Fixtures';
      } 
      // Check for bulb-related keywords in title
      else if (lowercaseTitle.includes('bulb') || 
               lowercaseTitle.includes('led') || 
               lowercaseTitle.includes('lamp')) {
        subCategory = subCategoryMap['bulb'] || 'Light Bulbs';
      }
      // Check for fan-related keywords in title
      else if (lowercaseTitle.includes('fan')) {
        subCategory = subCategoryMap['ceiling'] || 'Ceiling Fans';
      }
      // Default for lighting
      else {
        subCategory = subCategoryMap['default'] || 'Light Bulbs';
      }
    } else {
      subCategory = subCategoryMap['default'] || 'Light Bulbs';
    }
  } 
  // For HVAC systems
  else if (lowercaseType.includes('hvac') || 
           lowercaseType.includes('heating') || 
           lowercaseType.includes('cooling')) {
    const subCategoryMap = typeToSubCategory['hvac'] || { default: 'HVAC Systems' };
    
    // Check title for HVAC subtypes if available
    if (lowercaseTitle) {
      if (lowercaseTitle.includes('furnace')) {
        subCategory = subCategoryMap['furnace'] || 'Furnaces';
      }
      else if (lowercaseTitle.includes('air condition')) {
        subCategory = subCategoryMap['air conditioner'] || 'Air Conditioners';
      }
      else if (lowercaseTitle.includes('heat pump')) {
        subCategory = subCategoryMap['heat pump'] || 'Heat Pumps';
      }
      else if (lowercaseTitle.includes('thermostat')) {
        subCategory = subCategoryMap['thermostat'] || 'Thermostats';
      }
      else {
        subCategory = subCategoryMap['default'] || 'HVAC Systems';
      }
    } else {
      subCategory = subCategoryMap['default'] || 'HVAC Systems';
    }
  } 
  // For insulation
  else if (lowercaseType.includes('insulation')) {
    const insulationMap = typeToSubCategory['insulation'] || { default: 'Insulation' };
    subCategory = insulationMap['default'] || 'Insulation';
  }
  // For windows
  else if (lowercaseType.includes('windows')) {
    const windowsMap = typeToSubCategory['windows'] || { default: 'Windows' };
    subCategory = windowsMap['default'] || 'Windows';
  }
  // For doors
  else if (lowercaseType.includes('doors')) {
    const doorsMap = typeToSubCategory['doors'] || { default: 'Doors' };
    subCategory = doorsMap['default'] || 'Doors';
  }
  
  return {
    mainCategory,
    subCategory
  };
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

  // Default mock products for testing if no products are available
  const mockProducts: Product[] = [
    {
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
    },
    {
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
    },
    {
      id: 'mock-product-3',
      name: 'Energy Efficient Light Fixtures',
      category: 'light fixtures',
      price: 120.00,
      energyEfficiency: 'High',
      features: ['Energy Star certified', 'Modern design', 'Easy installation'],
      description: 'Energy efficient ceiling fixtures that work with LED bulbs for maximum efficiency.',
      annualSavings: 40,
      roi: 33,
      paybackPeriod: 3.0
    },
    {
      id: 'mock-product-4',
      name: 'Programmable Light Switch',
      category: 'lighting',
      price: 45.99,
      energyEfficiency: 'Medium',
      features: ['Programmable schedule', 'Motion sensing', 'Compatible with most fixtures'],
      description: 'Smart light switch that automatically turns off lights when not in use.',
      annualSavings: 25,
      roi: 54,
      paybackPeriod: 1.8
    },
    {
      id: 'mock-product-5',
      name: 'Smart LED Light Strip',
      category: 'lighting',
      price: 39.99,
      energyEfficiency: 'High',
      features: ['Color changing', 'Phone controlled', 'Voice assistant compatible'],
      description: 'Flexible LED light strip that uses minimal power while providing customizable lighting.',
      annualSavings: 30,
      roi: 75,
      paybackPeriod: 1.3
    }
  ];
    
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
      productCatalog = mockProducts;
    }
    
    // Create matches for each recommendation
    const matches: ProductRecommendationMatch[] = [];
    
    for (const recommendation of recommendations) {
      console.log(`Processing recommendation: ${recommendation.title} (type: ${recommendation.type})`);
      
      // Map recommendation type and title to product category
      const recommendationCategory = mapRecommendationTypeToCategory(recommendation.type, recommendation.title);
      console.log(`Mapped recommendation type and title to category: ${JSON.stringify(recommendationCategory)}`);
      
      // Skip recommendations that don't match user preferences if preferences are provided
      if (userCategoryPreferences.length > 0 && 
          !userCategoryPreferences.some(pref => 
            pref.toLowerCase() === recommendationCategory.mainCategory.toLowerCase() || 
            pref.toLowerCase() === recommendationCategory.subCategory.toLowerCase()
          )) {
        console.log(`Skipping recommendation as it doesn't match user preferences`);
        continue;
      }
      
      // Find matching products for this recommendation
      const matchingProducts = productCatalog.filter(product => {
        // Match by main category or subcategory
        const categoryMatch = 
          product.category.toLowerCase() === recommendationCategory.mainCategory.toLowerCase() || 
          product.category.toLowerCase() === recommendationCategory.subCategory.toLowerCase();
        
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
    const categoryMapping = mapRecommendationTypeToCategory(recommendation.type, recommendation.title);
    
    // Check if any user preference matches either the main category or subcategory
    return userCategoryPreferences.some(pref => 
      pref.toLowerCase() === categoryMapping.mainCategory.toLowerCase() || 
      pref.toLowerCase() === categoryMapping.subCategory.toLowerCase()
    );
  });
};
