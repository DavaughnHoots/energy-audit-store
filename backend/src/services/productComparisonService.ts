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
    appLogger.info(`Attempting to retrieve product history for user ${userId}`);
    
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
    
    appLogger.debug(`Executing products query for user ${userId}`);
    const productsResult = await pool.query(productsQuery, [userId, limit]);
    appLogger.debug(`Products query returned ${productsResult.rows.length} rows`);
    
    // Process and flatten the products
    const productHistory: any[] = [];
    for (const row of productsResult.rows) {
      try {
        let auditProducts = [];
        
        if (Array.isArray(row.products)) {
          auditProducts = row.products;
        } else if (typeof row.products === 'string') {
          try {
            auditProducts = JSON.parse(row.products);
          } catch (parseError) {
            appLogger.warn(`Failed to parse products JSON for audit ${row.audit_id}:`, { parseError });
            auditProducts = [];
          }
        }
        
        if (Array.isArray(auditProducts)) {
          for (const product of auditProducts) {
            if (product && typeof product === 'object') {
              productHistory.push({
                ...product,
                audit_id: row.audit_id,
                audit_date: row.audit_date
              });
            }
          }
        }
      } catch (rowError) {
        appLogger.warn(`Error processing product row for audit ${row.audit_id}:`, { rowError });
        // Continue to next row
      }
    }
    
    // If we found specific products, return them
    if (productHistory.length > 0) {
      appLogger.info(`Retrieved ${productHistory.length} products from ${productsResult.rows.length} audits for user ${userId}`);
      return productHistory;
    }
    
    appLogger.info(`No specific products found for user ${userId}, generating from recommendations`);
    
    // If no specific products found, get general recommendations and generate sample products
    const recommendationsQuery = `
      SELECT 
        ea.id AS audit_id,
        ea.created_at AS audit_date,
        ar.title,
        ar.description,
        ar.category,
        ar.priority,
        ar.estimated_savings,
        ar.estimated_cost,
        ar.payback_period,
        ar.products
      FROM 
        energy_audits ea
      LEFT JOIN 
        audit_recommendations ar ON ea.id = ar.audit_id
      WHERE 
        ea.user_id = $1
      ORDER BY 
        ea.created_at DESC
      LIMIT $2
    `;
    
    appLogger.debug(`Executing recommendations query for user ${userId}`);
    const recommendationsResult = await pool.query(recommendationsQuery, [userId, limit]);
    appLogger.debug(`Recommendations query returned ${recommendationsResult.rows.length} rows`);
    
    // Generate sample products from recommendations
    const generatedProducts: any[] = [];
    
    // Log the structure of the first recommendation for debugging
    if (recommendationsResult.rows.length > 0) {
      const firstRow = recommendationsResult.rows[0];
      appLogger.debug('First recommendation row structure:', {
        audit_id: firstRow.audit_id,
        title: firstRow.title,
        category: firstRow.category,
        priority: firstRow.priority,
        estimated_savings_type: typeof firstRow.estimated_savings,
        estimated_savings_value: firstRow.estimated_savings,
        products_type: typeof firstRow.products,
        products_is_null: firstRow.products === null
      });
    }
    
    for (const row of recommendationsResult.rows) {
      try {
        // First check if this recommendation already has products
        let existingProducts = [];
        if (row.products) {
          if (Array.isArray(row.products)) {
            existingProducts = row.products;
          } else if (typeof row.products === 'string') {
            try {
              existingProducts = JSON.parse(row.products);
            } catch (parseError) {
              appLogger.warn(`Failed to parse products JSON for audit ${row.audit_id}:`, { parseError });
              existingProducts = [];
            }
          } else if (typeof row.products === 'object') {
            existingProducts = [row.products];
          }
        }
        
        // If we have existing products, use them
        if (Array.isArray(existingProducts) && existingProducts.length > 0) {
          for (const product of existingProducts) {
            if (product && typeof product === 'object') {
              generatedProducts.push({
                ...product,
                audit_id: row.audit_id,
                audit_date: row.audit_date
              });
            }
          }
          continue; // Skip to next recommendation if we found products
        }
        
        // Otherwise, generate a sample product based on the recommendation
        try {
          // Get title and category from the recommendation
          const title = row.title || 'Energy Upgrade';
          const recommendationCategory = row.category || 'Other';
          
          // Determine product category based on recommendation category or title
          let category = recommendationCategory;
          if (category === 'Other' || !category) {
            // Try to determine category from title
            const titleLower = title.toLowerCase();
            if (titleLower.includes('hvac') || titleLower.includes('system')) {
              category = 'HVAC';
            } else if (titleLower.includes('fixture') || titleLower.includes('light')) {
              category = 'Lighting';
            } else if (titleLower.includes('insulation') || titleLower.includes('weatherization')) {
              category = 'Insulation';
            } else if (titleLower.includes('window')) {
              category = 'Windows';
            } else if (titleLower.includes('appliance')) {
              category = 'Appliances';
            }
          }
            
          // Get estimated savings from the recommendation
          let estimatedSavings = 0;
          if (row.estimated_savings !== undefined && row.estimated_savings !== null) {
            estimatedSavings = parseFloat(row.estimated_savings) || 0;
          }
            
          // Get estimated cost and payback period if available
          let estimatedCost = 0;
          if (row.estimated_cost !== undefined && row.estimated_cost !== null) {
            estimatedCost = parseFloat(row.estimated_cost) || 0;
          }
          
          let paybackPeriod = 0;
          if (row.payback_period !== undefined && row.payback_period !== null) {
            paybackPeriod = parseFloat(row.payback_period) || 0;
          }
          
          // Generate a reasonable price based on category if estimated cost is not available
          let price = estimatedCost;
          if (price <= 0) {
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
              case 'Windows':
                price = Math.round(Math.random() * 2000 + 1000); // $1000-$3000
                break;
              case 'Appliances':
                price = Math.round(Math.random() * 800 + 400); // $400-$1200
                break;
              default:
                price = Math.round(Math.random() * 500 + 100); // $100-$600
            }
          }
          
          // Calculate ROI and payback period if not provided
          const annualSavings = estimatedSavings > 0 ? estimatedSavings : Math.round(price * (Math.random() * 0.2 + 0.1)); // 10-30% of price
          const roi = price > 0 ? annualSavings / price : 0;
          const calculatedPaybackPeriod = paybackPeriod > 0 ? paybackPeriod : (annualSavings > 0 ? price / annualSavings : 0);
            
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
          } else if (category === 'Windows') {
            features.push('Double Pane');
            features.push('Low-E Coating');
            features.push('Argon Gas Filled');
          } else if (category === 'Appliances') {
            features.push('Energy Star Certified');
            features.push('Smart Home Compatible');
            features.push('Low Water Usage');
          }
          
          // Create a unique ID for the product
          const productId = `sample-${category.toLowerCase()}-${row.audit_id}-${Math.floor(Math.random() * 1000)}`;
          
          // Get description from the recommendation or generate one
          const description = row.description || 
            `This energy efficient ${category.toLowerCase()} product will help you save on energy costs while improving your home's comfort and efficiency.`;
          
          generatedProducts.push({
            id: productId,
            name: `Energy Efficient ${title}`,
            category,
            price,
            energyEfficiency: 'High',
            features,
            description,
            annualSavings,
            roi,
            paybackPeriod: calculatedPaybackPeriod,
            audit_id: row.audit_id,
            audit_date: row.audit_date,
            priority: row.priority || 'medium',
            isSampleProduct: true // Flag to indicate this is a generated sample
          });
        } catch (recError) {
          appLogger.warn(`Error processing recommendation for audit ${row.audit_id}:`, { recError });
          // Continue to next recommendation
        }
      } catch (rowError) {
        appLogger.warn(`Error processing recommendation row for audit ${row.audit_id}:`, { rowError });
        // Continue to next row
      }
    }
    
    // If we couldn't generate any products, create a default one
    if (generatedProducts.length === 0) {
      appLogger.info(`No recommendations found for user ${userId}, generating default product`);
      
      const defaultProduct = {
        id: `sample-default-${Math.floor(Math.random() * 1000)}`,
        name: 'Energy Efficient HVAC System',
        category: 'HVAC',
        price: 3500,
        energyEfficiency: 'High',
        features: ['Energy Star Certified', 'Smart Thermostat Compatible', 'Quiet Operation'],
        description: 'This energy efficient HVAC system will help you save on energy costs while improving your home\'s comfort and efficiency.',
        annualSavings: 500,
        roi: 0.14,
        paybackPeriod: 7,
        isSampleProduct: true
      };
      
      generatedProducts.push(defaultProduct);
    }
    
    appLogger.info(`Generated ${generatedProducts.length} sample products from ${recommendationsResult.rows.length} audits for user ${userId}`);
    return generatedProducts;
  } catch (error) {
    // Log the full error details
    appLogger.error('Error retrieving product history:', { 
      error, 
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId 
    });
    
    // Return an empty array instead of throwing an error
    // This prevents the 500 error and allows the UI to display gracefully
    return [];
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
