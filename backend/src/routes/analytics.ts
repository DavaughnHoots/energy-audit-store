// backend/src/routes/analytics.ts

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/security.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { pool } from '../config/database.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

const router = express.Router();
const analyticsService = new AnalyticsService(pool);

/**
 * @route POST /api/analytics/event
 * @desc Track an analytics event
 * @access Public (handles both authenticated and anonymous users)
 */
router.post('/event',
  optionalTokenValidation,
  async (req, res) => {
    try {
      const { eventType, area, data, sessionId } = req.body;
      
      // Log the event tracking request
      appLogger.debug('Analytics event tracking request:', createLogMetadata(req, {
        eventType,
        area,
        hasSessionId: !!sessionId
      }));

      if (!eventType || !area || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields: eventType, area, sessionId' });
      }

      // Get user ID if authenticated
      const userId = req.user?.id;

      try {
        // Direct database write - don't rely on session updating
        await analyticsService.trackEvent(sessionId, eventType, area, data || {});
        
        // Return success response immediately
        return res.status(200).json({ success: true });
      } catch (dbError) {
        // Log database error but don't expose details to client
        appLogger.error('Database error in analytics event tracking:', createLogMetadata(req, {
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          stack: dbError instanceof Error ? dbError.stack : undefined,
          eventType,
          area
        }));
        
        // Return a generic error to the client
        return res.status(500).json({ error: 'Could not process analytics event', success: false });
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      appLogger.error('Failed to track analytics event:', createLogMetadata(req, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }));
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get dashboard analytics data
 * @access Private (Admin)
 */
router.get('/dashboard',
  authenticate,
  requireRole(['admin']),
  rateLimiter,
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe as string || 'month';
      const metrics = await analyticsService.getPlatformMetrics(timeframe);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route GET /api/analytics/user/:userId
 * @desc Get user-specific analytics
 * @access Private (Admin or User's own data)
 */
router.get('/user/:userId',
  authenticate,
  async (req, res) => {
    try {
      // Check if user is requesting their own data or is an admin
      if (req.user!.userId !== req.params.userId && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      const timeframe = req.query.timeframe as string || 'month';
      const metrics = await analyticsService.getUserMetrics(req.params.userId, timeframe);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route POST /api/analytics/track
 * @desc Track user action
 * @access Private
 */
router.post('/track',
  authenticate,
  rateLimiter,
  async (req, res) => {
    try {
      const { action, metadata } = req.body;
      await analyticsService.trackUserAction(req.user!.userId, action, metadata);
      res.status(200).end();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route GET /api/analytics/reports
 * @desc Get analytics reports
 * @access Private (Admin)
 */
router.get('/reports',
  authenticate,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe as string || 'month';
      const reportId = await analyticsService.generateAnalyticsReport(timeframe);
      res.json({ reportId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route GET /api/analytics/reports/:reportId
 * @desc Get specific analytics report
 * @access Private (Admin)
 */
router.get('/reports/:reportId',
  authenticate,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const report = await analyticsService.getAnalyticsReport(req.params.reportId);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route GET /api/analytics/energy-savings
 * @desc Get platform-wide energy savings metrics
 * @access Public
 */
router.get('/energy-savings',
  rateLimiter,
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe as string || 'all';
      const result = await pool.query(
        `SELECT 
          COUNT(DISTINCT user_id) as total_users,
          SUM(energy_savings) as total_savings,
          AVG(energy_savings) as average_savings
         FROM user_progress
         WHERE ${timeframe === 'all' ? '1=1' : `created_at >= NOW() - INTERVAL '1 ${timeframe}'`}`
      );

      res.json({
        totalUsers: result.rows[0].total_users,
        totalSavings: result.rows[0].total_savings,
        averageSavings: result.rows[0].average_savings
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route GET /api/analytics/product-engagement/:productId
 * @desc Get product engagement metrics
 * @access Private (Admin)
 */
router.get('/product-engagement/:productId',
  authenticate,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as view_count,
          COUNT(DISTINCT user_id) as unique_viewers,
          COUNT(CASE WHEN action_type = 'purchase' THEN 1 END) as purchase_count
         FROM user_actions
         WHERE metadata->>'productId' = $1
         AND created_at >= NOW() - INTERVAL '30 days'`,
        [req.params.productId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;
