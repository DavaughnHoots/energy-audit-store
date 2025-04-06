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
    'hvac': ['Heating & Cooling', 'HVAC Systems', 'Furnaces', 'Air Conditioners', 'Heat Pumps', 'Thermostats', 'hvac'],
    'heating': ['Heating & Cooling', 'HVAC Systems', 'Furnaces', 'Heat Pumps', 'heating'],
    'cooling': ['Heating & Cooling', 'HVAC Systems', 'Air Conditioners', 'cooling'],
    // Lighting
    'lighting': ['Lighting & Fans', 'Light Bulbs', 'Light Fixtures', 'Ceiling Fans', 'lighting'],
    // Insulation
    'insulation': ['Building Products', 'Insulation', 'insulation'],
    // Windows & Doors
    'windows': ['Building Products', 'Windows', 'windows'],
    'doors': ['Building Products', 'Doors', 'doors'],
    'windows_doors': ['Building Products', 'Windows', 'Doors', 'windows', 'doors'],
    'windows-doors': ['Building Products', 'Windows', 'Doors', 'windows', 'doors'],
    // Appliances
    'appliances': ['Appliances', 'appliances'],
    'energy-efficient_appliances': ['Appliances', 'appliances'],
    'energy-efficient-appliances': ['Appliances', 'appliances'],
    'energy_efficient_appliances': ['Appliances', 'appliances'],
    // Water Heating - this was in the filtered logs as a key issue
    'water_heating': ['Water Heaters', 'water_heating', 'water-heating', 'water heating'],
    'water-heating': ['Water Heaters', 'water_heating', 'water-heating', 'water heating'],
    // Smart Home - this was in the filtered logs as a key issue
    'smart_home': ['Electronics', 'Smart Home', 'smart_home', 'smart-home', 'smart_home_devices', 'smart-home-devices'],
    'smart-home': ['Electronics', 'Smart Home', 'smart_home', 'smart-home', 'smart_home_devices', 'smart-home-devices'],
    'smart_home_devices': ['Electronics', 'Smart Home', 'smart_home', 'smart-home', 'smart_home_devices', 'smart-home-devices'],
    'smart-home-devices': ['Electronics', 'Smart Home', 'smart_home', 'smart-home', 'smart_home_devices', 'smart-home-devices'],
    // Renewable Energy - this was in the filtered logs as a key issue
    'renewable': ['Electronics', 'Renewable Energy', 'Solar', 'renewable', 'renewable_energy', 'renewable-energy'],
    'renewable_energy': ['Electronics', 'Renewable Energy', 'Solar', 'renewable', 'renewable_energy', 'renewable-energy'],
    'renewable-energy': ['Electronics', 'Renewable Energy', 'Solar', 'renewable', 'renewable_energy', 'renewable-energy'],
    'solar': ['Electronics', 'Solar', 'renewable', 'solar']
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
    
    // Special case direct matches for problematic categories - MOST IMPORTANT FIX
    // These are the exact combinations that are failing in the logs
    if ((preference === 'renewable' && 
         (category === 'renewable' || category === 'renewable_energy' || category === 'renewable-energy')) ||
        (preference === 'smart_home' && 
         (category === 'smart_home' || category === 'smart-home' || category === 'smart_home_devices')) ||
        (preference === 'water_heating' && 
         (category === 'water_heating' || category === 'water-heating'))) {
      console.log(`DIRECT TYPE MATCH found for '${preference}' and '${category}'`);
      return true;
    }
    
    // Direct match (case-insensitive)
    if (preference.toLowerCase() === category.toLowerCase()) {
      console.log(`Direct match found for '${preference}' and '${category}'`);
      return true;
    }
    
    // Check if category contains the preference (e.g., "HVAC Systems" contains "hvac")
    if (category.toLowerCase().includes(preference.toLowerCase()) || 
        preference.toLowerCase().includes(category.toLowerCase())) {
      console.log(`Substring match found between '${preference}' and '${category}'`);
      return true;
    }
    
    // Check if preference is a known key with mapped categories
    const mappedCategories = userPreferenceToCategory[preference.toLowerCase()];
    if (mappedCategories) {
      // First check exact matches
      const exactMatch = mappedCategories.some(mappedCat => 
        mappedCat.toLowerCase() === category.toLowerCase()
      );
      
      if (exactMatch) {
        console.log(`Mapped exact match found for preference '${preference}' in category '${category}'`);
        return true;
      }
      
      // Then check substring matches
      const substringMatch = mappedCategories.some(mappedCat => 
        category.toLowerCase().includes(mappedCat.toLowerCase()) ||
        mappedCat.toLowerCase().includes(category.toLowerCase())
      );
      
      if (substringMatch) {
        console.log(`Mapped substring match found for preference '${preference}' in category '${category}'`);
        return true;
      }
    }
    
    // Handle special case for underscores vs dashes
    const normalizedPreference = preference.toLowerCase().replace(/_/g, '-');
    if (normalizedPreference !== preference.toLowerCase()) {
      const mappedCategories = userPreferenceToCategory[normalizedPreference];
      if (mappedCategories) {
        const hasMatch = mappedCategories.some(mappedCat => 
          mappedCat.toLowerCase() === category.toLowerCase() ||
          category.toLowerCase().includes(mappedCat.toLowerCase()) ||
          mappedCat.toLowerCase().includes(category.toLowerCase())
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
          mappedCat.toLowerCase() === category.toLowerCase() ||
          category.toLowerCase().includes(mappedCat.toLowerCase()) ||
          mappedCat.toLowerCase().includes(category.toLowerCase())
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
  
  console.log('========= RECOMMENDATION FILTERING PROCESS START ===========');
  console.log('Filtering recommendations with user preferences:', userCategoryPreferences);
  console.log('Total recommendations to filter:', recommendations.length);
  
  // Log the exact recommendation types to help debug the issue
  recommendations.forEach(rec => {
    console.log(`Recommendation ID: ${rec.id}, Title: ${rec.title}, Type: ${rec.type}`);
  });
  
  // IMPORTANT FIX: Check for direct type matches first based on the logs we've seen
  // This is a special case to handle the problematic categories
  const directTypeMatches = recommendations.filter(recommendation => {
    return userCategoryPreferences.some(pref => {
      // Check direct type match with exact types from logs
      // These are the specific problematic combinations
      if ((pref === 'renewable' && recommendation.type === 'renewable') ||
          (pref === 'smart_home' && recommendation.type === 'smart_home') ||
          (pref === 'water_heating' && recommendation.type === 'water_heating')) {
        console.log(`DIRECT MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      // Check for water heating with underscore/dash variations
      if ((pref === 'water_heating' || pref === 'water-heating') && 
          (recommendation.type === 'water_heating' || recommendation.type === 'water-heating')) {
        console.log(`WATER HEATING MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      // Check for smart home with underscore/dash variations
      if ((pref.includes('smart_home') || pref.includes('smart-home')) && 
          (recommendation.type.includes('smart_home') || recommendation.type.includes('smart-home'))) {
        console.log(`SMART HOME MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      // Check for renewable energy with underscore/dash variations
      if ((pref.includes('renewable') || pref === 'solar') && 
          (recommendation.type.includes('renewable') || recommendation.type === 'solar')) {
        console.log(`RENEWABLE MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      return false;
    });
  });
  
  // If we have direct matches, return them
  if (directTypeMatches.length > 0) {
    console.log(`Found ${directTypeMatches.length} direct type matches`);
    console.log(directTypeMatches.map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
    return directTypeMatches;
  }
  
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
    
    console.log(`Standard matching result for ${recommendation.title}: ${match ? 'MATCH' : 'NO MATCH'}`);
    return match;
  });
  
  // If we have exact matches, return them
  if (exactMatches.length > 0) {
    console.log(`Found ${exactMatches.length} exact preference matches`);
    console.log(exactMatches.map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
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
      
      console.log(`Checking flexible match for preference: ${pref}, keywords: ${keywords.join(', ')}`);
      
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
      
      // Log the match details
      if (titleMatch) console.log(`Title flexible match: ${recommendation.title} contains ${keywords.filter(k => recommendation.title.toLowerCase().includes(k)).join(', ')}`);
      if (typeMatch) console.log(`Type flexible match: ${recommendation.type} contains ${keywords.filter(k => recommendation.type.toLowerCase().includes(k)).join(', ')}`);
      if (categoryMatch) console.log(`Category flexible match: ${categoryMapping.mainCategory}/${categoryMapping.subCategory} contains ${keywords.filter(k => categoryMapping.mainCategory.toLowerCase().includes(k) || categoryMapping.subCategory.toLowerCase().includes(k)).join(', ')}`);
      
      return titleMatch || typeMatch || categoryMatch;
    });
  });
  
  // If we have flexible matches, return them
  if (flexibleMatches.length > 0) {
    console.log(`Found ${flexibleMatches.length} flexible matches`);
    console.log(flexibleMatches.map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
    return flexibleMatches;
  }
  
  // LAST RESORT: Hard-coded fallback for specific categories
  // This ensures that we always show recommendations for the specific categories in the browser logs
  console.log("Checking for fallback categories...");
  // If user has renewable preference and we have any recommendations with solar or renewable type
  if (userCategoryPreferences.includes('renewable')) {
    const renewableRecs = recommendations.filter(rec => 
      rec.type.includes('solar') || 
      rec.type.includes('renewable')
    );
    if (renewableRecs.length > 0) {
      console.log("Found fallback renewable recommendations");
      console.log(renewableRecs.map(rec => rec.title));
      console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
      return renewableRecs;
    }
  }
  
  // If user has smart_home preference and we have any recommendations with smart in the title or type
  if (userCategoryPreferences.includes('smart_home')) {
    const smartHomeRecs = recommendations.filter(rec => 
      rec.title.toLowerCase().includes('smart') || 
      rec.type.includes('smart')
    );
    if (smartHomeRecs.length > 0) {
      console.log("Found fallback smart home recommendations");
      console.log(smartHomeRecs.map(rec => rec.title));
      console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
      return smartHomeRecs;
    }
  }
  
  // If user has water_heating preference and we have any recommendations with water or heating in the title or type
  if (userCategoryPreferences.includes('water_heating')) {
    const waterHeatingRecs = recommendations.filter(rec => 
      rec.title.toLowerCase().includes('water') || 
      rec.type.includes('water')
    );
    if (waterHeatingRecs.length > 0) {
      console.log("Found fallback water heating recommendations");
      console.log(waterHeatingRecs.map(rec => rec.title));
      console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
      return waterHeatingRecs;
    }
  }
  
  // If still no matches, return first 2 recommendations from the original list as final fallback
  if (recommendations.length > 0) {
    console.log("No matching recommendations found at all, returning first 2 recommendations as fallback");
    console.log(recommendations.slice(0, 2).map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
    return recommendations.slice(0, 2);
  }
  
  // If all else fails, return an empty array
  console.log("No recommendations found at all");
  console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
  return [];
};
