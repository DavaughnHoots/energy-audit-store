// backend/src/routes/analytics.ts
// Simplified to focus only on essential functionality

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/security.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { pool } from '../config/database.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Directly implement the core analytics functions without depending on a service
// This avoids potential import and compatibility issues

/**
 * @route POST /api/analytics/session
 * @desc Create or update an analytics session
 * @access Public (handles both authenticated and anonymous users)
 */
router.post('/session',
  optionalTokenValidation,
  async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      // Log the session tracking request
      appLogger.debug('Analytics session tracking request:', createLogMetadata(req, {
        hasSessionId: !!sessionId
      }));

      if (!sessionId) {
        return res.status(400).json({ error: 'Missing required field: sessionId' });
      }

      // Get user ID if authenticated
      const userId = req.user?.id;

      try {
        // Simple database operation - create or update session
        const existingSession = await pool.query(
          'SELECT * FROM analytics_sessions WHERE id = $1',
          [sessionId]
        );

        if (existingSession.rows.length === 0) {
          // Create new session
          await pool.query(
            'INSERT INTO analytics_sessions (id, user_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
            [sessionId, userId || null]
          );
        } else {
          // Update existing session
          await pool.query(
            'UPDATE analytics_sessions SET updated_at = NOW(), user_id = COALESCE($1, user_id) WHERE id = $2',
            [userId || null, sessionId]
          );
        }
        
        // Return success response immediately
        return res.status(200).json({ success: true });
      } catch (dbError) {
        // Log database error but don't expose details to client
        appLogger.error('Database error in analytics session tracking:', createLogMetadata(req, {
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          stack: dbError instanceof Error ? dbError.stack : undefined,
        }));
        
        // Return a generic error to the client
        return res.status(500).json({ error: 'Could not process analytics session', success: false });
      }
    } catch (error) {
      console.error('Error tracking analytics session:', error);
      appLogger.error('Failed to track analytics session:', createLogMetadata(req, { 
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

      try {
        // Get the user_id from the session
        const session = await pool.query(
          'SELECT user_id FROM analytics_sessions WHERE id = $1',
          [sessionId]
        );
        
        const userId = session.rows.length > 0 ? session.rows[0].user_id : null;
        
        // Generate a UUID for the event
        const eventId = uuidv4();
        
        // Write event directly to the database
        await pool.query(
          'INSERT INTO analytics_events (id, session_id, user_id, event_type, area, data, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [eventId, sessionId, userId, eventType, area, JSON.stringify(data || {})]
        );
        
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
      const timeframe = req.query.timeframe || 'month';
      let timeframeClause;
      
      switch (timeframe) {
        case 'day':
          timeframeClause = 'created_at >= CURRENT_DATE';
          break;
        case 'week':
          timeframeClause = 'created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'year':
          timeframeClause = 'created_at >= CURRENT_DATE - INTERVAL \'1 year\'';
          break;
        case 'month':
        default:
          timeframeClause = 'created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
      }

      // Get active users count (users with recent sessions)
      const activeUsersResult = await pool.query(
        `SELECT COUNT(DISTINCT user_id) as active_users
         FROM analytics_sessions
         WHERE ${timeframeClause} AND user_id IS NOT NULL`
      );
      
      // Get new users count
      const newUsersResult = await pool.query(
        `SELECT 
          COUNT(DISTINCT id) as new_users
         FROM users
         WHERE ${timeframeClause}`
      );
      
      // Get total audits
      const auditsResult = await pool.query(
        `SELECT COUNT(*) as total_audits
         FROM energy_audits
         WHERE ${timeframeClause}`
      );
      
      // Get product views
      const productResult = await pool.query(
        `SELECT 
          (data->>'productId') as product_id,
          COUNT(*) as view_count
         FROM analytics_events
         WHERE event_type = 'product_view'
         AND ${timeframeClause}
         GROUP BY data->>'productId'
         ORDER BY view_count DESC
         LIMIT 10`
      );
      
      const productEngagement = {};
      const topProducts = [];
      
      for (const row of productResult.rows) {
        if (row.product_id) {
          productEngagement[row.product_id] = parseInt(row.view_count);
          topProducts.push({
            id: row.product_id,
            views: parseInt(row.view_count)
          });
        }
      }
      
      res.json({
        activeUsers: parseInt(activeUsersResult.rows[0]?.active_users || '0'),
        newUsers: parseInt(newUsersResult.rows[0]?.new_users || '0'),
        totalAudits: parseInt(auditsResult.rows[0]?.total_audits || '0'),
        productEngagement,
        topProducts,
        averageSavings: 0, // Default value until we implement savings calculations
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }
);

export default router;
