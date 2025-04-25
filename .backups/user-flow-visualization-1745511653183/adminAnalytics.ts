import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { format } from 'date-fns';

dotenv.config();

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const router = express.Router();

// Middleware to ensure all routes require authentication
router.use(authenticate);
router.use(requireRole(['admin']));

/**
 * Helper function to format response data
 */
const formatResponse = (data: any, message: string = 'Data retrieved successfully') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Helper function to handle errors
 */
const handleError = (res: express.Response, error: any) => {
  console.error('Admin Analytics API Error:', error);
  res.status(500).json({
    success: false,
    message: 'An error occurred while processing the request',
    error: error.message || 'Unknown error',
    timestamp: new Date().toISOString()
  });
};

/**
 * @route   GET /api/admin/analytics/navigation-flows
 * @desc    Get navigation flow data between pages
 * @access  Private (Admin only)
 */
router.get('/navigation-flows', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no date range provided
    const start = startDate ? String(startDate) : format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const end = endDate ? String(endDate) : format(new Date(), 'yyyy-MM-dd');
    
    const query = `
      SELECT 
        prev_page AS "fromPage",
        current_page AS "toPage", 
        COUNT(*) AS total_transitions,
        $1 AS date_range_start,
        $2 AS date_range_end
      FROM page_transitions
      WHERE timestamp >= $1 AND timestamp <= ($2 || ' 23:59:59')::timestamp
      GROUP BY prev_page, current_page
      ORDER BY total_transitions DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query, [start, end]);
    res.json(formatResponse(result.rows));
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   GET /api/admin/analytics/user-journeys
 * @desc    Get common user journey sequences
 * @access  Private (Admin only)
 */
router.get('/user-journeys', async (req, res) => {
  try {
    const query = `
      SELECT 
        journey_sequence AS sequence,
        COUNT(*) AS frequency,
        COALESCE(AVG(CASE WHEN converted THEN 1.0 ELSE 0.0 END), 0) AS "conversionRate"
      FROM user_journeys
      GROUP BY journey_sequence
      ORDER BY frequency DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    // Convert string sequences to arrays for better frontend handling
    const data = result.rows.map(row => ({
      ...row,
      sequence: Array.isArray(row.sequence) ? row.sequence : String(row.sequence).split(',')
    }));
    
    res.json(formatResponse(data));
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   GET /api/admin/analytics/feature-correlations
 * @desc    Get feature correlation matrix for related features
 * @access  Private (Admin only)
 */
router.get('/feature-correlations', async (req, res) => {
  try {
    const { minScore } = req.query;
    const minimumScore = minScore ? parseFloat(String(minScore)) : 0.3;
    
    const query = `
      SELECT 
        feature1,
        feature2,
        correlation_score,
        confidence
      FROM feature_correlations
      WHERE correlation_score >= $1
      ORDER BY correlation_score DESC
      LIMIT 15
    `;
    
    const result = await pool.query(query, [minimumScore]);
    res.json(formatResponse(result.rows));
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   GET /api/admin/analytics/session-timeline
 * @desc    Get session timeline data showing page sequence through sessions
 * @access  Private (Admin only)
 */
router.get('/session-timeline', async (req, res) => {
  try {
    const query = `
      SELECT 
        page,
        session_position,
        percentage_of_sessions,
        bounce_rate
      FROM session_timeline_analysis
      ORDER BY session_position ASC, percentage_of_sessions DESC
      LIMIT 30
    `;
    
    const result = await pool.query(query);
    res.json(formatResponse(result.rows));
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   GET /api/admin/analytics/most-visited
 * @desc    Get most visited areas/pages of the site
 * @access  Private (Admin only)
 */
router.get('/most-visited', async (req, res) => {
  try {
    const query = `
      SELECT 
        area,
        page_path,
        title,
        visit_count,
        avg_time_spent
      FROM page_visits
      ORDER BY visit_count DESC
      LIMIT 15
    `;
    
    const result = await pool.query(query);
    res.json(formatResponse(result.rows));
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   GET /api/admin/analytics/most-used-features
 * @desc    Get most used features on the site
 * @access  Private (Admin only)
 */
router.get('/most-used-features', async (req, res) => {
  try {
    const query = `
      SELECT 
        feature_name,
        component,
        usage_count,
        usage_trend
      FROM feature_usage_stats
      ORDER BY usage_count DESC
      LIMIT 15
    `;
    
    const result = await pool.query(query);
    res.json(formatResponse(result.rows));
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   POST /api/admin/analytics/refresh
 * @desc    Manually refresh analytics data
 * @access  Private (Admin only)
 */
router.post('/refresh', async (req, res) => {
  try {
    // Trigger refresh of materialized views
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY page_visits');
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY feature_usage_stats');
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY feature_correlations');
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY session_timeline_analysis');
    
    res.json({
      success: true,
      message: 'Analytics data refresh triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   GET /api/admin/analytics/roadmap
 * @desc    Get all roadmap items
 * @access  Private (Admin only)
 */
router.get('/roadmap', async (req, res) => {
  try {
    // Check if roadmap_items table exists, if not create it
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roadmap_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        priority VARCHAR(50) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        description TEXT,
        source VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await pool.query('SELECT * FROM roadmap_items ORDER BY created_at DESC');
    
    // Format dates for frontend
    const data = result.rows.map(item => ({
      id: item.id,
      name: item.name,
      priority: item.priority,
      description: item.description,
      source: item.source,
      createdAt: item.created_at
    }));
    
    res.json(formatResponse(data, 'Roadmap items retrieved successfully'));
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   POST /api/admin/analytics/roadmap
 * @desc    Create a new roadmap item
 * @access  Private (Admin only)
 */
router.post('/roadmap', async (req, res) => {
  try {
    const { name, priority, description, source } = req.body;
    
    // Input validation
    if (!name || !priority || !source) {
      return res.status(400).json({
        success: false,
        message: 'Name, priority, and source are required fields',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate priority
    if (!['high', 'medium', 'low'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be one of: high, medium, low',
        timestamp: new Date().toISOString()
      });
    }
    
    // Create roadmap_items table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roadmap_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        priority VARCHAR(50) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        description TEXT,
        source VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert new roadmap item
    const result = await pool.query(
      'INSERT INTO roadmap_items (name, priority, description, source) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, priority, description || '', source]
    );
    
    const newItem = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      priority: result.rows[0].priority,
      description: result.rows[0].description,
      source: result.rows[0].source,
      createdAt: result.rows[0].created_at
    };
    
    res.status(201).json(formatResponse(newItem, 'Roadmap item created successfully'));
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   DELETE /api/admin/analytics/roadmap/:id
 * @desc    Delete a roadmap item
 * @access  Private (Admin only)
 */
router.delete('/roadmap/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the item exists
    const checkResult = await pool.query('SELECT * FROM roadmap_items WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Roadmap item with ID ${id} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Delete the item
    await pool.query('DELETE FROM roadmap_items WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: `Roadmap item with ID ${id} deleted successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @route   PUT /api/admin/analytics/roadmap/:id
 * @desc    Update a roadmap item
 * @access  Private (Admin only)
 */
router.put('/roadmap/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, priority, description } = req.body;
    
    // Input validation
    if (!name || !priority) {
      return res.status(400).json({
        success: false,
        message: 'Name and priority are required fields',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate priority
    if (!['high', 'medium', 'low'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be one of: high, medium, low',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if the item exists
    const checkResult = await pool.query('SELECT * FROM roadmap_items WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Roadmap item with ID ${id} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update the item
    const result = await pool.query(
      'UPDATE roadmap_items SET name = $1, priority = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, priority, description || '', id]
    );
    
    const updatedItem = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      priority: result.rows[0].priority,
      description: result.rows[0].description,
      source: result.rows[0].source,
      createdAt: result.rows[0].created_at
    };
    
    res.json(formatResponse(updatedItem, 'Roadmap item updated successfully'));
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
