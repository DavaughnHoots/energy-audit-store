import { ProductPreferences } from '../types/energyAuditExtended.js';
import { appLogger } from '../utils/logger.js';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';

/**
 * Interface for detailed product information
 */
interface DetailedProduct {
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
  auditContext: AuditContext;
  enhancedMetrics: EnhancedMetrics;
  isSample: boolean;
}

/**
 * Interface for audit context
 */
interface AuditContext {
  auditId: string;
  auditDate: string;
  propertyInfo: {
    propertySize?: number;
    propertyType?: string;
    buildingAge?: number;
    location?: string;
    occupants?: number;
  };
  energyInfo: {
    electricityUsage?: number;
    electricityCost?: number;
    gasUsage?: number;
    gasCost?: number;
  };
}

/**
 * Interface for enhanced product metrics
 */
interface EnhancedMetrics {
  fiveYearSavings: number;
  tenYearSavings: number;
  monthlySavings: number;
  percentageReduction: number;
  co2Reduction: CO2Reduction;
}

/**
 * Interface for CO2 reduction metrics
 */
interface CO2Reduction {
  annual: number;
  fiveYear: number;
  tenYear: number;
  equivalentTrees: number;
  equivalentMilesDriven: number;
}

/**
 * Service for recommending products based on energy audit data and user preferences
 * This implements the functionality of the Python ProductRecommender class
 */
export class ProductRecommendationService {
  private productDb: any[] | null = null;
  private categories: Record<string, any> = {};
  private efficiencyMetrics: Record<string, any> = {};
  
  /**
   * Check if product database is loaded
   */
  isDatabaseLoaded(): boolean {
    return this.productDb !== null;
  }

  /**
   * Load and categorize products from database
   * Equivalent to Python's load_database method
   */
  async loadProductDatabase(): Promise<boolean> {
    try {
      appLogger.info('Loading product database');
      
      // Query products from database
      const result = await pool.query(`
        SELECT 
          p.id, 
          p.name AS "productName", 
          p.description, 
          p.price, 
          p.main_category AS "mainCategory", 
          p.sub_category AS "subCategory", 
          p.efficiency_rating AS "efficiencyRating", 
          p.features,
          p.manufacturer,
          p.model_number AS "modelNumber",
          p.energy_star_certified AS "energyStarCertified",
          p.warranty_years AS "warrantyYears"
        FROM products p
        WHERE p.active = true
      `);
      
      this.productDb = result.rows;
      
      // Clean efficiency values
      if (this.productDb) {
        this.productDb = this.productDb.map(product => {
          // Extract numeric values from efficiency strings
          const efficiencyMatch = product.efficiencyRating?.toString().match(/(\d+\.?\d*)/);
          product.efficiencyValue = efficiencyMatch ? parseFloat(efficiencyMatch[1]) : null;
          return product;
        });
      }
      
      // Create category mapping
      if (this.productDb) {
        this.categories = this.productDb.reduce((acc, product) => {
          if (!acc[product.mainCategory]) {
            acc[product.mainCategory] = [];
          }
          if (!acc[product.mainCategory].includes(product.subCategory)) {
            acc[product.mainCategory].push(product.subCategory);
          }
          return acc;
        }, {});
      }
      
      // Extract efficiency metrics for each category
      Object.keys(this.categories).forEach(category => {
        const categoryProducts = this.productDb ? this.productDb.filter(p => p.mainCategory === category) : [];
        this.efficiencyMetrics[category] = this._getEfficiencyMetrics(categoryProducts);
      });
      
      appLogger.info(`Product database loaded: ${this.productDb?.length || 0} products in ${Object.keys(this.categories).length} categories`);
      return true;
    } catch (error) {
      appLogger.error('Error loading product database', { error });
      return false;
    }
  }
  
