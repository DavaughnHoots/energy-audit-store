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
    
    appLogger.info(`Fetching product history for user ${userId} with limit ${limit}`);
    
    try {
      // Get product history - this now returns an empty array on error instead of throwing
      const productHistory = await productComparisonService.getProductHistory(userId, limit);
      
      // Always return success with the product history (which may be empty)
      res.json({ success: true, productHistory });
    } catch (serviceError) {
      // This shouldn't happen anymore since getProductHistory handles errors internally,
      // but just in case, we'll handle it here too
      appLogger.error('Unexpected error from productComparisonService:', createLogMetadata(req, { serviceError }));
      
      // Return an empty array instead of an error
      res.json({ 
        success: true, 
        productHistory: [],
        warning: 'Could not retrieve product history, showing empty list instead'
      });
    }
  } catch (error) {
    appLogger.error('Error in product history endpoint:', createLogMetadata(req, { 
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    }));
    
    // Return an empty array instead of an error
    res.json({ 
      success: true, 
      productHistory: [],
      warning: 'Could not retrieve product history, showing empty list instead'
    });
  }
});

/**
 * @route GET /api/dashboard/audit-stats/:auditId
 * @desc Get dashboard statistics for a specific audit ID
 * @access Private
 */
router.get('/audit-stats/:auditId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please sign in to access your dashboard statistics',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const auditId = req.params.auditId;
    if (!auditId) {
      return res.status(400).json({
        error: 'Bad request',
        details: 'Audit ID is required',
        code: 'MISSING_AUDIT_ID'
      });
    }
    
    appLogger.info(`Fetching specific audit stats for user ${userId} and audit ${auditId}`, createLogMetadata(req, {
      auditId,
      userId
    }));
    
    // Verify the audit belongs to the user or is public
    const auditResult = await pool.query(
      `SELECT user_id FROM energy_audits WHERE id = $1`,
      [auditId]
    );
    
    if (auditResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Audit not found',
        details: 'The requested audit does not exist',
        code: 'AUDIT_NOT_FOUND'
      });
    }
    
    if (auditResult.rows[0].user_id && auditResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'You do not have permission to access this audit',
        code: 'ACCESS_DENIED'
      });
    }
    
    // Get dashboard stats for this specific audit
    const stats = await dashboardService.getUserStats(userId, auditId);
    
    // Add last updated timestamp
    const response = {
      ...stats,
      lastUpdated: new Date().toISOString(),
      refreshInterval: 300000, // 5 minutes in milliseconds
      specificAuditId: auditId // Include the audit ID for reference
    };
    
    res.json(response);
    
  } catch (error) {
    appLogger.error('Error fetching specific audit stats:', createLogMetadata(req, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }));
    
    res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while fetching audit statistics',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
