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

  /**
   * Gets default products for a specific category when no matching products are found
   * @param mainCategory The main product category
   * @param subCategory The product subcategory
   * @param type The recommendation type
   * @returns Array of default products for the category
   */
  const getDefaultProductsForCategory = (mainCategory: string, subCategory: string, type: string): Product[] => {
    // HVAC defaults
    if (mainCategory === 'Heating & Cooling') {
      if (subCategory === 'HVAC Systems') {
        return [
          {
            id: 'default-hvac-system-1',
            name: 'Energy Star Heat Pump System',
            category: 'HVAC Systems',
            price: 3200.00,
            energyEfficiency: 'Very High',
            features: ['SEER 18', 'Smart thermostat compatible', '10-year warranty'],
            description: 'High-efficiency heat pump system that can save up to 20% on heating and cooling costs.',
            annualSavings: 450,
            roi: 14,
            paybackPeriod: 7.1
          },
          {
            id: 'default-hvac-system-2',
            name: 'Advanced HVAC with Zone Control',
            category: 'HVAC Systems',
            price: 4500.00,
            energyEfficiency: 'Very High',
            features: ['Multi-zone control', 'Smart home integration', 'Energy monitoring'],
            description: 'Premium HVAC system with zoning capabilities for maximum comfort and efficiency.',
            annualSavings: 590,
            roi: 13,
            paybackPeriod: 7.6
          }
        ];
      } else if (subCategory === 'Thermostats') {
        return [
          {
            id: 'default-thermostat-1',
            name: 'Smart Learning Thermostat',
            category: 'Thermostats',
            price: 249.99,
            energyEfficiency: 'Very High',
            features: ['Learning algorithm', 'Remote control via app', 'Energy usage reports'],
            description: 'Smart thermostat that learns your habits and adjusts temperatures automatically to save energy.',
            annualSavings: 180,
            roi: 72,
            paybackPeriod: 1.4
          },
          {
            id: 'default-thermostat-2',
            name: 'Basic Programmable Thermostat',
            category: 'Thermostats',
            price: 79.99,
            energyEfficiency: 'High',
            features: ['7-day programming', 'Battery backup', 'Energy usage tracking'],
            description: 'Affordable programmable thermostat that lets you set temperature schedules to save energy.',
            annualSavings: 120,
            roi: 150,
            paybackPeriod: 0.7
          }
        ];
      }
    }
    
    // Lighting defaults
    if (mainCategory === 'Lighting & Fans') {
      if (subCategory === 'Light Bulbs') {
        return [
          {
            id: 'default-light-bulb-1',
            name: 'Energy Efficient LED Light Bulb Pack',
            category: 'Light Bulbs',
            price: 29.99,
            energyEfficiency: 'High',
            features: ['Energy Star certified', '10-year lifespan', 'Dimmable'],
            description: 'Pack of 10 energy-efficient LED bulbs that use 85% less energy than traditional bulbs.',
            annualSavings: 55,
            roi: 183,
            paybackPeriod: 0.5
          },
          {
            id: 'default-light-bulb-2',
            name: 'Smart LED Bulbs (4-pack)',
            category: 'Light Bulbs',
            price: 49.99,
            energyEfficiency: 'High',
            features: ['App controlled', 'Color changing', 'Voice assistant compatible'],
            description: 'Smart LED bulbs that can be controlled via phone app or voice commands.',
            annualSavings: 45,
            roi: 90,
            paybackPeriod: 1.1
          }
        ];
      } else if (subCategory === 'Light Fixtures') {
        return [
          {
            id: 'default-fixture-1',
            name: 'Energy Efficient Ceiling Fixtures (2-pack)',
            category: 'Light Fixtures',
            price: 129.99,
            energyEfficiency: 'High',
            features: ['Energy Star certified', 'Modern design', 'LED compatible'],
            description: 'Energy efficient ceiling fixtures that work with LED bulbs for maximum efficiency.',
            annualSavings: 75,
            roi: 58,
            paybackPeriod: 1.7
          },
          {
            id: 'default-fixture-2',
            name: 'Motion-Sensing Outdoor Fixture',
            category: 'Light Fixtures',
            price: 89.99,
            energyEfficiency: 'High',
            features: ['Motion detection', 'Weatherproof', 'Adjustable settings'],
            description: 'Outdoor light fixture with built-in motion sensor for security and efficiency.',
            annualSavings: 50,
            roi: 55,
            paybackPeriod: 1.8
          }
        ];
      } else if (subCategory === 'Ceiling Fans') {
        return [
          {
            id: 'default-fan-1',
            name: 'Energy Star Ceiling Fan with Light',
            category: 'Ceiling Fans',
            price: 179.99,
            energyEfficiency: 'High',
            features: ['Energy Star certified', 'Reversible motor', 'LED light kit'],
            description: 'Energy efficient ceiling fan with integrated lighting that helps reduce both heating and cooling costs.',
            annualSavings: 90,
            roi: 50,
            paybackPeriod: 2.0
          }
        ];
      }
    }
    
    // Insulation defaults
    if (mainCategory === 'Building Products' && subCategory === 'Insulation') {
      return [
        {
          id: 'default-insulation-1',
          name: 'Attic Insulation Kit',
          category: 'Insulation',
          price: 350.00,
          energyEfficiency: 'Very High',
          features: ['R-30 value', 'Covers 500 sq ft', 'DIY installation guide'],
          description: 'Complete kit for adding energy-saving insulation to your attic space.',
          annualSavings: 200,
          roi: 57,
          paybackPeriod: 1.75
        },
        {
          id: 'default-insulation-2',
          name: 'Wall Insulation Upgrade',
          category: 'Insulation',
          price: 1200.00,
          energyEfficiency: 'Very High',
          features: ['Professional installation', 'Blown-in cellulose', 'Soundproofing benefits'],
          description: 'Professional-grade wall insulation upgrade to reduce energy loss through walls.',
          annualSavings: 350,
          roi: 29,
          paybackPeriod: 3.4
        }
      ];
    }
    
    // Windows defaults
    if (mainCategory === 'Building Products' && subCategory === 'Windows') {
      return [
        {
          id: 'default-window-1',
          name: 'Energy Efficient Double-Pane Windows',
          category: 'Windows',
          price: 400.00,
          energyEfficiency: 'High',
          features: ['Double-pane glass', 'Low-E coating', 'Weather stripping'],
          description: 'Energy efficient replacement windows that reduce heat transfer and drafts.',
          annualSavings: 120,
          roi: 30,
          paybackPeriod: 3.3
        }
      ];
    }
    
    // Appliances defaults
    if (mainCategory === 'Appliances') {
      return [
        {
          id: 'default-appliance-1',
          name: 'Energy Star Refrigerator',
          category: 'Appliances',
          price: 1099.99,
          energyEfficiency: 'Very High',
          features: ['Energy Star certified', 'LED lighting', 'Smart cooling technology'],
          description: 'Energy efficient refrigerator that uses up to 40% less energy than standard models.',
          annualSavings: 80,
          roi: 7.3,
          paybackPeriod: 13.7
        },
        {
          id: 'default-appliance-2',
          name: 'High-Efficiency Washer/Dryer Combo',
          category: 'Appliances',
          price: 1399.99,
          energyEfficiency: 'Very High',
          features: ['Energy Star certified', 'Water-saving technology', 'Heat pump drying'],
          description: 'Combined washer/dryer unit that saves both energy and water.',
          annualSavings: 120,
          roi: 8.6,
          paybackPeriod: 11.7
        }
      ];
    }
    
    // Water heater defaults
    if (mainCategory === 'Water Heaters') {
      return [
        {
          id: 'default-water-heater-1',
          name: 'Tankless Water Heater',
          category: 'Water Heaters',
          price: 900.00,
          energyEfficiency: 'Very High',
          features: ['On-demand heating', 'Space-saving design', '20-year lifespan'],
          description: 'Tankless water heater that heats water only when needed, reducing standby energy loss.',
          annualSavings: 110,
          roi: 12.2,
          paybackPeriod: 8.2
        },
        {
          id: 'default-water-heater-2',
          name: 'Heat Pump Water Heater',
          category: 'Water Heaters',
          price: 1300.00,
          energyEfficiency: 'Very High',
          features: ['70% less energy use', 'Smart controls', '10-year warranty'],
          description: 'Advanced water heater that uses heat pump technology to significantly reduce energy use.',
          annualSavings: 270,
          roi: 20.8,
          paybackPeriod: 4.8
        }
      ];
    }
    
    // Dehumidification defaults
    if (type.includes('humidity') || type.includes('dehumid')) {
      return [
        {
          id: 'default-dehumid-1',
          name: 'Energy Efficient Dehumidifier',
          category: 'Dehumidifiers',
          price: 249.99,
          energyEfficiency: 'High',
          features: ['Energy Star certified', 'Auto-shutoff', 'Digital humidity control'],
          description: 'Energy efficient dehumidifier that removes excess moisture while using minimal electricity.',
          annualSavings: 45,
          roi: 18,
          paybackPeriod: 5.6
        }
      ];
    }
    
    // Generic fallback for any other category
    return [
      {
        id: `default-${type}-1`,
        name: `Energy Efficient ${type.charAt(0).toUpperCase() + type.slice(1)} Solution`,
        category: mainCategory,
        price: 199.99,
        energyEfficiency: 'High',
        features: ['Energy Star certified', 'Easy installation', 'Long lifetime'],
        description: `Default energy-efficient solution for ${type} that can significantly reduce energy usage.`,
        annualSavings: 80,
        roi: 40,
        paybackPeriod: 2.5
      }
    ];
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
    
    // If product catalog is still empty, create default products
    if (productCatalog.length === 0) {
      console.log('Using default products since catalog is empty');
      // Create a varied set of default products across categories
      productCatalog = [
        ...getDefaultProductsForCategory('Lighting & Fans', 'Light Bulbs', 'lighting'),
        ...getDefaultProductsForCategory('Lighting & Fans', 'Light Fixtures', 'lighting'),
        ...getDefaultProductsForCategory('Heating & Cooling', 'HVAC Systems', 'hvac'),
        ...getDefaultProductsForCategory('Heating & Cooling', 'Thermostats', 'hvac'),
        ...getDefaultProductsForCategory('Building Products', 'Insulation', 'insulation'),
        ...getDefaultProductsForCategory('Water Heaters', '', 'water-heating')
      ];
      console.log(`Created ${productCatalog.length} default products`);
    }
    
    // Create matches for each recommendation
    const matches: ProductRecommendationMatch[] = [];
    
    for (const recommendation of recommendations) {
      console.log(`Processing recommendation: ${recommendation.title} (type: ${recommendation.type})`);
      
      // Map recommendation type and title to product category
      const recommendationCategory = mapRecommendationTypeToCategory(recommendation.type, recommendation.title);
      console.log(`Mapped recommendation type and title to category: ${JSON.stringify(recommendationCategory)}`);
      
      // Skip recommendations that don't match user preferences if preferences are provided
      if (userCategoryPreferences.length > 0) {
        const matchesUserPreference = userCategoryPreferences.some(pref => 
          isPreferenceMatchingCategory(pref, recommendationCategory.mainCategory) || 
          isPreferenceMatchingCategory(pref, recommendationCategory.subCategory) ||
          pref.toLowerCase() === recommendation.type.toLowerCase()
        );
        
        if (!matchesUserPreference) {
          console.log(`Skipping recommendation as it doesn't match user preferences`);
          continue;
        }
      }
      
      // Find matching products for this recommendation
      let matchingProducts = productCatalog.filter(product => {
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
        matchingProducts = getDefaultProductsForCategory(
          recommendationCategory.mainCategory, 
          recommendationCategory.subCategory,
          recommendation.type
        );
        console.log(`Added ${matchingProducts.length} default products for this recommendation`);
      }
      
      // Sort by best value (highest ROI)
      const sortedProducts = matchingProducts.sort((a, b) => b.roi - a.roi);
      
      // Take top matches (limit to 3)
      const topMatches = sortedProducts.slice(0, 3);
      console.log(`Selected top ${topMatches.length} product matches`);
      
      // Calculate financial data for the recommendation based on matched products
      if (topMatches.length > 0) {
        // Update recommendation financial data with products' average values
        const avgSavings = Math.round(topMatches.reduce((sum, p) => sum + p.annualSavings, 0) / topMatches.length);
        const avgCost = Math.round(topMatches.reduce((sum, p) => sum + p.price, 0) / topMatches.length);
        const avgPayback = +(topMatches.reduce((sum, p) => sum + p.paybackPeriod, 0) / topMatches.length).toFixed(1);
        
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
          estimatedSavings: Math.round(topMatches.reduce((sum, p) => sum + p.annualSavings, 0) / topMatches.length),
          implementationCost: Math.round(topMatches.reduce((sum, p) => sum + p.price, 0) / topMatches.length),
          paybackPeriod: +(topMatches.reduce((sum, p) => sum + p.paybackPeriod, 0) / topMatches.length).toFixed(1)
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

/**
 * Maps user preference strings to category names
 * This helps bridge the gap between UI preference strings and internal category names
 */
const userPreferenceToCategory: Record<string, string[]> = {
  // HVAC Systems
  'hvac': ['Heating & Cooling', 'HVAC Systems', 'Furnaces', 'Air Conditioners', 'Heat Pumps', 'Thermostats'],
  'heating': ['Heating & Cooling', 'HVAC Systems', 'Furnaces', 'Heat Pumps'],
  'cooling': ['Heating & Cooling', 'HVAC Systems', 'Air Conditioners'],
  // Lighting
  'lighting': ['Lighting & Fans', 'Light Bulbs', 'Light Fixtures', 'Ceiling Fans'],
  // Insulation
  'insulation': ['Building Products', 'Insulation'],
  // Windows & Doors
  'windows': ['Building Products', 'Windows'],
  'doors': ['Building Products', 'Doors'],
  'windows_doors': ['Building Products', 'Windows', 'Doors'],
  'windows-doors': ['Building Products', 'Windows', 'Doors'],
  // Appliances
  'appliances': ['Appliances'],
  'energy-efficient_appliances': ['Appliances'],
  'energy-efficient-appliances': ['Appliances'],
  'energy_efficient_appliances': ['Appliances'],
  // Water Heating - this was in the filtered logs as a key issue
  'water_heating': ['Water Heaters'],
  'water-heating': ['Water Heaters'],
  // Smart Home - this was in the filtered logs as a key issue
  'smart_home': ['Electronics', 'Smart Home'],
  'smart-home': ['Electronics', 'Smart Home'],
  'smart_home_devices': ['Electronics', 'Smart Home'],
  'smart-home-devices': ['Electronics', 'Smart Home'],
  // Renewable Energy - this was in the filtered logs as a key issue
  'renewable': ['Electronics', 'Renewable Energy', 'Solar'],
  'renewable_energy': ['Electronics', 'Renewable Energy', 'Solar'],
  'renewable-energy': ['Electronics', 'Renewable Energy', 'Solar'],
  'solar': ['Electronics', 'Solar']
};

/**
 * Checks if a user preference matches a category
 * @param preference User preference string
 * @param category Category name to match against
 * @returns Whether there's a match
 */
const isPreferenceMatchingCategory = (preference: string, category: string): boolean => {
  // Log for debugging purposes
  console.log(`Checking if preference '${preference}' matches category '${category}'`);
  
  // Direct match (case-insensitive)
  if (preference.toLowerCase() === category.toLowerCase()) {
    console.log(`Direct match found for '${preference}' and '${category}'`);
    return true;
  }
  
  // Check if category contains the preference (e.g., "HVAC Systems" contains "hvac")
  if (category.toLowerCase().includes(preference.toLowerCase())) {
    console.log(`Substring match found: '${category}' contains '${preference}'`);
    return true;
  }
  
  // Check if preference is a known key with mapped categories
  const mappedCategories = userPreferenceToCategory[preference.toLowerCase()];
  if (mappedCategories) {
    const hasMatch = mappedCategories.some(mappedCat => 
      mappedCat.toLowerCase() === category.toLowerCase()
    );
    if (hasMatch) {
      console.log(`Mapped match found for preference '${preference}' in mapped categories`);
      return true;
    }
  }
  
  // Handle special case for underscores vs dashes
  const normalizedPreference = preference.toLowerCase().replace(/_/g, '-');
  if (normalizedPreference !== preference.toLowerCase()) {
    const mappedCategories = userPreferenceToCategory[normalizedPreference];
    if (mappedCategories) {
      const hasMatch = mappedCategories.some(mappedCat => 
        mappedCat.toLowerCase() === category.toLowerCase()
      );
      if (hasMatch) {
        console.log(`Normalized match found for '${preference}' using '${normalizedPreference}'`);
        return true;
      }
    }
  }
  
  // Handle special case for dashes vs underscores (inverse of above)
  const dashedPreference = preference.toLowerCase().replace(/-/g, '_');
  if (dashedPreference !== preference.toLowerCase()) {
    const mappedCategories = userPreferenceToCategory[dashedPreference];
    if (mappedCategories) {
      const hasMatch = mappedCategories.some(mappedCat => 
        mappedCat.toLowerCase() === category.toLowerCase()
      );
      if (hasMatch) {
        console.log(`Dashed match found for '${preference}' using '${dashedPreference}'`);
        return true;
      }
    }
  }
  
  // Try to match by word or phrase (e.g., "renewable" with "Renewable Energy")
  if (category.toLowerCase().split(/\s+/).includes(preference.toLowerCase()) ||
      preference.toLowerCase().split(/\s+/).some(word => category.toLowerCase().includes(word))) {
    console.log(`Word match found between '${preference}' and '${category}'`);
    return true;
  }
  
  console.log(`No match found between '${preference}' and '${category}'`);
  return false;
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
  
  console.log('Filtering recommendations with user preferences:', userCategoryPreferences);
  
  // First try to get exact matches
  const exactMatches = recommendations.filter(recommendation => {
    const categoryMapping = mapRecommendationTypeToCategory(recommendation.type, recommendation.title);
    console.log(`Checking recommendation ${recommendation.title} with categories:`, categoryMapping);
    
    // Check if any user preference matches either the main category or subcategory
    const match = userCategoryPreferences.some(pref => 
      isPreferenceMatchingCategory(pref, categoryMapping.mainCategory) || 
      isPreferenceMatchingCategory(pref, categoryMapping.subCategory) ||
      // Also check if preference matches the recommendation type directly
      isPreferenceMatchingCategory(pref, recommendation.type)
    );
    
    console.log(`Result for ${recommendation.title}: ${match ? 'MATCH' : 'NO MATCH'}`);
    return match;
  });
  
  // If we have exact matches, return them
  if (exactMatches.length > 0) {
    console.log(`Found ${exactMatches.length} exact preference matches`);
    return exactMatches;
  }
  
  // If no exact matches, try a more flexible matching (partial matches)
  console.log("No exact matches found, using flexible matching");
  const flexibleMatches = recommendations.filter(recommendation => {
    const categoryMapping = mapRecommendationTypeToCategory(recommendation.type, recommendation.title);
    
    // More flexible matching for category keywords
    return userCategoryPreferences.some(pref => {
      // Convert preference to keywords
      const keywords = pref.toLowerCase()
        .replace(/[_-]/g, ' ')
        .split(' ')
        .filter(k => k.length > 2); // Only use keywords with more than 2 chars
      
      // Check if any keyword matches in the recommendation title or type
      const titleMatch = keywords.some(keyword => 
        recommendation.title.toLowerCase().includes(keyword)
      );
      
      const typeMatch = keywords.some(keyword => 
        recommendation.type.toLowerCase().includes(keyword)
      );
      
      const categoryMatch = keywords.some(keyword => 
        categoryMapping.mainCategory.toLowerCase().includes(keyword) || 
        categoryMapping.subCategory.toLowerCase().includes(keyword)
      );
      
      return titleMatch || typeMatch || categoryMatch;
    });
  });
  
  // If we have flexible matches, return them
  if (flexibleMatches.length > 0) {
    console.log(`Found ${flexibleMatches.length} flexible matches`);
    return flexibleMatches;
  }
  
  // If still no matches, and we should show at least some recommendations,
  // return first 2 recommendations from the original list as fallback
  if (recommendations.length > 0) {
    console.log("No flexible matches found either, returning first 2 recommendations as fallback");
    return recommendations.slice(0, 2);
  }
  
  // If all else fails, return an empty array
  console.log("No recommendations found at all");
  return [];
};