  /**
   * Extract relevant efficiency metrics for a category
   * Equivalent to Python's _get_efficiency_metrics method
   */
  private _getEfficiencyMetrics(products: any[]): any {
    const metrics: any = {};
    
    // Filter products with efficiency values
    const productsWithEfficiency = products.filter(p => p.efficiencyValue !== null);
    
    if (productsWithEfficiency.length > 0) {
      const efficiencyValues = productsWithEfficiency.map(p => p.efficiencyValue);
      
      metrics.efficiency = {
        min: Math.min(...efficiencyValues),
        max: Math.max(...efficiencyValues),
        mean: efficiencyValues.reduce((sum, val) => sum + val, 0) / efficiencyValues.length
      };
    }
    
    return metrics;
  }
  
  /**
   * Recommend products based on user preferences
   * Equivalent to Python's recommend_products method
   */
  async recommendProducts(preferences: ProductPreferences): Promise<Record<string, any[]>> {
    try {
      appLogger.info('Generating product recommendations', { preferences });
      
      // Generate cache key based on preferences
      const cacheKey = `product_recommendations:${JSON.stringify(preferences)}`;
      
      // Check cache first
      const cachedRecommendations = await cache.get<Record<string, any[]>>(cacheKey);
      if (cachedRecommendations) {
        appLogger.info('Using cached product recommendations');
        return cachedRecommendations;
      }
      
      // Load product database if not already loaded
      if (!this.productDb) {
        const success = await this.loadProductDatabase();
        if (!success) {
          throw new Error('Failed to load product database');
        }
      }
      
      if (!this.productDb) {
        throw new Error('Product database is still null after loading');
      }
      
      const recommendations: Record<string, any[]> = {};
      
      // Process each selected category
      for (const category of preferences.categories) {
        // Start with all products in this category
        let categoryProducts = this.productDb.filter(p => p.mainCategory === category);
        
        // Filter by features if specified
        if (preferences.features && preferences.features.length > 0) {
          categoryProducts = categoryProducts.filter(product => {
            // Check if product has the required features
            const productFeatures = product.features ? product.features.split(',').map((f: string) => f.trim()) : [];
            return preferences.features.some(feature => productFeatures.includes(feature));
          });
        }
        
        // Filter by budget constraint
        if (preferences.budgetConstraint) {
          categoryProducts = categoryProducts.filter(p => p.price <= preferences.budgetConstraint);
        }
        
        // Sort by efficiency (if available)
        categoryProducts.sort((a, b) => {
          // Sort by efficiency value (descending)
          if (a.efficiencyValue !== null && b.efficiencyValue !== null) {
            return b.efficiencyValue - a.efficiencyValue;
          }
          // Products with efficiency values come first
          if (a.efficiencyValue !== null) return -1;
          if (b.efficiencyValue !== null) return 1;
          // Otherwise sort by price (ascending)
          return a.price - b.price;
        });
        
        // Take top 5 recommendations
        recommendations[category] = categoryProducts.slice(0, 5);
      }
      
      appLogger.info('Product recommendations generated', { 
        categoriesCount: Object.keys(recommendations).length,
        totalRecommendations: Object.values(recommendations).flat().length
      });
      
      // Cache the results for 1 hour
      await cache.set(cacheKey, recommendations, 3600);
      
      return recommendations;
    } catch (error) {
      appLogger.error('Error generating product recommendations', { error });
      return {};
    }
  }
  
