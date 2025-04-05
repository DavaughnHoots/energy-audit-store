// backend/src/routes/analytics.ts
// Super simplified with extensive error handling and logging

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/security.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { pool } from '../config/database.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Debug log the pool connection info
console.log('Analytics routes initialized with database pool:', {
  poolTotalCount: pool._totalCount,
  poolIdleCount: pool._idleCount,
  poolWaitingCount: pool._waitingCount
});

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
        // Log the session info
        console.log('Creating/updating session:', { sessionId, userId });
        
        // Return success immediately - decouple database operations from response
        res.status(200).json({ success: true });
        
        // Attempt database operations in the background
        try {
          // First try to check if the session exists
          console.log('Checking if session exists:', sessionId);
          const existingSession = await pool.query(
            'SELECT * FROM analytics_sessions WHERE id = $1',
            [sessionId]
          );
          
          console.log('Session check result:', { 
            found: existingSession.rows.length > 0,
            rowCount: existingSession.rowCount
          });

          // Then attempt to create or update session
          if (existingSession.rows.length === 0) {
            console.log('Creating new session:', sessionId);
            await pool.query(
              'INSERT INTO analytics_sessions (id, user_id, start_time, created_at, updated_at, is_active) VALUES ($1, $2, NOW(), NOW(), NOW(), TRUE)',
              [sessionId, userId || null]
            );
          } else {
            console.log('Updating existing session:', sessionId);
            await pool.query(
              'UPDATE analytics_sessions SET updated_at = NOW(), user_id = COALESCE($1, user_id) WHERE id = $2',
              [userId || null, sessionId]
            );
          }
          console.log('Session operation completed successfully');
        } catch (dbInnerError) {
          // Log detailed error but don't affect the response
          console.error('Detailed database error in session tracking:', {
            message: dbInnerError.message,
            code: dbInnerError.code,
            detail: dbInnerError.detail,
            hint: dbInnerError.hint,
            position: dbInnerError.position,
            stack: dbInnerError.stack
          });
        }
        
        // Response already sent, no need to return
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
        // Log the event info
        console.log('Tracking event:', { sessionId, eventType, area });
        
        // Return success immediately - decouple database operations from response
        res.status(200).json({ success: true });
        
        // Attempt database operations in the background
        try {
          // Check if client provided an eventId (for deduplication)
          const clientProvidedId = data?.eventId;
          
          // If client provided an eventId, check if it already exists in database
          if (clientProvidedId) {
            const existingEvent = await pool.query(
              'SELECT id FROM analytics_events WHERE data->>\'eventId\' = $1 AND session_id = $2 LIMIT 1',
              [clientProvidedId, sessionId]
            );
            
            // If event already exists, skip insertion
            if (existingEvent.rows.length > 0) {
              console.log('Ignoring duplicate event with ID:', clientProvidedId);
              return; // Skip insertion of duplicate event
            }
          }
          
          // Generate a UUID for the event
          const eventId = uuidv4();
          
          // Get userId directly from the request if available
          const userId = req.user?.id;
          
          console.log('Inserting event into database:', { 
            eventId, 
            sessionId,
            eventType,
            area,
            clientProvidedId: clientProvidedId || 'none'
          });
          
          // Write event directly to the database
          await pool.query(
            'INSERT INTO analytics_events (id, session_id, user_id, event_type, area, data, created_at, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
            [eventId, sessionId, userId, eventType, area, JSON.stringify(data || {})]
          );
          
          console.log('Event tracked successfully');
        } catch (dbInnerError) {
          // Log detailed error but don't affect the response
          console.error('Detailed database error in event tracking:', {
            message: dbInnerError.message,
            code: dbInnerError.code,
            detail: dbInnerError.detail,
            hint: dbInnerError.hint,
            position: dbInnerError.position,
            stack: dbInnerError.stack
          });
        }
        
        // Response already sent, no need to return
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
