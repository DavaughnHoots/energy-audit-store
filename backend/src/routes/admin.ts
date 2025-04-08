import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

const router = express.Router();
const analyticsService = new AnalyticsService(pool);

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard data
 * @access Private (Admin only)
 */
router.get('/dashboard', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const timeframe = req.query.timeframe as string || 'month';

    appLogger.info('Admin dashboard accessed', createLogMetadata(req, {
      timeframe,
      userId: req.user?.id
    }));

    const metrics = await analyticsService.getPlatformMetrics(timeframe);

    res.json({
      ...metrics,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    appLogger.error('Admin dashboard error:', createLogMetadata(req, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }));

    res.status(500).json({
      error: 'Failed to retrieve admin dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
// Force rebuild for admin dashboard fix
