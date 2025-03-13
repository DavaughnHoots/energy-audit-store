import express from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import { dashboardService } from '../services/dashboardService.js';
import * as productComparisonService from '../services/productComparisonService.js';
import { pool } from '../config/database.js';
import { appLogger } from '../config/logger.js';
import { createLogMetadata } from '../utils/logger.js';

const router = express.Router();

router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to access your dashboard statistics',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Check if a specific audit ID is requested
    const newAuditId = req.query.newAudit as string | undefined;

    // Check if user has completed initial setup
    const userSetupResult = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM user_settings
         WHERE user_id = $1
         AND property_details IS NOT NULL
       ) as has_setup`,
      [userId]
    );

    if (!userSetupResult.rows[0].has_setup) {
      return res.status(403).json({
        error: 'Setup required',
        details: 'Please complete your property setup to view dashboard statistics',
        code: 'SETUP_REQUIRED',
        setupUrl: '/settings/property'
      });
    }

    // Get dashboard stats, passing the newAuditId if provided
    const stats = await dashboardService.getUserStats(userId, newAuditId);

    // Add last updated timestamp
    const response = {
      ...stats,
      lastUpdated: new Date().toISOString(),
      refreshInterval: 300000 // 5 minutes in milliseconds
    };

    // Log the response for debugging
    appLogger.debug('Dashboard response:', {
      userId,
      hasLatestAuditId: !!response.latestAuditId,
      completedAudits: response.completedAudits,
      context: 'dashboard.stats'
    });

    res.json(response);

  } catch (error) {
    const isOperationalError = error instanceof Error &&
      error.message.includes('Failed to fetch dashboard statistics');

    if (isOperationalError) {
      res.status(500).json({
        error: 'Service temporarily unavailable',
        details: 'Unable to retrieve dashboard statistics. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
        retryAfter: 60 // seconds
      });
    } else {
      // Unexpected errors
      appLogger.error('Unexpected dashboard error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred. Our team has been notified.',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
 * @route GET /api/dashboard/product-history
 * @desc Get product history from past audits
 * @access Private
 */
router.get('/product-history', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to access your product history',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Get limit from query params, default to 20
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    
    // Get product history
    const productHistory = await productComparisonService.getProductHistory(userId, limit);
    
    res.json({ success: true, productHistory });
  } catch (error) {
    appLogger.error('Error fetching product history:', createLogMetadata(req, { error }));
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch product history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