  /**
   * Calculate potential savings from recommended products
   * Equivalent to Python's _calculate_product_savings method
   */
  calculateProductSavings(products: any[]): number {
    try {
      if (!products || products.length === 0) {
        return 0;
      }
      
      // Calculate average efficiency improvement
      const productsWithEfficiency = products.filter(p => p.efficiencyValue !== null);
      
      if (productsWithEfficiency.length === 0) {
        return 0;
      }
      
      const avgEfficiency = productsWithEfficiency.reduce((sum, p) => sum + p.efficiencyValue, 0) / 
        productsWithEfficiency.length;
      
      // Baseline efficiency (this would ideally come from the audit data)
      const baselineEfficiency = 1.0;
      
      // Estimate annual energy savings
      const improvementFactor = (avgEfficiency - baselineEfficiency) / baselineEfficiency;
      const estimatedAnnualUsage = 1000; // Assumed annual energy usage in kWh
      
      return estimatedAnnualUsage * improvementFactor * 0.12; // Assuming $0.12/kWh
    } catch (error) {
      appLogger.error('Error calculating product savings', { error });
      return 0;
    }
  }
  
  /**
   * Generate product recommendations section of the report
   * Equivalent to Python's generate_product_recommendations_report method
   */
  generateProductRecommendationsReport(recommendations: Record<string, any[]>): string {
    try {
      let report = "\n---- Product Recommendations ----\n";
      
      if (!recommendations || Object.keys(recommendations).length === 0) {
        report += "No specific product recommendations at this time.\n";
        return report;
      }
      
      for (const [category, products] of Object.entries(recommendations)) {
        if (!products || products.length === 0) {
          continue;
        }
        
        report += `\n${this._formatCategoryName(category)} Recommendations:\n`;
        
        for (const product of products) {
          report += `- ${product.productName}\n`;
          
          if (product.efficiencyRating) {
            report += `  Efficiency: ${product.efficiencyRating}\n`;
          }
          
          if (product.price) {
            report += `  Price: $${product.price.toFixed(2)}\n`;
          }
          
          if (product.features) {
            report += `  Features: ${product.features}\n`;
          }
          
          report += "\n";
        }
      }
      
      return report;
    } catch (error) {
      appLogger.error('Error generating product recommendations report', { error });
      return "\n---- Product Recommendations ----\nError generating recommendations.\n";
    }
  }
  
/**
 * Format category name for display
 */
private _formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get detailed information for a specific product
 * @param productId Product ID to look up
 * @param userId User ID requesting the information
 * @returns Detailed product information or null if not found
 */
async getDetailedProductInfo(productId: string, userId: string): Promise<DetailedProduct | null> {
  try {
    appLogger.info(`Getting detailed product info for product ${productId} and user ${userId}`);
    
    // First, try to find a real product from the database
    const productQuery = `
      SELECT p.*, ar.audit_id, a.created_at as audit_date
      FROM products p
      JOIN audit_recommendations ar ON p.id::text = ANY(SELECT jsonb_array_elements_text(ar.products->'specificProducts'->>'id'))
      JOIN audits a ON ar.audit_id = a.id
      WHERE p.id::text = $1 AND a.user_id = $2
    `;
    
    const productResult = await pool.query(productQuery, [productId, userId]);
    
    if (productResult.rows.length > 0) {
      // Real product found
      const productData = productResult.rows[0];
      appLogger.info(`Found real product ${productId} in database`);
      
      // Get audit context
      const auditContext = await this.getAuditContext(productData.audit_id);
      
      // Calculate enhanced metrics
      const enhancedMetrics = this.calculateEnhancedProductMetrics(productData, auditContext);
      
      return {
        id: productData.id,
        name: productData.product_name || productData.name,
        category: productData.main_category || productData.category,
        price: parseFloat(productData.price) || 0,
        energyEfficiency: productData.efficiency_rating || productData.energyEfficiency || 'Standard',
        features: this.parseFeatures(productData.features),
        description: productData.description || '',
        imageUrl: productData.image_url,
        annualSavings: parseFloat(productData.annual_savings) || 0,
        roi: parseFloat(productData.roi) || 0,
        paybackPeriod: parseFloat(productData.payback_period) || 0,
        audit_id: productData.audit_id,
        audit_date: productData.audit_date,
        auditContext,
        enhancedMetrics,
        isSample: false
      };
    }
    
    // If not found as a real product, look for it in the product comparison history
    // This checks for sample products that might have been generated
    appLogger.info(`Real product not found, checking for sample products for user ${userId}`);
    
    const comparisonQuery = `
      SELECT pc.products
      FROM product_comparisons pc
      WHERE pc.user_id = $1
    `;
    
    const comparisonResult = await pool.query(comparisonQuery, [userId]);
    
    // Search for the product in all comparisons
    for (const row of comparisonResult.rows) {
      try {
        const products = typeof row.products === 'string' 
          ? JSON.parse(row.products) 
          : row.products;
        
        // Look for the product in the comparison
        if (Array.isArray(products)) {
          for (const product of products) {
            if (product.id === productId) {
              appLogger.info(`Found sample product ${productId} in comparisons`);
              
              // Get audit context if available
              const auditContext = product.audit_id 
                ? await this.getAuditContext(product.audit_id) 
                : this.generateDefaultAuditContext();
              
              // Calculate enhanced metrics
              const enhancedMetrics = this.calculateEnhancedProductMetrics(product, auditContext);
              
              return {
                ...product,
                auditContext,
                enhancedMetrics,
                isSample: true
              };
            }
          }
        }
      } catch (parseError) {
        appLogger.warn(`Error parsing products from comparison for user ${userId}:`, { parseError });
        // Continue to next comparison
      }
    }
    
    // If still not found, try to find in recommendations
    appLogger.info(`Product not found in comparisons, checking recommendations for user ${userId}`);
    
    const recommendationsQuery = `
      SELECT 
        ea.id AS audit_id,
        ea.created_at AS audit_date,
        ar.products
      FROM 
        energy_audits ea
      LEFT JOIN 
        audit_recommendations ar ON ea.id = ar.audit_id
      WHERE 
        ea.user_id = $1
        AND ar.products IS NOT NULL
    `;
    
    const recommendationsResult = await pool.query(recommendationsQuery, [userId]);
    
    // Search for the product in recommendations
    for (const row of recommendationsResult.rows) {
      try {
        let recommendationProducts;
        
        if (typeof row.products === 'string') {
          recommendationProducts = JSON.parse(row.products);
        } else if (row.products && typeof row.products === 'object') {
          recommendationProducts = row.products;
        } else {
          continue;
        }
        
        // Check specifically for sample products
        if (recommendationProducts.specificProducts && Array.isArray(recommendationProducts.specificProducts)) {
          for (const product of recommendationProducts.specificProducts) {
            if (product.id === productId) {
              appLogger.info(`Found product ${productId} in recommendation specific products`);
              
              // Get audit context
              const auditContext = await this.getAuditContext(row.audit_id);
              
              // Calculate enhanced metrics
              const enhancedMetrics = this.calculateEnhancedProductMetrics(product, auditContext);
              
              return {
                ...product,
                audit_id: row.audit_id,
                audit_date: row.audit_date,
                auditContext,
                enhancedMetrics,
                isSample: product.isSampleProduct || false
              };
            }
          }
        }
        
        // If product ID starts with "sample-" it might be a generated one
        if (productId.startsWith('sample-')) {
          // Extract category and audit ID from the product ID
          // Format is typically: sample-{category}-{audit_id}-{random}
          const parts = productId.split('-');
          if (parts.length >= 3 && parts[2] === row.audit_id) {
            appLogger.info(`Found matching audit ID for sample product ${productId}`);
            
            // This is likely the audit this sample product was generated from
            // Generate a sample product based on this audit/recommendation
            const category = parts[1] || 'Other';
            
            // Get audit context
            const auditContext = await this.getAuditContext(row.audit_id);
            
            // Generate sample product data
            const price = category === 'HVAC' ? 3500 : 
                          category === 'Lighting' ? 150 :
                          category === 'Insulation' ? 1000 :
                          category === 'Windows' ? 2000 :
                          category === 'Appliances' ? 800 : 500;
                          
            const annualSavings = Math.round(price * (Math.random() * 0.2 + 0.1)); // 10-30% of price
            const roi = annualSavings / price;
            const paybackPeriod = price / annualSavings;
            
            // Generate features based on category
            const features = this.generateFeaturesForCategory(category);
            
            // Create product
            const product = {
              id: productId,
              name: `Energy Efficient ${this._formatCategoryName(category)}`,
              category,
              price,
              energyEfficiency: 'High',
              features,
              description: `This energy efficient ${category.toLowerCase()} will help you save on energy costs while improving your home's comfort and efficiency.`,
              imageUrl: undefined,
              annualSavings,
              roi,
              paybackPeriod,
              audit_id: row.audit_id,
              audit_date: row.audit_date,
              auditContext,
              enhancedMetrics: this.calculateEnhancedProductMetrics({
                price,
                annualSavings,
                roi,
                paybackPeriod,
                category
              }, auditContext),
              isSample: true
            };
            
            return product;
          }
        }
      } catch (parseError) {
        appLogger.warn(`Error parsing products from recommendations for audit ${row.audit_id}:`, { parseError });
        // Continue to next recommendation
      }
    }
    
    // If still not found, return null
    appLogger.info(`Product ${productId} not found for user ${userId}`);
    return null;
  } catch (error) {
    appLogger.error('Error getting detailed product info:', { 
      error, 
      errorMessage: error instanceof Error ? error.message : String(error),
      productId,
      userId
    });
    return null;
  }
}

/**
 * Parse features string into an array
 */
private parseFeatures(features: string | string[] | undefined): string[] {
  if (!features) {
    return [];
  }
  
  if (Array.isArray(features)) {
    return features;
  }
  
  return features.split(',').map(f => f.trim()).filter(f => f);
}

/**
 * Generate features based on product category
 */
private generateFeaturesForCategory(category: string): string[] {
  const features = [];
  
  if (category === 'HVAC' || category.toUpperCase() === 'HVAC') {
    features.push('Energy Star Certified');
    features.push('Smart Thermostat Compatible');
    features.push('Quiet Operation');
    features.push('Multi-Stage Compressor');
  } else if (category === 'Lighting') {
    features.push('LED Technology');
    features.push('Dimmable');
    features.push('Long Lifespan');
    features.push('Low Heat Emission');
  } else if (category === 'Insulation') {
    features.push('High R-Value');
    features.push('Moisture Resistant');
    features.push('Fire Resistant');
    features.push('Eco-Friendly Materials');
  } else if (category === 'Windows') {
    features.push('Double Pane');
    features.push('Low-E Coating');
    features.push('Argon Gas Filled');
    features.push('UV Protection');
  } else if (category === 'Appliances') {
    features.push('Energy Star Certified');
    features.push('Smart Home Compatible');
    features.push('Low Water Usage');
    features.push('Efficient Cycle Options');
  } else {
    features.push('Energy Efficient');
    features.push('Cost Effective');
    features.push('Easy Installation');
  }
  
  return features;
}

/**
 * Get audit context for a product
 * @param auditId Audit ID
 * @returns Audit context information
 */
async getAuditContext(auditId: string): Promise<AuditContext> {
  try {
    const auditQuery = `
      SELECT 
        a.*,
        ea.home_details,
        ea.energy_consumption,
        ea.current_conditions
      FROM 
        audits a
      LEFT JOIN 
        energy_audits ea ON a.id = ea.id
      WHERE 
        a.id = $1
    `;
    
    const auditResult = await pool.query(auditQuery, [auditId]);
    
    if (auditResult.rows.length === 0) {
      return this.generateDefaultAuditContext();
    }
    
    const auditData = auditResult.rows[0];
    
    // Extract property info
    let propertyInfo = {};
    if (auditData.home_details) {
      const homeDetails = typeof auditData.home_details === 'string' 
        ? JSON.parse(auditData.home_details) 
        : auditData.home_details;
        
      propertyInfo = {
        propertySize: homeDetails.squareFootage,
        propertyType: homeDetails.propertyType,
        buildingAge: homeDetails.yearBuilt ? new Date().getFullYear() - homeDetails.yearBuilt : undefined,
        location: homeDetails.location,
        occupants: homeDetails.occupants
      };
    }
    
    // Extract energy info
    let energyInfo = {};
    if (auditData.energy_consumption) {
      const energyConsumption = typeof auditData.energy_consumption === 'string'
        ? JSON.parse(auditData.energy_consumption)
        : auditData.energy_consumption;
        
      energyInfo = {
        electricityUsage: energyConsumption.electricityUsage,
        electricityCost: energyConsumption.electricBill,
        gasUsage: energyConsumption.gasUsage,
        gasCost: energyConsumption.gasBill
      };
    }
    
    return {
      auditId,
      auditDate: auditData.created_at,
      propertyInfo: propertyInfo as AuditContext['propertyInfo'],
      energyInfo: energyInfo as AuditContext['energyInfo']
    };
  } catch (error) {
    appLogger.error('Error getting audit context:', { error, auditId });
    return this.generateDefaultAuditContext(auditId);
  }
}

/**
 * Generate default audit context when real data is not available
 * @param auditId Optional audit ID
 * @returns Default audit context
 */
private generateDefaultAuditContext(auditId?: string): AuditContext {
  return {
    auditId: auditId || 'unknown',
    auditDate: new Date().toISOString(),
    propertyInfo: {
      propertySize: 2000,
      propertyType: 'residential',
      buildingAge: 25,
      occupants: 4
    },
    energyInfo: {
      electricityUsage: 1000,
      electricityCost: 150,
      gasUsage: 100,
      gasCost: 120
    }
  };
}

/**
 * Calculate enhanced product metrics
 * @param product Product data
 * @param auditContext Audit context
 * @returns Enhanced metrics
 */
calculateEnhancedProductMetrics(product: any, auditContext: AuditContext): EnhancedMetrics {
  try {
    // Get annual savings from product
    const annualSavings = product.annualSavings || 0;
    
    // Calculate 5-year and 10-year projections
    const fiveYearSavings = annualSavings * 5;
    const tenYearSavings = annualSavings * 10;
    
    // Calculate monthly savings
    const monthlySavings = annualSavings / 12;
    
    // Calculate percentage reduction in energy bills
    let percentageReduction = 0;
    
    if (auditContext.energyInfo) {
      const totalAnnualEnergyCost = 
        (auditContext.energyInfo.electricityCost || 0) + 
        (auditContext.energyInfo.gasCost || 0);
        
      if (totalAnnualEnergyCost > 0) {
        percentageReduction = (annualSavings / totalAnnualEnergyCost) * 100;
      }
    }
    
    // Calculate environmental impact
    const co2Reduction = this.calculateCO2Reduction(product, auditContext);
    
    return {
      fiveYearSavings,
      tenYearSavings,
      monthlySavings,
      percentageReduction,
      co2Reduction
    };
  } catch (error) {
    appLogger.error('Error calculating enhanced metrics:', { error, product });
    
    // Return default metrics
    return {
      fiveYearSavings: 0,
      tenYearSavings: 0,
      monthlySavings: 0,
      percentageReduction: 0,
      co2Reduction: {
        annual: 0,
        fiveYear: 0,
        tenYear: 0,
        equivalentTrees: 0,
        equivalentMilesDriven: 0
      }
    };
  }
}

/**
 * Calculate CO2 reduction based on product type and energy savings
 * @param product Product data
 * @param auditContext Audit context
 * @returns CO2 reduction metrics
 */
private calculateCO2Reduction(product: any, auditContext: AuditContext): CO2Reduction {
  try {
    // CO2 emission factors (kg CO2 per kWh)
    const ELECTRICITY_EMISSION_FACTOR = 0.92; // Example value
    const GAS_EMISSION_FACTOR = 0.18; // Example value
    
    // Get annual savings
    const annualSavings = product.annualSavings || 0;
    
    if (annualSavings <= 0) {
      return {
        annual: 0,
        fiveYear: 0,
        tenYear: 0,
        equivalentTrees: 0,
        equivalentMilesDriven: 0
      };
    }
    
    let electricitySavingsKWh = 0;
    let gasSavingsKWh = 0;
    
    // Estimate savings breakdown by energy type based on product category
    const category = product.category || 'Other';
    
    if (category === 'HVAC' || category.toUpperCase() === 'HVAC') {
      // HVAC typically affects both electricity and gas
      electricitySavingsKWh = annualSavings * 0.6 / 0.15; // Assuming $0.15 per kWh
      gasSavingsKWh = annualSavings * 0.4 / 0.08; // Assuming $0.08 per kWh equivalent for gas
    } else if (category === 'Lighting') {
      // Lighting typically affects only electricity
      electricitySavingsKWh = annualSavings / 0.15;
    } else if (category === 'Insulation' || category === 'Windows') {
      // Insulation and windows typically affect more gas than electricity
      electricitySavingsKWh = annualSavings * 0.3 / 0.15;
      gasSavingsKWh = annualSavings * 0.7 / 0.08;
    } else if (category === 'Appliances') {
      // Appliances typically affect more electricity than gas
      electricitySavingsKWh = annualSavings * 0.8 / 0.15;
      gasSavingsKWh = annualSavings * 0.2 / 0.08;
    } else {
      // Default split for other categories
      electricitySavingsKWh = annualSavings * 0.7 / 0.15;
      gasSavingsKWh = annualSavings * 0.3 / 0.08;
    }
    
    // Calculate CO2 reduction
    const electricityCO2Reduction = electricitySavingsKWh * ELECTRICITY_EMISSION_FACTOR;
    const gasCO2Reduction = gasSavingsKWh * GAS_EMISSION_FACTOR;
    const totalCO2Reduction = electricityCO2Reduction + gasCO2Reduction;
    
    return {
      annual: totalCO2Reduction,
      fiveYear: totalCO2Reduction * 5,
      tenYear: totalCO2Reduction * 10,
      equivalentTrees: Math.round(totalCO2Reduction / 21), // Average tree absorbs ~21kg CO2 per year
      equivalentMilesDriven: Math.round(totalCO2Reduction * 2.5) // ~400g CO2 per mile driven
    };
  } catch (error) {
    appLogger.error('Error calculating CO2 reduction:', { error, product });
    
    return {
      annual: 0,
      fiveYear: 0,
      tenYear: 0,
      equivalentTrees: 0,
      equivalentMilesDriven: 0
    };
  }
}
  
  /**
   * Get statistics for a specific category
   * Equivalent to Python's get_category_stats method
   */
  getCategoryStats(category: string): any {
    if (!this.productDb) {
      return null;
    }
    
    const categoryProducts = this.productDb.filter(p => p.mainCategory === category);
    
    return {
      totalProducts: categoryProducts.length,
      subcategories: [...new Set(categoryProducts.map(p => p.subCategory))],
      efficiencyMetrics: this.efficiencyMetrics[category] || {},
      features: this._extractCommonFeatures(categoryProducts)
    };
  }
  
  /**
   * Extract common features from a category
   * Equivalent to Python's _extract_common_features method
   */
  private _extractCommonFeatures(products: any[]): string[] {
    const allFeatures = products
      .filter(p => p.features)
      .flatMap(p => p.features.split(',').map((f: string) => f.trim()));
    
    return [...new Set(allFeatures)];
  }
}

// Export singleton instance
export const productRecommendationService = new ProductRecommendationService();
