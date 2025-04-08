import express from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import { energyConsumptionService } from '../services/energyConsumption/index.js';
import { appLogger } from '../utils/logger.js';
import { validateToken } from '../middleware/tokenValidation.js';

const router = express.Router();

/**
 * @route POST /api/energy-consumption/records
 * @desc Add a new energy consumption record
 * @access Private
 */
router.post('/records', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to add energy consumption records',
        code: 'AUTH_REQUIRED'
      });
    }

    // Create record with user ID from token
    const record = {
      ...req.body,
      user_id: userId
    };

    // Validate required fields
    if (!record.record_date) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'record_date is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Ensure record_date is a Date object
    record.record_date = new Date(record.record_date);

    const newRecord = await energyConsumptionService.addRecord(record);
    res.status(201).json({ success: true, record: newRecord });
  } catch (error) {
    appLogger.error('Error adding energy consumption record:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to add energy consumption record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/records
 * @desc Get energy consumption records for the current user
 * @access Private
 */
router.get('/records', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to view energy consumption records',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const propertyId = req.query.propertyId as string | undefined;

    const records = await energyConsumptionService.getRecords(userId, startDate, endDate, propertyId);
    res.json({ success: true, records });
  } catch (error) {
    appLogger.error('Error retrieving energy consumption records:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve energy consumption records',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/monthly-summary
 * @desc Get monthly energy consumption summary
 * @access Private
 */
router.get('/monthly-summary', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to view energy consumption summary',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const summary = await energyConsumptionService.getMonthlySummary(userId, startDate, endDate);
    res.json({ success: true, summary });
  } catch (error) {
    appLogger.error('Error retrieving monthly consumption summary:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve monthly consumption summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/yearly-comparison
 * @desc Get yearly energy consumption comparison
 * @access Private
 */
router.get('/yearly-comparison', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to view energy consumption comparison',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const currentYear = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
    const propertyId = req.query.propertyId as string | undefined;

    const comparison = await energyConsumptionService.getYearlyComparison(userId, currentYear, propertyId);
    res.json({ success: true, comparison });
  } catch (error) {
    appLogger.error('Error retrieving yearly consumption comparison:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve yearly consumption comparison',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/energy-consumption/records/:id
 * @desc Update an energy consumption record
 * @access Private
 */
router.put('/records/:id', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to update energy consumption records',
        code: 'AUTH_REQUIRED'
      });
    }

    const recordId = req.params.id;
    const updates = req.body;

    // If record_date is provided, ensure it's a Date object
    if (updates.record_date) {
      updates.record_date = new Date(updates.record_date);
    }

    const updatedRecord = await energyConsumptionService.updateRecord(recordId, userId, updates);
    res.json({ success: true, record: updatedRecord });
  } catch (error) {
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Record not found') || error.message.includes('user does not have permission')) {
        return res.status(404).json({
          success: false,
          error: 'Record not found',
          details: 'The specified record does not exist or you do not have permission to update it'
        });
      } else if (error.message.includes('No valid fields to update')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid update data',
          details: 'No valid fields to update were provided'
        });
      }
    }

    // Generic error handling
    appLogger.error('Error updating energy consumption record:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update energy consumption record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route DELETE /api/energy-consumption/records/:id
 * @desc Delete an energy consumption record
 * @access Private
 */
router.delete('/records/:id', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to delete energy consumption records',
        code: 'AUTH_REQUIRED'
      });
    }

    const recordId = req.params.id;
    const deleted = await energyConsumptionService.deleteRecord(recordId, userId);

    if (deleted) {
      res.json({ success: true, message: 'Record deleted successfully' });
    } else {
      res.status(404).json({
        success: false,
        error: 'Record not found',
        details: 'The specified record does not exist or you do not have permission to delete it'
      });
    }
  } catch (error) {
    appLogger.error('Error deleting energy consumption record:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete energy consumption record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/analysis
 * @desc Get energy consumption analysis
 * @access Private
 */
/**
 * @route GET /api/energy-consumption/forecast
 * @desc Get forecast for future energy consumption
 * @access Private
 */
router.get('/forecast', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to view energy consumption forecasts',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 12;
    const propertyId = req.query.propertyId as string | undefined;

    try {
      const forecast = await energyConsumptionService.forecastConsumption(userId, months, propertyId);
      res.json({ success: true, forecast });
    } catch (forecastError) {
      if (forecastError instanceof Error && forecastError.message.includes('Insufficient data')) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient data',
          details: 'Not enough energy consumption data to generate forecast',
          code: 'INSUFFICIENT_DATA'
        });
      }
      throw forecastError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    appLogger.error('Error generating energy consumption forecast:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to generate energy consumption forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/patterns
 * @desc Identify patterns in energy consumption data
 * @access Private
 */
router.get('/patterns', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to view energy consumption patterns',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const propertyId = req.query.propertyId as string | undefined;

    try {
      const patterns = await energyConsumptionService.identifyPatterns(
        userId,
        startDate && endDate ? { start: startDate, end: endDate } : undefined,
        propertyId
      );
      res.json({ success: true, patterns });
    } catch (patternsError) {
      if (patternsError instanceof Error && patternsError.message.includes('Insufficient data')) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient data',
          details: 'Not enough energy consumption data to identify patterns',
          code: 'INSUFFICIENT_DATA'
        });
      }
      throw patternsError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    appLogger.error('Error identifying energy consumption patterns:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to identify energy consumption patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/baseline
 * @desc Calculate baseline consumption for a user
 * @access Private
 */
router.get('/baseline', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to calculate baseline consumption',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Parse property details for normalization
    const propertyDetails: any = {};
    
    if (req.query.squareFootage) {
      propertyDetails.squareFootage = parseFloat(req.query.squareFootage as string);
    }
    
    if (req.query.occupants) {
      propertyDetails.occupants = parseInt(req.query.occupants as string, 10);
    }
    
    if (req.query.propertyType) {
      propertyDetails.propertyType = req.query.propertyType as string;
    }

    try {
      const baseline = await energyConsumptionService.calculateBaseline(
        userId,
        Object.keys(propertyDetails).length > 0 ? propertyDetails : undefined,
        startDate && endDate ? { start: startDate, end: endDate } : undefined
      );
      res.json({ success: true, baseline });
    } catch (baselineError) {
      if (baselineError instanceof Error && baselineError.message.includes('Insufficient data')) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient data',
          details: 'Not enough energy consumption data to calculate baseline',
          code: 'INSUFFICIENT_DATA'
        });
      }
      throw baselineError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    appLogger.error('Error calculating baseline consumption:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate baseline consumption',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/anomalies
 * @desc Detect anomalies in energy consumption data
 * @access Private
 */
router.get('/anomalies', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to detect consumption anomalies',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear() - 1, 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : 2.0;
    const propertyId = req.query.propertyId as string | undefined;

    try {
      const anomalies = await energyConsumptionService.detectConsumptionAnomalies(
        userId, 
        { start: startDate, end: endDate },
        threshold,
        propertyId
      );
      res.json({ success: true, anomalies });
    } catch (anomaliesError) {
      if (anomaliesError instanceof Error && anomaliesError.message.includes('Insufficient data')) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient data',
          details: 'Not enough energy consumption data to detect anomalies',
          code: 'INSUFFICIENT_DATA'
        });
      }
      throw anomaliesError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    appLogger.error('Error detecting consumption anomalies:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to detect consumption anomalies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/cost-projections
 * @desc Calculate cost projections for different efficiency scenarios
 * @access Private
 */
router.get('/cost-projections', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to view cost projections',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const years = req.query.years ? parseInt(req.query.years as string, 10) : 5;
    const propertyId = req.query.propertyId as string | undefined;
    
    // Parse efficiency improvements if provided
    let efficiencyImprovements: number[] | undefined;
    if (req.query.improvements) {
      try {
        efficiencyImprovements = JSON.parse(req.query.improvements as string);
        // Validate that it's an array of numbers
        if (!Array.isArray(efficiencyImprovements) || 
            !efficiencyImprovements.every(imp => typeof imp === 'number')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid parameters',
            details: 'Improvements must be an array of numbers',
            code: 'VALIDATION_ERROR'
          });
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: 'Could not parse improvements parameter',
          code: 'VALIDATION_ERROR'
        });
      }
    }

    try {
      const projections = await energyConsumptionService.calculateCostProjections(
        userId,
        years,
        efficiencyImprovements,
        propertyId
      );
      res.json({ success: true, projections });
    } catch (projectionError) {
      if (projectionError instanceof Error && projectionError.message.includes('Insufficient data')) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient data',
          details: 'Not enough energy consumption data to calculate cost projections',
          code: 'INSUFFICIENT_DATA'
        });
      }
      throw projectionError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    appLogger.error('Error calculating cost projections:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cost projections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/energy-consumption/analysis
 * @desc Get energy consumption analysis
 * @access Private
 */
router.get('/analysis', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to view energy consumption analysis',
        code: 'AUTH_REQUIRED'
      });
    }

    // Parse query parameters
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
    const propertyId = req.query.propertyId as string | undefined;

    try {
      const analysis = await energyConsumptionService.analyzeConsumption(userId, year, propertyId);
      res.json({ success: true, analysis });
    } catch (analysisError) {
      if (analysisError instanceof Error && analysisError.message.includes('Insufficient data')) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient data',
          details: 'Not enough energy consumption data to perform analysis',
          code: 'INSUFFICIENT_DATA'
        });
      }
      throw analysisError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    appLogger.error('Error performing energy consumption analysis:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to perform energy consumption analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
