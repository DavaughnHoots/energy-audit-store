import express from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import { energyConsumptionService } from '../services/energyConsumptionService.js';
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
