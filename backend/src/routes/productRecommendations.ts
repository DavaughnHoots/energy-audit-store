import express from 'express';
import { productRecommendationService } from '../services/productRecommendationService.js';
import { appLogger } from '../utils/logger.js';
import { validateToken } from '../middleware/tokenValidation.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { productDetailLimiter, productSearchLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/recommendations/products
 * @desc Get product recommendations based on audit ID
 * @access Private
 */
router.get('/products', validateToken, productSearchLimiter, async (req, res) => {
  try {
    const { auditId } = req.query;
    
    if (!auditId) {
      return res.status(400).json({ message: 'Audit ID is required' });
    }
    
    // Get product preferences from database
    const auditQuery = await req.app.locals.pool.query(
      'SELECT product_preferences FROM energy_audits WHERE id = $1',
      [auditId]
    );
    
    if (auditQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Audit not found' });
    }
    
    const productPreferences = auditQuery.rows[0].product_preferences;
    
    // Check if audit has product preferences
    if (!productPreferences) {
      return res.status(400).json({ 
        message: 'Audit does not have product preferences',
        recommendations: {}
      });
    }
    
    // Get recommendations based on preferences
    const recommendations = await productRecommendationService.recommendProducts(
      productPreferences
    );
    
    // Calculate potential savings for each category
    const savingsByCategory: Record<string, number> = {};
    
    for (const [category, products] of Object.entries(recommendations)) {
      savingsByCategory[category] = productRecommendationService.calculateProductSavings(products);
    }
    
    return res.json({
      recommendations,
      savingsByCategory,
      totalSavings: Object.values(savingsByCategory).reduce((sum, val) => sum + val, 0)
    });
  } catch (error) {
    appLogger.error('Error getting product recommendations', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/recommendations/products/categories
 * @desc Get available product categories
 * @access Public
 */
router.get('/products/categories', optionalTokenValidation, productSearchLimiter, async (req, res) => {
  try {
    // Ensure product database is loaded
    if (!productRecommendationService.isDatabaseLoaded()) {
      await productRecommendationService.loadProductDatabase();
    }
    
    // Get categories from database
    const categoriesQuery = await req.app.locals.pool.query(
      'SELECT DISTINCT main_category AS "mainCategory" FROM products WHERE active = true'
    );
    
    const categories = categoriesQuery.rows.map((row: { mainCategory: string }) => row.mainCategory);
    
    return res.json({ categories });
  } catch (error) {
    appLogger.error('Error getting product categories', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/recommendations/products/features
 * @desc Get available product features
 * @access Public
 */
router.get('/products/features', optionalTokenValidation, productSearchLimiter, async (req, res) => {
  try {
    // Get features from database
    const featuresQuery = await req.app.locals.pool.query(`
      SELECT DISTINCT unnest(string_to_array(features, ',')) AS feature
      FROM products
      WHERE active = true AND features IS NOT NULL
    `);
    
    const features = featuresQuery.rows
      .map((row: { feature: string }) => row.feature.trim())
      .filter((feature: string) => feature.length > 0);
    
    return res.json({ features });
  } catch (error) {
    appLogger.error('Error getting product features', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/recommendations/products/category/:category
 * @desc Get statistics for a specific product category
 * @access Public
 */
router.get('/products/category/:category', optionalTokenValidation, productSearchLimiter, async (req, res) => {
  try {
    const { category } = req.params;
    
    // Ensure product database is loaded
    if (!productRecommendationService.isDatabaseLoaded()) {
      await productRecommendationService.loadProductDatabase();
    }
    
    const stats = productRecommendationService.getCategoryStats(category);
    
    if (!stats) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    return res.json(stats);
  } catch (error) {
    appLogger.error('Error getting category stats', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/recommendations/products/:id
 * @desc Get detailed information for a specific product
 * @access Private
 */
router.get('/products/:id', validateToken, productDetailLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }
    
    const userId = req.user.id;
    
    // This method will be implemented in the service
    const productDetails = await productRecommendationService.getDetailedProductInfo(id, userId);
    
    if (!productDetails) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    res.json({
      success: true,
      product: productDetails
    });
  } catch (error) {
    appLogger.error('Error fetching detailed product info:', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.id || 'unknown',
      productId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching product details'
    });
  }
});

export default router;
