import { pool } from '../config/database.js';
import { appLogger } from '../utils/logger.js';

/**
 * Get product history from past audits for a user
 * @param userId The user ID
 * @param limit Maximum number of audits to retrieve (default: 20)
 * @returns Array of products from past audits
 */
export async function getProductHistory(userId: string, limit: number = 20): Promise<any[]> {
  try {
    // First try to get specific product recommendations
    const productsQuery = `
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
      ORDER BY 
        ea.created_at DESC
      LIMIT $2
    `;
    
    const productsResult = await pool.query(productsQuery, [userId, limit]);
    
    // Process and flatten the products
    const productHistory: any[] = [];
    for (const row of productsResult.rows) {
      const auditProducts = Array.isArray(row.products) ? row.products : 
                           (typeof row.products === 'string' ? JSON.parse(row.products) : []);
      
      for (const product of auditProducts) {
        productHistory.push({
          ...product,
          audit_id: row.audit_id,
          audit_date: row.audit_date
        });
      }
    }
    
    // If we found specific products, return them
    if (productHistory.length > 0) {
      appLogger.info(`Retrieved ${productHistory.length} products from ${productsResult.rows.length} audits for user ${userId}`);
      return productHistory;
    }
    
    // If no specific products found, get general recommendations and generate sample products
    const recommendationsQuery = `
      SELECT 
        ea.id AS audit_id,
        ea.created_at AS audit_date,
        ar.recommendations,
        ar.estimated_savings
      FROM 
        energy_audits ea
      LEFT JOIN 
        audit_recommendations ar ON ea.id = ar.audit_id
      WHERE 
        ea.user_id = $1
        AND ar.recommendations IS NOT NULL
      ORDER BY 
        ea.created_at DESC
      LIMIT $2
    `;
    
    const recommendationsResult = await pool.query(recommendationsQuery, [userId, limit]);
    
    // Generate sample products from recommendations
    const generatedProducts: any[] = [];
    for (const row of recommendationsResult.rows) {
      const recommendations = Array.isArray(row.recommendations) ? row.recommendations : 
                             (typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : []);
      
      // Generate sample products for each recommendation
      for (const recommendation of recommendations) {
        // Skip if recommendation doesn't have a title or category
        if (!recommendation.title) continue;
        
        // Determine category from recommendation title
        let category = 'Other';
        if (recommendation.title.toLowerCase().includes('hvac') || recommendation.title.toLowerCase().includes('system')) {
          category = 'HVAC';
        } else if (recommendation.title.toLowerCase().includes('fixture') || recommendation.title.toLowerCase().includes('light')) {
          category = 'Lighting';
        } else if (recommendation.title.toLowerCase().includes('insulation') || recommendation.title.toLowerCase().includes('weatherization')) {
          category = 'Insulation';
        } else if (recommendation.title.toLowerCase().includes('appliance')) {
          category = 'Appliances';
        }
        
        // Generate a sample product based on the recommendation
        const estimatedSavings = recommendation.estimated_savings || 
                                (row.estimated_savings ? parseFloat(row.estimated_savings) : 0);
        
        // Generate a reasonable price based on category
        let price = 0;
        switch (category) {
          case 'HVAC':
            price = Math.round(Math.random() * 3000 + 2000); // $2000-$5000
            break;
          case 'Lighting':
            price = Math.round(Math.random() * 200 + 50); // $50-$250
            break;
          case 'Insulation':
            price = Math.round(Math.random() * 1000 + 500); // $500-$1500
            break;
          case 'Appliances':
            price = Math.round(Math.random() * 800 + 400); // $400-$1200
            break;
          default:
            price = Math.round(Math.random() * 500 + 100); // $100-$600
        }
        
        // Calculate ROI and payback period
        const annualSavings = estimatedSavings > 0 ? estimatedSavings : Math.round(price * (Math.random() * 0.2 + 0.1)); // 10-30% of price
        const roi = price > 0 ? annualSavings / price : 0;
        const paybackPeriod = annualSavings > 0 ? price / annualSavings : 0;
        
        // Generate sample features based on category
        const features = [];
        if (category === 'HVAC') {
          features.push('Energy Star Certified');
          features.push('Smart Thermostat Compatible');
          features.push('Quiet Operation');
        } else if (category === 'Lighting') {
          features.push('LED Technology');
          features.push('Dimmable');
          features.push('Long Lifespan');
        } else if (category === 'Insulation') {
          features.push('High R-Value');
          features.push('Moisture Resistant');
          features.push('Fire Resistant');
        } else if (category === 'Appliances') {
          features.push('Energy Star Certified');
          features.push('Smart Home Compatible');
          features.push('Low Water Usage');
        }
        
        // Create a unique ID for the product
        const productId = `sample-${category.toLowerCase()}-${row.audit_id}-${Math.floor(Math.random() * 1000)}`;
        
        generatedProducts.push({
          id: productId,
          name: `Energy Efficient ${recommendation.title}`,
          category,
          price,
          energyEfficiency: 'High',
          features,
          description: `This energy efficient ${category.toLowerCase()} product will help you save on energy costs while improving your home's comfort and efficiency.`,
          annualSavings,
          roi,
          paybackPeriod,
          audit_id: row.audit_id,
          audit_date: row.audit_date,
          isSampleProduct: true // Flag to indicate this is a generated sample
        });
      }
    }
    
    appLogger.info(`Generated ${generatedProducts.length} sample products from ${recommendationsResult.rows.length} audits for user ${userId}`);
    return generatedProducts;
  } catch (error) {
    appLogger.error('Error retrieving product history:', { error, userId });
    throw new Error(`Failed to retrieve product history: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save a product comparison
 * @param userId The user ID
 * @param name Name of the comparison
 * @param products Array of products to compare
 * @returns The saved comparison
 */
export async function saveComparison(userId: string, name: string, products: any[]): Promise<any> {
  try {
    const query = `
      INSERT INTO product_comparisons (user_id, name, products)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, name, JSON.stringify(products)]);
    appLogger.info(`Saved comparison "${name}" for user ${userId} with ${products.length} products`);
    return result.rows[0];
  } catch (error) {
    appLogger.error('Error saving comparison:', { error, userId, name });
    throw new Error(`Failed to save comparison: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get all comparisons for a user
 * @param userId The user ID
 * @returns Array of saved comparisons
 */
export async function getUserComparisons(userId: string): Promise<any[]> {
  try {
    const query = `
      SELECT * FROM product_comparisons
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    appLogger.info(`Retrieved ${result.rows.length} comparisons for user ${userId}`);
    
    // Parse the products JSON for each comparison
    return result.rows.map((row: any) => ({
      ...row,
      products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products
    }));
  } catch (error) {
    appLogger.error('Error retrieving user comparisons:', { error, userId });
    throw new Error(`Failed to retrieve comparisons: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a specific comparison
 * @param userId The user ID
 * @param comparisonId The comparison ID
 * @returns The comparison or null if not found
 */
export async function getComparison(userId: string, comparisonId: string): Promise<any> {
  try {
    const query = `
      SELECT * FROM product_comparisons
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [comparisonId, userId]);
    
    if (result.rows.length === 0) {
      appLogger.info(`Comparison ${comparisonId} not found for user ${userId}`);
      return null;
    }
    
    // Parse the products JSON
    const comparison = result.rows[0];
    return {
      ...comparison,
      products: typeof comparison.products === 'string' ? JSON.parse(comparison.products) : comparison.products
    };
  } catch (error) {
    appLogger.error('Error retrieving comparison:', { error, userId, comparisonId });
    throw new Error(`Failed to retrieve comparison: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete a comparison
 * @param userId The user ID
 * @param comparisonId The comparison ID
 * @returns True if deleted, false if not found
 */
export async function deleteComparison(userId: string, comparisonId: string): Promise<boolean> {
  try {
    const query = `
      DELETE FROM product_comparisons
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [comparisonId, userId]);
    const deleted = result.rowCount > 0;
    
    if (deleted) {
      appLogger.info(`Deleted comparison ${comparisonId} for user ${userId}`);
    } else {
      appLogger.info(`Comparison ${comparisonId} not found for user ${userId}`);
    }
    
    return deleted;
  } catch (error) {
    appLogger.error('Error deleting comparison:', { error, userId, comparisonId });
    throw new Error(`Failed to delete comparison: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate savings difference between products
 * @param products Array of products to compare
 * @returns Object with savings differences
 */
export function calculateSavingsDifference(products: any[]): Record<string, any> {
  if (!products || products.length < 2) {
    return {};
  }
  
  // Sort products by annual savings (highest first)
  const sortedProducts = [...products].sort((a, b) => 
    (b.annualSavings || 0) - (a.annualSavings || 0)
  );
  
  const bestProduct = sortedProducts[0];
  const differences: Record<string, any> = {};
  
  // Calculate differences for each product compared to the best one
  for (let i = 1; i < sortedProducts.length; i++) {
    const product = sortedProducts[i];
    const savingsDifference = (bestProduct.annualSavings || 0) - (product.annualSavings || 0);
    const roiDifference = (bestProduct.roi || 0) - (product.roi || 0);
    const paybackDifference = (product.paybackPeriod || 0) - (bestProduct.paybackPeriod || 0);
    
    differences[product.id] = {
      comparedTo: bestProduct.id,
      savingsDifference,
      roiDifference,
      paybackDifference,
      percentageDifference: bestProduct.annualSavings ? 
        (savingsDifference / bestProduct.annualSavings) * 100 : 0
    };
  }
  
  return differences;
}
