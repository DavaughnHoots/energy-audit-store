/**
 * Product Recommendation Service
 * 
 * This service handles the retrieval and generation of product recommendations
 * based on energy audit data.
 */

import { ProductRecommendation, RecommendationContext, ProductFilter } from '../types/product.js';
import db from '../utils/db.js';

/**
 * Alias for backward compatibility
 */
export type ProductFilters = ProductFilter;

/**
 * Service class for generating and retrieving product recommendations
 */
export class ProductRecommendationService {
  private initialized = false;
  private productDatabase: Record<string, any[]> = {};

  /**
   * Check if product database is loaded
   */
  isDatabaseLoaded(): boolean {
    return this.initialized;
  }

  /**
   * Load product database from all sources
   */
  async loadProductDatabase(): Promise<void> {
    try {
      const productQuery = await db.query(
        'SELECT * FROM products WHERE active = true',
        []
      );
      
      // Process and categorize products
      const products = productQuery.rows;
      this.productDatabase = {};
      
      // Group products by category
      for (const product of products) {
        const category = product.main_category || 'Uncategorized';
        
        if (!this.productDatabase[category]) {
          this.productDatabase[category] = [];
        }
        
        this.productDatabase[category].push(this.mapDbRowToProduct(product));
      }
      
      this.initialized = true;
      console.log(`Product database loaded with ${products.length} products across ${Object.keys(this.productDatabase).length} categories`);
    } catch (error) {
      console.error('Failed to load product database:', error);
      throw new Error('Failed to initialize product recommendation service');
    }
  }

  /**
   * Map database row to Product object
   */
  private mapDbRowToProduct(row: any): any {
    return {
      id: row.id,
      name: row.name || row.product_name,
      category: row.main_category,
      subCategory: row.sub_category,
      price: row.price || 0,
      energyEfficiency: row.energy_efficiency || 'Standard',
      features: row.features ? row.features.split(',').map((f: string) => f.trim()) : [],
      description: row.description || '',
      imageUrl: row.image_url || '',
      manufacturerUrl: row.manufacturer_url || '',
      annualSavings: row.annual_savings || 0,
      roi: row.roi || 0,
      paybackPeriod: row.payback_period || 0,
      rebateEligible: row.rebate_eligible || false,
      greenCertified: row.green_certified || false,
      userRating: row.user_rating || 0,
      // Backward compatibility properties
      mainCategory: row.main_category,
      efficiency: row.energy_efficiency || 'Standard',
      model: row.model || ''
    };
  }

  /**
   * Get statistics for a product category
   */
  getCategoryStats(category: string): any {
    if (!this.initialized) {
      throw new Error('Product database not initialized');
    }
    
    const products = this.productDatabase[category];
    if (!products || products.length === 0) {
      return null;
    }
    
    // Calculate average price, efficiency, and savings
    const totalProducts = products.length;
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / totalProducts;
    const avgSavings = products.reduce((sum, p) => sum + p.annualSavings, 0) / totalProducts;
    const avgPayback = products.reduce((sum, p) => sum + p.paybackPeriod, 0) / totalProducts;
    
    // Get efficiency distribution
    const efficiencyDistribution: Record<string, number> = {};
    products.forEach(p => {
      const eff = p.energyEfficiency || 'Standard';
      efficiencyDistribution[eff] = (efficiencyDistribution[eff] || 0) + 1;
    });
    
    // Convert to percentages
    Object.keys(efficiencyDistribution).forEach(key => {
      efficiencyDistribution[key] = Math.round((efficiencyDistribution[key] / totalProducts) * 100);
    });
    
    return {
      category,
      totalProducts,
      priceRange: {
        min: Math.min(...products.map(p => p.price)),
        max: Math.max(...products.map(p => p.price)),
        avg: Math.round(avgPrice)
      },
      annualSavings: {
        min: Math.min(...products.map(p => p.annualSavings)),
        max: Math.max(...products.map(p => p.annualSavings)),
        avg: Math.round(avgSavings)
      },
      paybackPeriod: {
        min: Math.min(...products.map(p => p.paybackPeriod)),
        max: Math.max(...products.map(p => p.paybackPeriod)),
        avg: Math.round(avgPayback * 10) / 10
      },
      efficiencyDistribution
    };
  }

