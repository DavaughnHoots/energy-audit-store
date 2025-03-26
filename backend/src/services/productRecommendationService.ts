import { AuditRecommendation } from '../types/energyAudit.js';
import { Product } from '../types/product.js';
import { appLogger } from '../utils/logger.js';

/**
 * Service for retrieving product recommendations based on audit recommendations
 */
export class ProductRecommendationService {
  // Product category mappings to help categorize recommendations
  private readonly categoryMappings: Record<string, string[]> = {
    'hvac': ['hvac', 'heating', 'cooling', 'air conditioning', 'heat pump', 'furnace'],
    'insulation': ['insulation', 'weatherization', 'air sealing', 'weatherstrip'],
    'lighting': ['light', 'lighting', 'bulb', 'led', 'fixture'],
    'windows': ['window', 'glazing', 'skylight'],
    'water_heating': ['water heater', 'hot water', 'tankless'],
    'appliances': ['appliance', 'refrigerator', 'dishwasher', 'washing machine'],
    'thermostat': ['thermostat', 'temperature control', 'smart thermostat'],
    'renewable': ['solar', 'pv', 'renewable', 'wind', 'geothermal']
  };

  // Mock data for product recommendations by category
  private readonly mockProducts: Record<string, Product[]> = {
    'hvac': [
      {
        id: 'hvac-001',
        name: 'EcoComfort Heat Pump',
        manufacturer: 'GreenAir Systems',
        brand: 'EcoComfort',
        model: 'HP-2250-E',
        category: 'HVAC',
        subCategory: 'heat-pump',
        description: 'High-efficiency heat pump with smart temperature control',
        features: [
          'SEER 20+ efficiency rating',
          'Smart home integration',
          'Dual-zone capability',
          'Ultra-quiet operation'
        ],
        specs: {
          capacity: '24,000 BTU',
          coverage: '1,200 sq ft',
          coolingSeer: 20.5,
          heatingHspf: 11,
          voltage: 240
        },
        efficiency: {
          rating: 'Excellent',
          value: 20.5,
          unit: 'SEER'
        },
        price: 3499.99,
        currency: 'USD',
        imageUrl: 'https://example.com/images/heatpump.jpg',
        productUrl: 'https://example.com/products/ecocomfort-hp2250e',
        rebateEligible: true,
        rebateAmount: 450,
        greenCertified: true,
        userRating: 4.8,
        reviewCount: 156
      },
      {
        id: 'hvac-002',
        name: 'ClimateGuard Mini-Split',
        manufacturer: 'ClimateGuard',
        model: 'MS-18K-HESP',
        category: 'HVAC',
        subCategory: 'mini-split',
        description: 'Energy-efficient ductless mini-split system for zoned comfort',
        features: [
          'Ductless installation',
          'Heating and cooling functionality',
          'Inverter technology',
          'Washable air filter'
        ],
        specs: {
          capacity: '18,000 BTU',
          coverage: '850 sq ft',
          coolingSeer: 19,
          heatingHspf: 10,
          voltage: 220
        },
        efficiency: {
          rating: 'Very Good',
          value: 19.0,
          unit: 'SEER'
        },
        price: 1899.99,
        currency: 'USD',
        imageUrl: 'https://example.com/images/minisplit.jpg',
        productUrl: 'https://example.com/products/climateguard-ms18k',
        rebateEligible: true,
        rebateAmount: 250,
        greenCertified: true,
        userRating: 4.6,
        reviewCount: 87
      }
    ],
    'lighting': [
      {
        id: 'light-001',
        name: 'LumiSave LED Smart Bulb 4-Pack',
        manufacturer: 'LumiSave',
        model: 'SB-800L-4PK',
        category: 'Lighting',
        subCategory: 'LED',
        description: 'Smart LED bulbs with adjustable color temperature and brightness',
        features: [
          'Smartphone control',
          'Adjustable from 2700K-5000K',
          '800 lumens at full brightness',
          '15,000 hour lifespan'
        ],
        specs: {
          wattage: 9,
          lumens: 800,
          lifespan: 15000,
          baseType: 'E26',
          colorTemperature: '2700K-5000K'
        },
        efficiency: {
          rating: 'Excellent',
          value: 88.9,
          unit: 'lumens/watt'
        },
        price: 49.99,
        currency: 'USD',
        imageUrl: 'https://example.com/images/smartbulb.jpg',
        productUrl: 'https://example.com/products/lumisave-sb800l',
        rebateEligible: false,
        greenCertified: true,
        userRating: 4.7,
        reviewCount: 312
      },
      {
        id: 'light-002',
        name: 'EcoLumen BR30 Flood Light 6-Pack',
        manufacturer: 'EcoLumen',
        model: 'BR30-65W-6PK',
        category: 'Lighting',
        subCategory: 'LED',
        description: 'Energy-efficient LED flood lights for recessed fixtures',
        features: [
          'Dimmable',
          'Indoor/outdoor rated',
          '65W replacement',
          'Warm white (2700K)'
        ],
        specs: {
          wattage: 9.5,
          lumens: 650,
          lifespan: 25000,
          baseType: 'E26',
          colorTemperature: '2700K'
        },
        efficiency: {
          rating: 'Very Good',
          value: 68.4,
          unit: 'lumens/watt'
        },
        price: 39.99,
        currency: 'USD',
        imageUrl: 'https://example.com/images/floodlight.jpg',
        productUrl: 'https://example.com/products/ecolumen-br30',
        rebateEligible: true,
        rebateAmount: 5,
        greenCertified: true,
        userRating: 4.5,
        reviewCount: 186
      }
    ],
    'insulation': [
      {
        id: 'insul-001',
        name: 'ThermoBarrier Wall Insulation',
        manufacturer: 'EcoInsulate',
        model: 'TB-R15-23',
        category: 'Insulation',
        subCategory: 'fiberglass-batts',
        description: 'High-performance fiberglass insulation for energy-efficient walls',
        features: [
          'R-15 thermal resistance',
          'Formaldehyde-free formula',
          'Fire resistant',
          'Standard 23" width for wall studs'
        ],
        specs: {
          rValue: 15,
          thickness: 3.5,
          width: 23,
          length: 93,
          material: 'Fiberglass'
        },
        efficiency: {
          rating: 'Excellent',
          value: 15,
          unit: 'R-Value'
        },
        price: 54.99,
        currency: 'USD',
        imageUrl: 'https://example.com/images/wallinsulation.jpg',
        productUrl: 'https://example.com/products/thermobarrier-r15',
        rebateEligible: true,
        rebateAmount: 15,
        greenCertified: true,
        userRating: 4.6,
        reviewCount: 78
      },
      {
        id: 'insul-002',
        name: 'AtticGuard Blown-In Insulation Kit',
        manufacturer: 'ThermoShield',
        model: 'AG-BIK-30',
        category: 'Insulation',
        subCategory: 'blown-in',
        description: 'Complete DIY kit for adding blown-in insulation to attics',
        features: [
          'Covers up to 300 sq. ft. at R-30',
          'Includes blowing machine rental voucher',
          'Cellulose made from recycled materials',
          'Fire-retardant treatment'
        ],
        specs: {
          rValue: 30,
          coverage: 300,
          depth: 10.25,
          material: 'Cellulose',
          weight: 150
        },
        efficiency: {
          rating: 'Excellent',
          value: 30,
          unit: 'R-Value'
        },
        price: 379.99,
        currency: 'USD',
        imageUrl: 'https://example.com/images/blownin.jpg',
        productUrl: 'https://example.com/products/atticguard-bik30',
        rebateEligible: true,
        rebateAmount: 100,
        greenCertified: true,
        userRating: 4.4,
        reviewCount: 42
      }
    ],
    'windows': [
      {
        id: 'wind-001',
        name: 'ClearView Double-Hung Window',
        manufacturer: 'WindowWorks',
        model: 'CV-DH-3656',
        category: 'Windows',
        subCategory: 'double-hung',
        description: 'Energy-efficient double-hung window with Low-E glass',
        features: [
          'ENERGY STAR certified',
          'Low-E glass coating',
          'Argon gas fill',
          'Tilt-in sashes for easy cleaning'
        ],
        specs: {
          width: 36,
          height: 56,
          uFactor: 0.28,
          solarHeatGain: 0.32,
          visibleTransmittance: 0.51
        },
        efficiency: {
          rating: 'Excellent',
          value: 0.28,
          unit: 'U-Factor'
        },
        price: 389.99,
        currency: 'USD',
        imageUrl: 'https://example.com/images/doublehung.jpg',
        productUrl: 'https://example.com/products/clearview-dh3656',
        rebateEligible: true,
        rebateAmount: 40,
        greenCertified: true,
        userRating: 4.7,
        reviewCount: 124
      }
    ],
    'thermostat': [
      {
        id: 'therm-001',
        name: 'EnergyMinder Smart Thermostat',
        manufacturer: 'SmartHome Technologies',
        model: 'EM-ST200',
        category: 'Thermostats',
        subCategory: 'smart-thermostat',
        description: 'AI-powered learning thermostat with energy usage reports',
        features: [
          'Learning algorithm adapts to your schedule',
          'Smartphone control and monitoring',
          'Energy usage reports',
          'Compatible with most HVAC systems'
        ],
        specs: {
          display: 'Color touchscreen',
          connectivity: 'Wi-Fi, Bluetooth',
          sensors: 'Temperature, Humidity, Occupancy',
          compatibility: '24V systems, heat pumps, multi-stage'
        },
        efficiency: {
          rating: 'Excellent',
          value: 23,
          unit: '% energy savings'
        },
        price: 249.99,
        currency: 'USD',
        imageUrl: 'https://example.com/images/smartthermostat.jpg',
        productUrl: 'https://example.com/products/energyminder-st200',
        rebateEligible: true,
        rebateAmount: 50,
        greenCertified: true,
        userRating: 4.8,
        reviewCount: 567
      }
    ]
  };

