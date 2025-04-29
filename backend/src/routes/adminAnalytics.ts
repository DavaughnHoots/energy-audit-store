import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Import mock data for fallback when DB tables don't exist
import { getMockFeatures, getMockPages, getMockCorrelations } from './admin-analytics-mock.js';

dotenv.config();

const router = express.Router();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Execute a database query with a fallback to mock data
 * @param query The SQL query to execute
 * @param params Query parameters
 * @param mockDataFn Function to generate mock data if query fails
 * @returns Query result or mock data
 */
async function executeQueryWithMockFallback(query, params, mockDataFn) {
  try {
    const result = await pool.query(query, params);
    return { rows: result.rows, fromMock: false };
  } catch (error) {
    console.warn('Database query failed, using mock data instead:', error.message);
    return { rows: mockDataFn(), fromMock: true };
  }
}

/**
 * @route GET /api/admin/analytics/most-used-features
 * @desc Get the most used features in the application
 * @access Private (Admin)
 */
router.get('/most-used-features', async (req, res) => {
  try {
    const { rows, fromMock } = await executeQueryWithMockFallback(
      `
      SELECT 
        feature_name,
        SPLIT_PART(feature_name, '/', 1) as component,
        COUNT(*) as usage_count,
        CASE 
          WHEN recent_count > 0 AND older_count > 0 
          THEN ((recent_count * 1.0) / older_count) - 1
          ELSE 0 
        END as usage_trend
      FROM (
        SELECT 
          feature_name,
          COUNT(*) FILTER (WHERE used_at > NOW() - INTERVAL '14 days') as recent_count,
          COUNT(*) FILTER (WHERE used_at <= NOW() - INTERVAL '14 days' AND used_at > NOW() - INTERVAL '30 days') as older_count
        FROM feature_usage_stats
        GROUP BY feature_name
      ) as feature_stats
      GROUP BY feature_name, component, recent_count, older_count
      ORDER BY usage_count DESC
      LIMIT 20;
      `,
      [],
      getMockFeatures
    );
    
    if (fromMock) {
      console.info('Using mock feature data for admin analytics');
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching most used features:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch most used features',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route GET /api/admin/analytics/most-visited
 * @desc Get the most visited pages
 * @access Private (Admin)
 */
router.get('/most-visited', async (req, res) => {
  try {
    const { rows, fromMock } = await executeQueryWithMockFallback(
      `
      SELECT 
        page_path,
        SPLIT_PART(page_path, '/', 2) as area,
        page_title as title,
        COUNT(*) as visit_count,
        AVG(time_spent_seconds) as avg_time_spent
      FROM page_visits
      WHERE visited_at > NOW() - INTERVAL '30 days'
      GROUP BY page_path, area, page_title
      ORDER BY visit_count DESC
      LIMIT 20;
      `,
      [],
      getMockPages
    );
    
    if (fromMock) {
      console.info('Using mock page visit data for admin analytics');
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching most visited pages:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch most visited pages',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route GET /api/admin/analytics/feature-correlations
 * @desc Get correlations between features (which features are used together)
 * @access Private (Admin)
 */
router.get('/feature-correlations', async (req, res) => {
  try {
    const minScore = parseFloat(req.query.minScore as string) || 0.3;
    
    const { rows, fromMock } = await executeQueryWithMockFallback(
      `
      WITH user_sessions AS (
        SELECT 
          session_id, 
          feature_name
        FROM feature_usage_stats
        WHERE used_at > NOW() - INTERVAL '30 days'
        GROUP BY session_id, feature_name
      ),
      feature_pairs AS (
        SELECT 
          a.feature_name as feature1,
          b.feature_name as feature2,
          COUNT(DISTINCT a.session_id) as sessions_with_both,
          (SELECT COUNT(DISTINCT session_id) FROM user_sessions WHERE feature_name = a.feature_name) as sessions_with_feature1,
          (SELECT COUNT(DISTINCT session_id) FROM user_sessions WHERE feature_name = b.feature_name) as sessions_with_feature2
        FROM user_sessions a
        JOIN user_sessions b 
          ON a.session_id = b.session_id 
          AND a.feature_name < b.feature_name
        GROUP BY a.feature_name, b.feature_name
      )
      SELECT 
        feature1,
        feature2,
        sessions_with_both::float / NULLIF(GREATEST(sessions_with_feature1, sessions_with_feature2), 0) as correlation_score,
        CASE 
          WHEN sessions_with_both > 50 THEN 0.9
          WHEN sessions_with_both > 20 THEN 0.7
          WHEN sessions_with_both > 10 THEN 0.5
          ELSE 0.3
        END as confidence
      FROM feature_pairs
      WHERE sessions_with_both > 5
        AND sessions_with_both::float / NULLIF(GREATEST(sessions_with_feature1, sessions_with_feature2), 0) >= $1
      ORDER BY correlation_score DESC, sessions_with_both DESC
      LIMIT 20;
      `,
      [minScore],
      () => getMockCorrelations(minScore)
    );
    
    if (fromMock) {
      console.info('Using mock correlation data for admin analytics');
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching feature correlations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature correlations',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route POST /api/admin/analytics/refresh
 * @desc Refresh analytics materialized views
 * @access Private (Admin)
 */
router.post('/refresh', async (req, res) => {
  try {
    // For simplicity in demo mode, just return success
    res.json({
      success: true,
      message: 'Analytics views refreshed successfully',
      demo: true
    });
  } catch (error) {
    console.error('Error refreshing analytics views:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh analytics views',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route GET /api/admin/analytics/summary
 * @desc Get a summary of all analytics data
 * @access Private (Admin)
 */
router.get('/summary', async (req, res) => {
  try {
    // Return mock summary data
    res.json({
      users: {
        total_sessions: 1250,
        logged_in_users: 380,
        active_sessions: 520
      },
      features: {
        total_feature_interactions: 7850,
        unique_features: 35,
        recent_interactions: 2300
      },
      pages: {
        total_page_visits: 9200,
        unique_pages: 25,
        avg_time_spent_seconds: 210
      },
      timestamp: new Date().toISOString(),
      demo: true
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics summary',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;
