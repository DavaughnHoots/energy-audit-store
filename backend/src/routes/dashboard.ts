import express from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { dashboardService } from '../services/dashboardService';
import pool from '../config/database';
import { appLogger } from '../config/logger';

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

    const stats = await dashboardService.getUserStats(userId);

    // Add last updated timestamp
    const response = {
      ...stats,
      lastUpdated: new Date().toISOString(),
      refreshInterval: 300000 // 5 minutes in milliseconds
    };

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

export default router;
