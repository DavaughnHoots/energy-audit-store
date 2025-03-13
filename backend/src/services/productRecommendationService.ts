import { ProductPreferences } from '../types/energyAuditExtended.js';
import { appLogger } from '../utils/logger.js';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';

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
