// backend/src/routes/analytics.ts

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';
import { AnalyticsService } from '../services/analyticsService';
import { pool } from '../config/database';

const router = express.Router();
const analyticsService = new AnalyticsService(pool);

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