  /**
   * Calculate total potential savings for a group of products
   */
  calculateProductSavings(products: any[]): number {
    if (!products || !Array.isArray(products)) {
      return 0;
    }
    
    // Sum up all annual savings
    return products.reduce((total, product) => {
      return total + (product.annualSavings || 0);
    }, 0);
  }

  /**
   * Recommend products based on product preferences
   */
  async recommendProducts(preferences: any): Promise<Record<string, any[]>> {
    if (!this.initialized) {
      await this.loadProductDatabase();
    }
    
    // Ensure preferences is valid
    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Invalid product preferences');
    }
    
    const recommendations: Record<string, any[]> = {};
    
    // Process each category in preferences
    for (const [category, prefs] of Object.entries(preferences)) {
      // Skip if we don't have this category
      if (!this.productDatabase[category]) {
        continue;
      }
      
      // Filter products based on preferences
      const filteredProducts = this.filterProductsByPreferences(
        this.productDatabase[category],
        prefs as Record<string, any>
      );
      
      // Only include if we have products to recommend
      if (filteredProducts.length > 0) {
        recommendations[category] = filteredProducts;
      }
    }
    
    return recommendations;
  }

  /**
   * Filter products based on preferences
   */
  private filterProductsByPreferences(products: any[], preferences: Record<string, any>): any[] {
    return products.filter(product => {
      // Apply filters from preferences
      if (preferences.minEfficiency && 
          !this.meetsEfficiencyRequirement(product.energyEfficiency, preferences.minEfficiency)) {
        return false;
      }
      
      if (preferences.maxPrice && product.price > preferences.maxPrice) {
        return false;
      }
      
      if (preferences.minSavings && product.annualSavings < preferences.minSavings) {
        return false;
      }
      
      if (preferences.maxPayback && product.paybackPeriod > preferences.maxPayback) {
        return false;
      }
      
      if (preferences.features && Array.isArray(preferences.features) && preferences.features.length > 0) {
        // Check if product has at least one of the requested features
        const productFeatures = product.features || [];
        if (!preferences.features.some((f: string) => productFeatures.includes(f))) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by savings by default
      return b.annualSavings - a.annualSavings;
    }).slice(0, preferences.limit || 10);
  }

  /**
   * Check if product efficiency meets minimum requirement
   */
  private meetsEfficiencyRequirement(productEfficiency: string, minEfficiency: string): boolean {
    const efficiencyRanking: Record<string, number> = {
      'A+++': 10,
      'A++': 9,
      'A+': 8,
      'A': 7,
      'B': 6,
      'C': 5,
      'D': 4,
      'E': 3,
      'F': 2,
      'G': 1,
      'Standard': 0
    };
    
    const productRank = efficiencyRanking[productEfficiency] || 0;
    const minRank = efficiencyRanking[minEfficiency] || 0;
    
    return productRank >= minRank;
  }

  /**
   * Get detailed product information for a specific product
   */
  async getDetailedProductInfo(productId: string, userId: string): Promise<any> {
    try {
      // Get base product info
      const productQuery = await db.query(
        'SELECT * FROM products WHERE id = $1',
        [productId]
      );
      
      if (productQuery.rows.length === 0) {
        return null;
      }
      
      const product = this.mapDbRowToProduct(productQuery.rows[0]);
      
      // Get user-specific data like view history
      const viewHistoryQuery = await db.query(
        'SELECT * FROM product_view_history WHERE product_id = $1 AND user_id = $2',
        [productId, userId]
      );
      
      // Get related audits that recommended this product
      const auditQuery = await db.query(
        `SELECT ea.id, ea.title, ea.created_at 
         FROM energy_audits ea
         JOIN audit_recommendations ar ON ea.id = ar.audit_id
         WHERE ar.product_id = $1 AND ea.user_id = $2
         ORDER BY ea.created_at DESC
         LIMIT 3`,
        [productId, userId]
      );
      
      // Enhance product with additional context
      const enhancedProduct = {
        ...product,
        userContext: {
          viewHistory: viewHistoryQuery.rows.length > 0 ? {
            lastViewed: viewHistoryQuery.rows[0].viewed_at,
            viewCount: viewHistoryQuery.rows[0].view_count
          } : null,
          relatedAudits: auditQuery.rows.map((row: any) => ({
            id: row.id,
            title: row.title,
            date: row.created_at
          }))
        },
        enhancedMetrics: {
          fiveYearSavings: product.annualSavings * 5,
          tenYearSavings: product.annualSavings * 10,
          monthlySavings: Math.round((product.annualSavings / 12) * 100) / 100,
          percentageReduction: Math.min(25, Math.round(Math.random() * 20 + 5)), // Placeholder
          co2Reduction: {
            annual: Math.round(product.annualSavings * 0.5), // Simplified CO2 calculation
            fiveYear: Math.round(product.annualSavings * 0.5 * 5),
            tenYear: Math.round(product.annualSavings * 0.5 * 10),
            equivalentTrees: Math.round(product.annualSavings * 0.05),
            equivalentMilesDriven: Math.round(product.annualSavings * 2)
          }
        }
      };
      
      // Record this view in history
      await this.recordProductView(productId, userId);
      
      return enhancedProduct;
    } catch (error) {
      console.error('Error getting detailed product info:', error);
      throw error;
    }
  }

  /**
   * Record that a user viewed a product
   */
  private async recordProductView(productId: string, userId: string): Promise<void> {
    try {
      // Check if user has viewed this product before
      const viewQuery = await db.query(
        'SELECT * FROM product_view_history WHERE product_id = $1 AND user_id = $2',
        [productId, userId]
      );
      
      if (viewQuery.rows.length > 0) {
        // Update existing record
        await db.query(
          'UPDATE product_view_history SET view_count = view_count + 1, viewed_at = NOW() WHERE product_id = $1 AND user_id = $2',
          [productId, userId]
        );
      } else {
        // Insert new record
        await db.query(
          'INSERT INTO product_view_history (product_id, user_id, view_count, viewed_at) VALUES ($1, $2, 1, NOW())',
          [productId, userId]
        );
      }
    } catch (error) {
      console.error('Error recording product view:', error);
      // Don't throw error for view tracking failure
    }
  }
  /**
   * Get product recommendations based on audit data
   * 
   * @param auditId - The ID of the energy audit
   * @param limit - Maximum number of recommendations to return
   * @returns Array of product recommendations
   */
  async getRecommendationsFromAudit(
    auditId: string,
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    try {
      // First try to get from database if already generated
      const existingRecommendations = await this.getStoredRecommendations(auditId);
      
      if (existingRecommendations && existingRecommendations.length > 0) {
        console.log(`Found ${existingRecommendations.length} existing recommendations for audit ${auditId}`);
        return existingRecommendations.slice(0, limit);
      }
      
      // If not found, generate fresh recommendations
      console.log(`Generating new recommendations for audit ${auditId}`);
      const auditContext = await this.getAuditContext(auditId);
      
      if (!auditContext) {
        console.warn(`No audit context found for audit ID ${auditId}`);
        return [];
      }
      
      // Generate product recommendations based on the audit context
      const recommendations = await this.generateRecommendations(auditContext, limit);
      
      // Store the generated recommendations
      if (recommendations.length > 0) {
        await this.storeRecommendations(auditId, recommendations);
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations from audit:', error);
      return [];
    }
  }

  /**
   * Retrieve stored product recommendations for an audit from the database
   */
  private async getStoredRecommendations(auditId: string): Promise<ProductRecommendation[]> {
    try {
      const result = await db.query(
        'SELECT recommendation_data FROM product_recommendations WHERE audit_id = $1',
        [auditId]
      );
      
      if (result.rows.length === 0) {
        return [];
      }
      
      return result.rows.map((row: any) => row.recommendation_data);
    } catch (error) {
      console.error('Error retrieving stored recommendations:', error);
      return [];
    }
  }

  /**
   * Store product recommendations in the database
   */
  private async storeRecommendations(auditId: string, recommendations: ProductRecommendation[]): Promise<void> {
    try {
      // First delete any existing recommendations for this audit
      await db.query('DELETE FROM product_recommendations WHERE audit_id = $1', [auditId]);
      
      // Insert new recommendations
      const queryText = `
        INSERT INTO product_recommendations 
        (audit_id, product_id, recommendation_data, recommendation_score, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      
      for (const recommendation of recommendations) {
        await db.query(
          queryText,
          [
            auditId,
            recommendation.id,
            recommendation,
            recommendation.recommendationScore || 0
          ]
        );
      }
      
      console.log(`Successfully stored ${recommendations.length} recommendations for audit ${auditId}`);
    } catch (error) {
      console.error('Error storing recommendations:', error);
    }
  }

  /**
   * Get audit context for recommendation generation
   */
  private async getAuditContext(auditId: string): Promise<RecommendationContext | null> {
    try {
      // Retrieve audit data from the database
      const auditResult = await db.query(
        `SELECT 
          ea.id,
          ea.property_type,
          ea.property_size,
          ea.building_age,
          ea.annual_electricity_usage,
          ea.annual_electricity_cost,
          ea.annual_gas_usage,
          ea.annual_gas_cost,
          ea.created_at
        FROM 
          energy_audits ea
        WHERE 
          ea.id = $1`,
        [auditId]
      );
      
      if (auditResult.rows.length === 0) {
        return null;
      }
      
      const audit = auditResult.rows[0];
      
      // Get equipment data
      const equipmentResult = await db.query(
        `SELECT 
          equipment_type,
          count,
          wattage,
          age,
          efficiency
        FROM 
          audit_equipment
        WHERE 
          audit_id = $1`,
        [auditId]
      );
      
      // Transform equipment data into the expected format
      const equipment: any = {
        lighting: { types: [], count: 0, wattage: 0 },
        hvac: { type: '', age: 0, efficiency: 0 },
        appliances: []
      };
      
      for (const item of equipmentResult.rows) {
        if (item.equipment_type.includes('lighting')) {
          equipment.lighting.types.push(item.equipment_type);
          equipment.lighting.count += item.count || 0;
          equipment.lighting.wattage += item.wattage || 0;
        } else if (item.equipment_type.includes('hvac')) {
          equipment.hvac.type = item.equipment_type;
          equipment.hvac.age = item.age || 0;
          equipment.hvac.efficiency = item.efficiency || 0;
        } else {
          equipment.appliances.push({
            type: item.equipment_type,
            count: item.count || 1,
            age: item.age || 0
          });
        }
      }
      
      // Get prioritized improvements
      const improvementsResult = await db.query(
        `SELECT 
          improvement_type
        FROM 
          audit_improvement_priorities
        WHERE 
          audit_id = $1
        ORDER BY 
          priority_level`,
        [auditId]
      );
      const prioritizedImprovements = improvementsResult.rows.map((row: any) => row.improvement_type);
      
      // Build the recommendation context
      return {
        auditId,
        propertyType: audit.property_type,
        propertySize: audit.property_size,
        buildingAge: audit.building_age,
        existingEquipment: equipment,
        energyUsage: {
          electricity: {
            annual: audit.annual_electricity_usage,
            cost: audit.annual_electricity_cost
          },
          gas: {
            annual: audit.annual_gas_usage,
            cost: audit.annual_gas_cost
          }
        },
        prioritizedImprovements
      };
    } catch (error) {
      console.error('Error retrieving audit context:', error);
      return null;
    }
  }

  /**
   * Generate product recommendations based on audit context
   */
  private async generateRecommendations(
    context: RecommendationContext,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      // Get products that match the context
      const filters = this.buildFiltersFromContext(context);
      const products = await this.getFilteredProducts(filters);
      
      if (products.length === 0) {
        return [];
      }
      
      // Score and rank products
      const scoredProducts = this.scoreProductsForContext(products, context);
      
      // Convert to recommendations
      const recommendations = scoredProducts.map(product => this.createRecommendation(product, context));
      
      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Build product filters based on audit context
   */
  private buildFiltersFromContext(context: RecommendationContext): ProductFilter {
    const filters: ProductFilter = {};
    
    // If there are prioritized improvements, use them to determine categories
    if (context.prioritizedImprovements && context.prioritizedImprovements.length > 0) {
      const improvementToCategoryMap: Record<string, string> = {
        'lighting': 'Lighting',
        'hvac': 'HVAC',
        'insulation': 'Insulation',
        'appliances': 'Appliances',
        'water_heating': 'Water Heating',
        'renewable_energy': 'Renewable Energy'
      };
      
      // Use the highest priority improvement to set category filter
      for (const improvement of context.prioritizedImprovements) {
        const category = improvementToCategoryMap[improvement.toLowerCase()];
        if (category) {
          filters.mainCategory = category;
          break;
        }
      }
    }
    
    // Set minimum energy efficiency based on property age
    if (context.buildingAge) {
      if (context.buildingAge < 10) {
        // For newer buildings, recommend highest efficiency products
        filters.energyEfficiency = 'A+';
      } else if (context.buildingAge < 20) {
        filters.energyEfficiency = 'A';
      }
    }
    
    // Set price range based on energy usage
    if (context.energyUsage && context.energyUsage.electricity) {
      const annualCost = (context.energyUsage.electricity.cost || 0) + 
                        (context.energyUsage.gas?.cost || 0);
      
      if (annualCost > 3000) {
        filters.priceRange = { max: 5000 };
      } else if (annualCost > 1500) {
        filters.priceRange = { max: 2500 };
      } else {
        filters.priceRange = { max: 1000 };
      }
    }
    
    return filters;
  }

  /**
   * Get filtered products from database
   */
  private async getFilteredProducts(filters: ProductFilter): Promise<any[]> {
    try {
      let query = `
        SELECT 
          p.*
        FROM 
          products p
        WHERE 1=1
      `;
      
      const values: any[] = [];
      let valueIndex = 1;
      
      if (filters.mainCategory) {
        query += ` AND p.category = $${valueIndex}`;
        values.push(filters.mainCategory);
        valueIndex++;
      }
      
      if (filters.subCategory) {
        query += ` AND p.sub_category = $${valueIndex}`;
        values.push(filters.subCategory);
        valueIndex++;
      }
      
      // Map energyEfficiency filter to database field
      if (filters.energyEfficiency) {
        query += ` AND p.energy_efficiency >= $${valueIndex}`;
        values.push(filters.energyEfficiency);
        valueIndex++;
      }
      
      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          query += ` AND p.price >= $${valueIndex}`;
          values.push(filters.priceRange.min);
          valueIndex++;
        }
        
        if (filters.priceRange.max !== undefined) {
          query += ` AND p.price <= $${valueIndex}`;
          values.push(filters.priceRange.max);
          valueIndex++;
        }
      }
      
      if (filters.rebateEligible) {
        query += ` AND p.rebate_eligible = $${valueIndex}`;
        values.push(filters.rebateEligible);
        valueIndex++;
      }
      
      if (filters.greenCertified) {
        query += ` AND p.green_certified = $${valueIndex}`;
        values.push(filters.greenCertified);
        valueIndex++;
      }
      
      if (filters.minUserRating) {
        query += ` AND p.user_rating >= $${valueIndex}`;
        values.push(filters.minUserRating);
        valueIndex++;
      }
      
      query += ' ORDER BY p.annual_savings DESC LIMIT 100';
      
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting filtered products:', error);
      return [];
    }
  }

  /**
   * Score products based on relevance to the audit context
   */
  private scoreProductsForContext(products: any[], context: RecommendationContext): any[] {
    return products.map(product => {
      let score = 0;
      
      // Base score from annual savings
      score += product.annual_savings / 100;
      
      // Adjust based on property type match
      if (product.recommended_property_types && 
          product.recommended_property_types.includes(context.propertyType)) {
        score += 20;
      }
      
      // Adjust based on prioritized improvements
      if (context.prioritizedImprovements && 
          context.prioritizedImprovements.some(imp => 
            product.category.toLowerCase().includes(imp.toLowerCase()))) {
        score += 30;
      }
      
      // Adjust for ROI
      score += product.roi * 5;
      
      // Factor in user ratings
      score += (product.user_rating || 0) * 10;
      
      // Eco-friendliness bonus
      if (product.green_certified) {
        score += 15;
      }
      
      // Rebate bonus
      if (product.rebate_eligible) {
        score += 10;
      }
      
      // Return product with its score
      return {
        ...product,
        recommendationScore: Math.round(score)
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Create a structured product recommendation from a product
   */
  private createRecommendation(product: any, context: RecommendationContext): ProductRecommendation {
    const baseAnnualSavings = product.annual_savings || 0;
    
    // Calculate environmental impact based on energy savings
    const co2ReductionPerDollar = 0.5; // kg CO2 per dollar saved
    const treesPerTonCO2 = 40; // equivalent trees per ton of CO2
    
    const co2Reduction = baseAnnualSavings * co2ReductionPerDollar;
    const equivalentTrees = (co2Reduction / 1000) * treesPerTonCO2;
    
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      subCategory: product.sub_category,
      price: product.price,
      energyEfficiency: product.energy_efficiency,
      features: product.features || [],
      description: product.description,
      imageUrl: product.image_url,
      manufacturerUrl: product.manufacturer_url,
      annualSavings: baseAnnualSavings,
      roi: product.roi,
      paybackPeriod: product.payback_period,
      rebateEligible: product.rebate_eligible,
      greenCertified: product.green_certified,
      userRating: product.user_rating || 0,
      recommendationScore: product.recommendationScore,
      savingsEstimate: {
        annual: baseAnnualSavings,
        fiveYear: baseAnnualSavings * 5,
        tenYear: baseAnnualSavings * 10
      },
      environmentalImpact: {
        co2Reduction,
        equivalentTrees
      },
      relevanceFactor: product.recommendationScore / 100,
      installationComplexity: product.installation_complexity || 'Medium',
      auditContext: {
        auditId: context.auditId,
        recommendedDate: new Date()
      }
    };
  }

  /**
   * Get top recommendations across all categories
   */
  async getTopRecommendations(limit: number = 10): Promise<ProductRecommendation[]> {
    try {
      const result = await db.query(
        `SELECT 
          recommendation_data
        FROM 
          product_recommendations
        ORDER BY 
          recommendation_score DESC, 
          created_at DESC
        LIMIT $1`,
        [limit]
      );
      return result.rows.map((row: any) => row.recommendation_data);
    } catch (error) {
      console.error('Error retrieving top recommendations:', error);
      return [];
    }
  }

  /**
   * Get recommendations by category
   */
  async getRecommendationsByCategory(
    category: string,
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    try {
      const result = await db.query(
        `SELECT 
          recommendation_data
        FROM 
          product_recommendations
        WHERE 
          recommendation_data->>'category' = $1
        ORDER BY 
          recommendation_score DESC, 
          created_at DESC
        LIMIT $2`,
        [category, limit]
      );
      return result.rows.map((row: any) => row.recommendation_data);
    } catch (error) {
      console.error('Error retrieving recommendations by category:', error);
      return [];
    }
  }
}

// Export singleton instance
export const productRecommendationService = new ProductRecommendationService();
