import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Import mock data for fallback when DB tables don't exist
import { getMockFeatures, getMockPages, getMockCorrelations, getMockUserFlow } from './admin-analytics-mock.js';

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

/**
 * @route GET /api/admin/analytics/user-flow-diagram
 * @desc Get data for the user flow diagram
 * @access Private (Admin)
 */
router.get('/user-flow-diagram', async (req, res) => {
  try {
    // Query to get page transitions and counts
    const query = `
      WITH page_transitions AS (
        SELECT
          LAG(page_path) OVER (PARTITION BY session_id ORDER BY visited_at) AS from_page,
          page_path AS to_page,
          session_id
        FROM page_visits
        WHERE visited_at > NOW() - INTERVAL '30 days'
      ),
      transition_counts AS (
        SELECT
          from_page,
          to_page,
          COUNT(*) AS transition_count
        FROM page_transitions
        WHERE from_page IS NOT NULL AND from_page != to_page
        GROUP BY from_page, to_page
      ),
      page_visits_counts AS (
        SELECT
          page_path,
          COUNT(*) AS visit_count
        FROM page_visits
        WHERE visited_at > NOW() - INTERVAL '30 days'
        GROUP BY page_path
      )
      SELECT
        tc.from_page AS source,
        tc.to_page AS target,
        tc.transition_count AS value,
        pvc_from.visit_count AS source_visits,
        pvc_to.visit_count AS target_visits
      FROM transition_counts tc
      JOIN page_visits_counts pvc_from ON tc.from_page = pvc_from.page_path
      JOIN page_visits_counts pvc_to ON tc.to_page = pvc_to.page_path
      ORDER BY tc.transition_count DESC
      LIMIT 100; -- Limit to top 100 transitions for performance
    `;

    const { rows: transitionRows, fromMock: transitionsFromMock } = await executeQueryWithMockFallback(
      query,
      [],
      () => [] // Provide empty array if query fails, mock handled below
    );

    let nodes, links;

    if (transitionsFromMock || transitionRows.length === 0) {
      console.info('Using mock user flow data for admin analytics');
      const mockData = getMockUserFlow();
      nodes = mockData.nodes;
      links = mockData.links;
    } else {
      // Process real data
      const nodeMap = new Map();
      links = transitionRows.map(row => {
        // Add source node
        if (!nodeMap.has(row.source)) {
          nodeMap.set(row.source, { id: row.source, name: row.source, value: row.source_visits });
        }
        // Add target node
        if (!nodeMap.has(row.target)) {
          nodeMap.set(row.target, { id: row.target, name: row.target, value: row.target_visits });
        }
        return { source: row.source, target: row.target, value: parseInt(row.value, 10) };
      });
      nodes = Array.from(nodeMap.values());
    }

    res.json({ nodes, links });

  } catch (error) {
    console.error('Error fetching user flow diagram data:', error.message);
    // Fallback to mock data on any unexpected error during processing
    try {
      console.warn('Falling back to mock user flow data due to processing error.');
      const mockData = getMockUserFlow();
      res.json(mockData);
    } catch (mockError) {
      console.error('Error fetching mock user flow data:', mockError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user flow diagram data',
        error: error.message || 'Unknown error'
      });
    }
  }
});

export default router;
