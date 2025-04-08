// backend/src/routes/direct-admin.fixed.ts
// Direct admin route implementation that bypasses service layer
// for improved reliability and performance
// Enhanced to properly extract page and feature names from analytics events
// Added granular analytics endpoint for debugging visualization

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
      
      // Get page visits with improved name extraction
      // Now checking for pageName and displayName fields added by our enhanced hooks
      const pageVisitsResult = await pool.query(
        `SELECT 
          COALESCE(
            data->>'pageName', 
            data->>'displayName', 
            data->>'title', 
            'Unknown Page'
          ) as page_name,
          COALESCE(data->>'path', '/unknown') as path,
          area,
          COUNT(*) as visits
         FROM analytics_events
         WHERE event_type = 'page_view'
         AND area != 'dashboard'
         AND ${dateRangeClause}
         GROUP BY 
          COALESCE(data->>'pageName', data->>'displayName', data->>'title', 'Unknown Page'),
          data->>'path', 
          area
         ORDER BY visits DESC
         LIMIT 10`
      );
      
      // Get feature usage with improved name extraction
      // Now checking for featureName and displayName fields from our enhanced hooks
      const featureUsageResult = await pool.query(
        `SELECT 
          COALESCE(
            data->>'featureName',
            data->>'displayName',
            data->>'componentName',
            data->>'component',
            CONCAT(data->>'componentName', ' ', data->>'action'),
            'unknown'
          ) as feature_name,
          COUNT(*) as usage_count
         FROM analytics_events
         WHERE event_type = 'component_interaction'
         AND ${dateRangeClause}
         GROUP BY 
          COALESCE(
            data->>'featureName',
            data->>'displayName',
            data->>'componentName',
            data->>'component',
            CONCAT(data->>'componentName', ' ', data->>'action'),
            'unknown'
          )
         ORDER BY usage_count DESC
         LIMIT 10`
      );
      
      // Define types for query results
      interface PageVisitRow {
        path: string;
        page_name: string;
        area: string;
        visits: string;
      }

      interface FeatureUsageRow {
        feature_name: string;
        usage_count: string;
      }
      
      // Format the response with enhanced page information
      const pageVisits = pageVisitsResult.rows.map((row: PageVisitRow) => ({
        path: row.path,
        name: row.page_name,
        area: row.area,
        visits: parseInt(row.visits),
        displayName: row.page_name // Use the already extracted name
      }));
      
      const featureUsage = featureUsageResult.rows.map((row: FeatureUsageRow) => ({
        feature: row.feature_name,
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

/**
 * @route GET /api/direct-admin/granular-analytics
 * @desc Get granular analytics tracking data (specifically feature-specific component names)
 * @access Private (Admin only)
 */
router.get('/granular-analytics',
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

      // Query to get granular feature usage (focusing on component names with underscores)
      const granularFeatureResult = await pool.query(
        `SELECT 
           data->>'featureName' as feature_name,
           SPLIT_PART(data->>'featureName', '_', 1) as base_component,
           COUNT(*) as usage_count
         FROM analytics_events
         WHERE event_type = 'component_interaction'
         AND ${dateRangeClause}
         AND data->>'featureName' LIKE '%\\_%'
         GROUP BY data->>'featureName', SPLIT_PART(data->>'featureName', '_', 1)
         ORDER BY base_component, usage_count DESC`
      );
      
      // Process results to create a grouped structure
      interface FeatureUsageRow {
        feature_name: string;
        base_component: string;
        usage_count: string;
      }

      // First create map of base components to features
      const componentGroups: Record<string, Array<{feature: string, usageCount: number}>> = {};
      
      granularFeatureResult.rows.forEach((row: FeatureUsageRow) => {
        const baseComponent = row.base_component;
        const feature = {
          feature: row.feature_name,
          usageCount: parseInt(row.usage_count)
        };
        
        if (!componentGroups[baseComponent]) {
          componentGroups[baseComponent] = [];
        }
        
        componentGroups[baseComponent].push(feature);
      });
      
      // Convert to array of component groups
      const groupedFeatures = Object.entries(componentGroups).map(([baseComponent, features]) => ({
        baseComponent,
        features: features.sort((a, b) => b.usageCount - a.usageCount),
        totalUsage: features.reduce((sum, feature) => sum + feature.usageCount, 0)
      }));
      
      // Sort groups by total usage
      groupedFeatures.sort((a, b) => b.totalUsage - a.totalUsage);
      
      // Return the dashboard data
      res.json({
        granularFeatures: groupedFeatures,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching granular analytics data:', error);
      appLogger.error('Failed to fetch granular analytics data:', createLogMetadata(req, { 
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
