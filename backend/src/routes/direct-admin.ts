// backend/src/routes/direct-admin.ts
// Direct admin route implementation that bypasses service layer
// for improved reliability and performance

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/security.js';
import { pool } from '../config/database.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /api/direct-admin/dashboard
 * @desc Get analytics dashboard data with date range filter
 * @access Private (Admin only)
 */
router.get('/dashboard',
  authenticate,
  requireRole(['admin']),
  rateLimiter,
  async (req, res) => {
    try {
      // Get date range from query parameters
      const startDate = req.query.startDate as string || '';
      const endDate = req.query.endDate as string || '';
      
      // Default to last 30 days if no date range provided
      let dateRangeClause;
      
      if (startDate && endDate) {
        dateRangeClause = `created_at >= '${startDate}' AND created_at <= '${endDate} 23:59:59'`;
      } else {
        dateRangeClause = 'created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
      }

      // Get all sessions count
      const sessionsResult = await pool.query(
        `SELECT COUNT(*) as total_sessions
         FROM analytics_sessions
         WHERE ${dateRangeClause}`
      );
      
      // Calculate average session duration in minutes
      const sessionDurationResult = await pool.query(
        `SELECT COALESCE(AVG(
           EXTRACT(EPOCH FROM (updated_at - created_at)) / 60
         ), 0) as avg_duration_minutes
         FROM analytics_sessions
         WHERE ${dateRangeClause} AND updated_at > created_at`
      );
      
      // Get form completion count (energy audit submissions)
      const formCompletionsResult = await pool.query(
        `SELECT COUNT(*) as form_completions
         FROM energy_audits
         WHERE ${dateRangeClause}`
      );
      
      // Get page visits by area
      const pageVisitsResult = await pool.query(
        `SELECT 
          area as page,
          COUNT(*) as visits
         FROM analytics_events
         WHERE event_type = 'page_view'
         AND area != 'dashboard'
         AND ${dateRangeClause}
         GROUP BY area
         ORDER BY visits DESC
         LIMIT 10`
      );
      
      // Get feature usage (component_interaction events)
      const featureUsageResult = await pool.query(
        `SELECT 
          COALESCE(data->>'component', 'unknown') as feature,
          COUNT(*) as usage_count
         FROM analytics_events
         WHERE event_type = 'component_interaction'
         AND ${dateRangeClause}
         GROUP BY data->>'component'
         ORDER BY usage_count DESC
         LIMIT 10`
      );
      
      // Format the response
      const pageVisits = pageVisitsResult.rows.map(row => ({
        page: row.page,
        visits: parseInt(row.visits)
      }));
      
      const featureUsage = featureUsageResult.rows.map(row => ({
        feature: row.feature,
        usageCount: parseInt(row.usage_count)
      }));
      
      // Return the dashboard data
      res.json({
        sessions: {
          total: parseInt(sessionsResult.rows[0]?.total_sessions || '0'),
          avgDurationMinutes: Math.round(parseFloat(sessionDurationResult.rows[0]?.avg_duration_minutes || '0') * 10) / 10
        },
        formCompletions: parseInt(formCompletionsResult.rows[0]?.form_completions || '0'),
        pageVisits,
        featureUsage,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      appLogger.error('Failed to fetch dashboard data:', createLogMetadata(req, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }));
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }
);

export default router;
