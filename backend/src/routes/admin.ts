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
    
    // Enhanced logging of request parameters
    console.log('Admin metrics request received:', {
      startDate: typeof startDate === 'string' ? startDate : 'null or undefined',
      endDate: typeof endDate === 'string' ? endDate : 'null or undefined',
      queryParams: JSON.stringify(req.query)
    });
    
    // Enhanced santization logic
    let sanitizedStartDate: string | null = null;
    let sanitizedEndDate: string | null = null;
    
    // Process start date
    if (startDate && typeof startDate === 'string' && startDate.trim()) {
      try {
        // Check if it's a valid date by attempting to parse it
        const parsedDate = new Date(startDate);
        if (!isNaN(parsedDate.getTime())) {
          sanitizedStartDate = startDate.trim();
          console.log(`Valid start date: ${sanitizedStartDate}`);
        } else {
          console.log(`Invalid start date format: ${startDate}`);
        }
      } catch (error) {
        console.error(`Error parsing start date: ${startDate}`, error);
      }
    } else {
      console.log('Start date is empty, null, or undefined');
    }
    
    // Process end date
    if (endDate && typeof endDate === 'string' && endDate.trim()) {
      try {
        // Check if it's a valid date by attempting to parse it
        const parsedDate = new Date(endDate);
        if (!isNaN(parsedDate.getTime())) {
          sanitizedEndDate = endDate.trim();
          console.log(`Valid end date: ${sanitizedEndDate}`);
        } else {
          console.log(`Invalid end date format: ${endDate}`);
        }
      } catch (error) {
        console.error(`Error parsing end date: ${endDate}`, error);
      }
    } else {
      console.log('End date is empty, null, or undefined');
    }
    
    // Create default dates
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30); // Default to 30 days ago
    const defaultEndDate = new Date();
    
    // Ensure we have valid dates (either from input or defaults)
    const startDateValue = sanitizedStartDate || defaultStartDate.toISOString();
    const endDateValue = sanitizedEndDate || defaultEndDate.toISOString();
    
    console.log('Using dates for analytics query:', {
      startDate: startDateValue,
      endDate: endDateValue,
      usingDefaults: {
        startDate: !sanitizedStartDate,
        endDate: !sanitizedEndDate
      }
    });
    
    // Call the analytics service with the processed dates
    try {
      const result = await analyticsService.getMetrics({
        startDate: startDateValue,
        endDate: endDateValue,
        filters: undefined
      });
      
      console.log('Analytics metrics fetched successfully');
      return res.json(result);
    } catch (metricsError) {
      console.error('Error in analytics service getMetrics call:', metricsError);
      
      // Detailed error logging
      if (metricsError instanceof Error) {
        console.error('Error details:', {
          name: metricsError.name,
          message: metricsError.message,
          stack: metricsError.stack
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Error retrieving analytics metrics from service',
        error: metricsError instanceof Error ? metricsError.message : 'Unknown metrics service error'
      });
    }
  } catch (error) {
    console.error('Unhandled error in admin analytics metrics endpoint', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing analytics metrics request',
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
