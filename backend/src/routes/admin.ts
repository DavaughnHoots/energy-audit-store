/**
 * Routes for admin dashboard and analytics access
 */

import express from 'express';
import { adminLogin, adminLogout, requireAdmin } from '../middleware/adminAuth.js';
import { AnalyticsService } from '../services/analyticsService.js';

const router = express.Router();

/**
 * Initialize with analytics service in server.ts
 */
let analyticsService: AnalyticsService;

export const initAdminRoutes = (service: AnalyticsService) => {
  analyticsService = service;
};

/**
 * Admin authentication
 */
router.post('/login', adminLogin);
router.post('/logout', adminLogout);

/**
 * Check authentication status
 */
router.get('/status', (req, res) => {
  const isAuthenticated = !!req.cookies['admin_session'];
  return res.json({ authenticated: isAuthenticated });
});

/**
 * Get analytics metrics for the admin dashboard
 * Protected by admin authentication
 */
router.get('/analytics/metrics', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Add logging to check the input parameters
    console.log('Admin metrics request:', {
      startDate,
      endDate,
      query: req.query
    });
    
    // Handle empty string date params which can cause date parsing issues
    const sanitizedStartDate = startDate && (startDate as string).trim() ? startDate as string : null;
    const sanitizedEndDate = endDate && (endDate as string).trim() ? endDate as string : null;
    
    // Handle date validation with explicit defaults
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30); // Default to 30 days ago
    
    const result = await analyticsService.getMetrics({
      startDate: sanitizedStartDate || defaultStartDate.toISOString(),
      endDate: sanitizedEndDate || new Date().toISOString(),
      filters: undefined
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Error getting admin analytics metrics', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving analytics metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get detailed session data
 * Protected by admin authentication
 */
router.get('/analytics/sessions', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, limit, offset } = req.query;
    
    const query = `
      SELECT 
        id, user_id, start_time, end_time, duration, events_count, created_at
      FROM analytics_sessions
      WHERE start_time BETWEEN $1 AND $2
      ORDER BY start_time DESC
      LIMIT $3 OFFSET $4
    `;
    
    const params = [
      startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate as string) : new Date(),
      limit ? parseInt(limit as string) : 50,
      offset ? parseInt(offset as string) : 0
    ];
    
    const result = await analyticsService['pool'].query(query, params);
    
    return res.json({
      success: true,
      sessions: result.rows,
      total: result.rowCount,
      params: {
        startDate: (params[0] as Date).toISOString(),
        endDate: (params[1] as Date).toISOString(),
        limit: params[2],
        offset: params[3]
      }
    });
  } catch (error) {
    console.error('Error getting session data', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving session data' 
    });
  }
});

/**
 * Get event details for a specific session
 * Protected by admin authentication
 */
router.get('/analytics/sessions/:sessionId/events', requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const query = `
      SELECT 
        id, event_type, area, timestamp, data
      FROM analytics_events
      WHERE session_id = $1
      ORDER BY timestamp ASC
    `;
    
    const result = await analyticsService['pool'].query(query, [sessionId]);
    
    return res.json({
      success: true,
      events: result.rows,
      sessionId,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Error getting session events', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving session events' 
    });
  }
});

export default router;
