import express from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import * as productComparisonService from '../services/productComparisonService.js';
import { appLogger } from '../utils/logger.js';
import { createLogMetadata } from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/comparisons
 * @desc Save a product comparison
 * @access Private
 */
router.post('/', validateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, products } = req.body;
    
    // Validate input
    if (!name || !products || !Array.isArray(products) || products.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid comparison data. Name and at least 2 products are required.' 
      });
    }
    
    // Save comparison
    const comparison = await productComparisonService.saveComparison(userId, name, products);
    
    res.json({ success: true, comparison });
  } catch (error) {
    appLogger.error('Error saving comparison:', createLogMetadata(req, { error }));
    res.status(500).json({ success: false, error: 'Failed to save comparison' });
  }
});

/**
 * @route GET /api/comparisons
 * @desc Get all comparisons for a user
 * @access Private
 */
router.get('/', validateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all comparisons for the user
    const comparisons = await productComparisonService.getUserComparisons(userId);
    
    res.json({ success: true, comparisons });
  } catch (error) {
    appLogger.error('Error fetching comparisons:', createLogMetadata(req, { error }));
    res.status(500).json({ success: false, error: 'Failed to fetch comparisons' });
  }
});

/**
 * @route GET /api/comparisons/:id
 * @desc Get a specific comparison
 * @access Private
 */
router.get('/:id', validateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const comparisonId = req.params.id;
    
    // Get specific comparison
    const comparison = await productComparisonService.getComparison(userId, comparisonId);
    
    if (!comparison) {
      return res.status(404).json({ success: false, error: 'Comparison not found' });
    }
    
    res.json({ success: true, comparison });
  } catch (error) {
    appLogger.error('Error fetching comparison:', createLogMetadata(req, { error }));
    res.status(500).json({ success: false, error: 'Failed to fetch comparison' });
  }
});

/**
 * @route DELETE /api/comparisons/:id
 * @desc Delete a comparison
 * @access Private
 */
router.delete('/:id', validateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const comparisonId = req.params.id;
    
    // Delete comparison
    const deleted = await productComparisonService.deleteComparison(userId, comparisonId);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Comparison not found' });
    }
    
    res.json({ success: true, message: 'Comparison deleted successfully' });
  } catch (error) {
    appLogger.error('Error deleting comparison:', createLogMetadata(req, { error }));
    res.status(500).json({ success: false, error: 'Failed to delete comparison' });
  }
});

/**
 * @route POST /api/comparisons/analyze
 * @desc Analyze products and calculate savings differences
 * @access Private
 */
router.post('/analyze', validateToken, async (req, res) => {
  try {
    const { products } = req.body;
    
    // Validate input
    if (!products || !Array.isArray(products) || products.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid data. At least 2 products are required for analysis.' 
      });
    }
    
    // Calculate savings differences
    const analysis = productComparisonService.calculateSavingsDifference(products);
    
    res.json({ 
      success: true, 
      analysis,
      bestProduct: products.length > 0 ? 
        products.reduce((best, current) => 
          (current.annualSavings || 0) > (best.annualSavings || 0) ? current : best, 
          products[0]
        ) : null
    });
  } catch (error) {
    appLogger.error('Error analyzing products:', createLogMetadata(req, { error }));
    res.status(500).json({ success: false, error: 'Failed to analyze products' });
  }
});

export default router;
