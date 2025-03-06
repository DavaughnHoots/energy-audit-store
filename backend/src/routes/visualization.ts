import express from 'express';
import { visualizationService, VisualizationType } from '../services/visualizationService.js';
import { extendedCalculationService } from '../services/extendedCalculationService.js';
import { appLogger } from '../utils/logger.js';
import { validateToken } from '../middleware/tokenValidation.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { Pool } from 'pg';
import { dbConfig } from '../config/database.js';
import { EnergyAuditService } from '../services/EnergyAuditService.js';

// Create a database pool
const pool = new Pool(dbConfig);

// Create an instance of the EnergyAuditService
const energyAuditService = new EnergyAuditService(pool);

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
    const visualizations = await visualizationService.getVisualizationsByAuditId(auditId);
    
    return res.status(200).json(visualizations);
  } catch (error) {
    appLogger.error('Error getting visualization data', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/visualization/id/:id
 * @description Get visualization data by ID
 * @access Private
 */
router.get('/id/:id', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({ message: 'Visualization ID is required' });
    }
    
    // Get visualization data
    const visualization = await visualizationService.getVisualizationById(id);
    
    if (!visualization) {
      return res.status(404).json({ message: 'Visualization data not found' });
    }
    
    return res.status(200).json(visualization);
  } catch (error) {
    appLogger.error('Error getting visualization by ID', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/visualization/:auditId/:type
 * @description Get visualization data of a specific type for an audit
 * @access Private
 */
router.get('/:auditId/type/:type', validateToken, async (req, res) => {
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
    if (!Object.values(VisualizationType).includes(type as VisualizationType)) {
      return res.status(400).json({ message: 'Invalid visualization type' });
    }
    
    // Get all visualizations for the audit
    const visualizations = await visualizationService.getVisualizationsByAuditId(auditId);
    
    // Filter by type
    const filteredVisualizations = visualizations.filter(v => v.visualizationType === type);
    
    if (filteredVisualizations.length === 0) {
      return res.status(404).json({ message: 'Visualization data not found' });
    }
    
    return res.status(200).json(filteredVisualizations[0]);
  } catch (error) {
    appLogger.error('Error getting visualization data by type', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/visualization/:auditId/generate
 * @description Generate visualizations from audit data
 * @access Private
 */
router.post('/:auditId/generate', validateToken, async (req, res) => {
  try {
    const { auditId } = req.params;
    const { types } = req.body;
    
    // Validate parameters
    if (!auditId) {
      return res.status(400).json({ message: 'Audit ID is required' });
    }
    
    // Get audit data
    const auditData = await energyAuditService.getAuditById(auditId);
    
    if (!auditData) {
      return res.status(404).json({ message: 'Audit not found' });
    }
    
    // Determine which visualization types to generate
    let visualizationTypes = Object.values(VisualizationType);
    if (types && Array.isArray(types) && types.length > 0) {
      visualizationTypes = types.filter(type => 
        Object.values(VisualizationType).includes(type as VisualizationType)
      ) as VisualizationType[];
    }
    
    // Generate visualizations
    const results = [];
    for (const type of visualizationTypes) {
      const visualization = await visualizationService.generateVisualization(
        auditId,
        auditData,
        type as VisualizationType
      );
      results.push(visualization);
    }
    
    return res.status(201).json({
      message: 'Visualizations generated successfully',
      visualizations: results
    });
  } catch (error) {
    appLogger.error('Error generating visualizations', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/visualization/:id/image
 * @description Get visualization as an image
 * @access Private
 */
router.get('/:id/image', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { width, height } = req.query;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({ message: 'Visualization ID is required' });
    }
    
    // Get visualization data
    const visualization = await visualizationService.getVisualizationById(id);
    
    if (!visualization) {
      return res.status(404).json({ message: 'Visualization data not found' });
    }
    
    // Generate chart image
    const chartImage = await visualizationService.generateChartImage(
      visualization,
      width ? parseInt(width as string) : undefined,
      height ? parseInt(height as string) : undefined
    );
    
    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', chartImage.length);
    
    // Send image
    return res.send(chartImage);
  } catch (error) {
    appLogger.error('Error generating chart image', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
