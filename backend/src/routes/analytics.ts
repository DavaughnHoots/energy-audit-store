import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const router = express.Router();

// Middleware to prevent rate limiting
const rateLimitBypass = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`[RATE LIMIT BYPASSED] Path: ${req.path}, Method: ${req.method}`);
  next();
};

// Apply rate limit bypass to all analytics routes
router.use(rateLimitBypass);

/**
 * @route   POST /api/analytics/session
 * @desc    Create or update a session
 * @access  Public
 */
router.post('/session', async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    console.log('Creating/updating session:', {
      sessionId,
      userId
    });
    
    // Check if session exists
    console.log('Checking if session exists:', sessionId);
    const sessionCheck = await pool.query(
      'SELECT 1 FROM sessions WHERE session_id = $1',
      [sessionId]
    );
    
    const rowCount = sessionCheck?.rowCount || 0;
    console.log('Session check result:', { found: rowCount > 0, rowCount });
    
    if (rowCount > 0) {
      // Update existing session
      console.log('Updating existing session:', sessionId);
      await pool.query(
        'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP, user_id = COALESCE($1, user_id) WHERE session_id = $2',
        [userId || null, sessionId]
      );
    } else {
      // Create new session
      console.log('Creating new session:', sessionId);
      await pool.query(
        'INSERT INTO sessions (session_id, user_id, started_at, last_activity, user_agent, device_type, is_mobile) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3, $4, $5)',
        [
          sessionId,
          userId || null,
          req.headers['user-agent'] || '',
          req.body.deviceType || 'unknown',
          req.body.isMobile || false
        ]
      );
    }
    
    console.log('Session operation completed successfully');
    
    res.json({
      success: true,
      message: 'Session created/updated successfully',
      sessionId
    });
  } catch (error: any) {
    console.error('Error creating/updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update session',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/analytics/page-visit
 * @desc    Track a page visit
 * @access  Public
 */
router.post('/page-visit', async (req, res) => {
  try {
    const {
      sessionId,
      userId,
      pagePath,
      pageTitle,
      referrerPage,
      exitPage,
      timeSpentSeconds,
      deviceType,
      isMobile
    } = req.body;
    
    if (!sessionId || !pagePath) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and page path are required'
      });
    }
    
    // Ensure session exists
    const sessionResult = await pool.query(
      'SELECT 1 FROM sessions WHERE session_id = $1',
      [sessionId]
    );
    
    if (sessionResult.rowCount === 0) {
      // Create session if it doesn't exist
      await pool.query(
        'INSERT INTO sessions (session_id, user_id, started_at, last_activity, user_agent, device_type, is_mobile) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3, $4, $5)',
        [
          sessionId,
          userId || null,
          req.headers['user-agent'] || '',
          deviceType || 'unknown',
          isMobile || false
        ]
      );
    } else {
      // Update session last_activity
      await pool.query(
        'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
        [sessionId]
      );
    }
    
    // Insert page visit
    await pool.query(
      `INSERT INTO page_visits 
       (page_path, page_title, user_id, session_id, visited_at, referrer_page, exit_page, time_spent_seconds, device_type, is_mobile) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, $8, $9)`,
      [
        pagePath,
        pageTitle || '',
        userId || null,
        sessionId,
        referrerPage || null,
        exitPage || false,
        timeSpentSeconds || 0,
        deviceType || 'unknown',
        isMobile || false
      ]
    );
    
    res.json({
      success: true,
      message: 'Page visit tracked successfully'
    });
  } catch (error: any) {
    console.error('Error tracking page visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track page visit',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/analytics/feature-usage
 * @desc    Track feature usage
 * @access  Public
 */
router.post('/feature-usage', async (req, res) => {
  try {
    const {
      featureId,
      featureName,
      featureCategory,
      sessionId,
      userId,
      pageContext,
      interactionType,
      interactionData
    } = req.body;
    
    if (!sessionId || !featureName) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and feature name are required'
      });
    }
    
    // Ensure session exists
    const sessionResult = await pool.query(
      'SELECT 1 FROM sessions WHERE session_id = $1',
      [sessionId]
    );
    
    if (sessionResult.rowCount === 0) {
      // Create session if it doesn't exist
      await pool.query(
        'INSERT INTO sessions (session_id, user_id, started_at, last_activity, user_agent) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3)',
        [
          sessionId,
          userId || null,
          req.headers['user-agent'] || ''
        ]
      );
    } else {
      // Update session last_activity
      await pool.query(
        'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
        [sessionId]
      );
    }
    
    // Insert feature usage
    await pool.query(
      `INSERT INTO feature_usage_stats 
       (feature_id, feature_name, feature_category, user_id, session_id, used_at, page_context, interaction_type, interaction_data) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, $8)`,
      [
        featureId || `feature-${uuidv4().substring(0, 8)}`,
        featureName,
        featureCategory || 'general',
        userId || null,
        sessionId,
        pageContext || '',
        interactionType || 'click',
        interactionData ? JSON.stringify(interactionData) : null
      ]
    );
    
    // Refresh analytics views
    await pool.query('SELECT refresh_analytics_views()');
    
    res.json({
      success: true,
      message: 'Feature usage tracked successfully'
    });
  } catch (error: any) {
    console.error('Error tracking feature usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track feature usage',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;