  constructor() {
    // Initialize any additional configuration or connections here
  }

  /**
   * Categorize a recommendation based on its title and description
   * @param recommendation Audit recommendation to categorize
   * @returns The most appropriate category for the recommendation
   */
  private categorizeRecommendation(recommendation: AuditRecommendation): string {
    const text = `${recommendation.title} ${recommendation.description} ${recommendation.type || ''}`.toLowerCase();
    
    // Default category if nothing matches
    let bestCategory = 'other';
    let bestMatchCount = 0;
    
    // Find the category with the most keyword matches
    for (const [category, keywords] of Object.entries(this.categoryMappings)) {
      let matchCount = 0;
      
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          matchCount++;
        }
      }
      
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        bestCategory = category;
      }
    }
    
    // If recommendation already has a type that matches directly, use that
    if (recommendation.type && Object.keys(this.mockProducts).includes(recommendation.type.toLowerCase())) {
      return recommendation.type.toLowerCase();
    }
    
    return bestCategory;
  }

  /**
   * Get product recommendations based on an audit recommendation
   * @param category Product category
   * @param limit Maximum number of products to return
   * @returns Array of recommended products
   */
  public getProductsByCategory(category: string, limit: number = 2): Product[] {
    const categoryKey = category.toLowerCase();
    const products = this.mockProducts[categoryKey] || [];
    
    // Return limited number of products
    return products.slice(0, limit);
  }

  /**
   * Enriches a recommendation with relevant product recommendations
   * @param recommendation The recommendation to enrich with product suggestions
   * @returns A copy of the recommendation with products added
   */
  public async enrichRecommendationWithProducts(recommendation: AuditRecommendation): Promise<AuditRecommendation> {
    try {
      // Create a copy of the recommendation to avoid modifying the original
      const enrichedRec = { ...recommendation };
      
      // Skip if recommendation already has products
      if (enrichedRec.products && enrichedRec.products.length > 0) {
        return enrichedRec;
      }
      
      // Determine the best category for this recommendation
      const category = this.categorizeRecommendation(recommendation);
      
      // Get relevant products for this category
      const products = this.getProductsByCategory(category);
      
      // Add products to the recommendation
      enrichedRec.products = products;
      
      appLogger.debug('Enriched recommendation with products', {
        recommendationTitle: recommendation.title,
        category,
        productsCount: products.length
      });
      
      return enrichedRec;
    } catch (error) {
      appLogger.error('Error enriching recommendation with products', {
        error: error instanceof Error ? error.message : String(error),
        recommendationTitle: recommendation.title
      });
      
      // Return original recommendation without products on error
      return { ...recommendation, products: [] };
    }
  }

  /**
   * Get product recommendations based on multiple audit recommendations
   * @param recommendations Array of audit recommendations
   * @returns Array of enriched recommendations with products attached
   */
  public async getRecommendationsWithProducts(
    recommendations: AuditRecommendation[]
  ): Promise<AuditRecommendation[]> {
    try {
      // Process each recommendation to add product suggestions
      const enrichedRecommendations = await Promise.all(
        recommendations.map(rec => this.enrichRecommendationWithProducts(rec))
      );
      
      return enrichedRecommendations;
    } catch (error) {
      appLogger.error('Error getting recommendations with products', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return original recommendations on error
      return recommendations;
    }
  }
}

// Export a singleton instance
export const productRecommendationService = new ProductRecommendationService();
