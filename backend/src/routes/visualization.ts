import express from 'express';
import { visualizationService } from '../services/visualizationService.js';
import { extendedCalculationService } from '../services/extendedCalculationService.js';
import { appLogger } from '../utils/logger.js';
import { validateToken } from '../middleware/tokenValidation.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';

const router = express.Router();

/**
 * @route GET /api/visualization/:auditId
 * @description Get all visualization data for an audit
 * @access Private
 */
router.get('/:auditId', validateToken, async (req, res) => {
  try {
    const { auditId } = req.params;
    
    // Validate audit ID
    if (!auditId) {
      return res.status(400).json({ message: 'Audit ID is required' });
    }
    
    // Get visualization data
    const visualizations = await visualizationService.getVisualizationData(auditId);
    
    return res.status(200).json(visualizations);
  } catch (error) {
    appLogger.error('Error getting visualization data', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/visualization/:auditId/:type
 * @description Get visualization data of a specific type for an audit
 * @access Private
 */
router.get('/:auditId/:type', validateToken, async (req, res) => {
  try {
    const { auditId, type } = req.params;
    
    // Validate parameters
    if (!auditId) {
      return res.status(400).json({ message: 'Audit ID is required' });
    }
    
    if (!type) {
      return res.status(400).json({ message: 'Visualization type is required' });
    }
    
    // Validate visualization type
    const validTypes = ['energy', 'hvac', 'lighting', 'humidity', 'savings'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid visualization type' });
    }
    
    // Get visualization data
    const visualizations = await visualizationService.getVisualizationData(auditId, type);
    
    if (visualizations.length === 0) {
      return res.status(404).json({ message: 'Visualization data not found' });
    }
    
    return res.status(200).json(visualizations[0]);
  } catch (error) {
    appLogger.error('Error getting visualization data', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/visualization/:auditId/generate
 * @description Generate visualizations from audit results
 * @access Private
 */
router.post('/:auditId/generate', validateToken, async (req, res) => {
  try {
    const { auditId } = req.params;
    const { auditData } = req.body;
    
    // Validate parameters
    if (!auditId) {
      return res.status(400).json({ message: 'Audit ID is required' });
    }
    
    if (!auditData) {
      return res.status(400).json({ message: 'Audit data is required' });
    }
    
    // Perform comprehensive analysis
    const auditResults = extendedCalculationService.performComprehensiveAnalysis(auditData);
    
    // Generate visualizations
    const visualizationIds = await visualizationService.generateVisualizations(auditId, auditResults);
    
    return res.status(201).json({
      message: 'Visualizations generated successfully',
      visualizationIds,
      auditResults
    });
  } catch (error) {
    appLogger.error('Error generating visualizations', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/visualization/:auditId/:type
 * @description Save visualization data
 * @access Private
 */
router.post('/:auditId/:type', validateToken, async (req, res) => {
  try {
    const { auditId, type } = req.params;
    const visualizationData = req.body;
    
    // Validate parameters
    if (!auditId) {
      return res.status(400).json({ message: 'Audit ID is required' });
    }
    
    if (!type) {
      return res.status(400).json({ message: 'Visualization type is required' });
    }
    
    // Validate visualization type
    const validTypes = ['energy', 'hvac', 'lighting', 'humidity', 'savings'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid visualization type' });
    }
    
    if (!visualizationData) {
      return res.status(400).json({ message: 'Visualization data is required' });
    }
    
    // Save visualization data
    const id = await visualizationService.saveVisualizationData(auditId, type, visualizationData);
    
    return res.status(201).json({
      message: 'Visualization data saved successfully',
      id
    });
  } catch (error) {
    appLogger.error('Error saving visualization data', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/visualization/:id
 * @description Delete visualization data
 * @access Private
 */
router.delete('/:id', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({ message: 'Visualization ID is required' });
    }
    
    // Delete visualization data
    const deleted = await visualizationService.deleteVisualizationData(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Visualization data not found' });
    }
    
    return res.status(200).json({ message: 'Visualization data deleted successfully' });
  } catch (error) {
    appLogger.error('Error deleting visualization data', { error });
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
