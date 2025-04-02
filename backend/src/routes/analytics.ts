/**
 * API routes for analytics data collection for the pilot study
 */

import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import { authenticate } from '../middleware/auth.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import AnalyticsService from '../services/analyticsService.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import { 
  GetMetricsRequest, 
  SaveEventsRequest, 
  UpdateConsentRequest 
} from '../types/analytics.js';

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create analytics service instance
const analyticsService = new AnalyticsService(pool);

/**
 * Endpoint to save analytics events
 * POST /api/analytics/events
 */
router.post('/events', optionalTokenValidation, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { events, sessionId } = req.body as SaveEventsRequest;
    
    if (!events || !Array.isArray(events) || !sessionId) {
      return res.status(400).json({ 
        error: 'Invalid request format', 
        message: 'Events array and sessionId are required' 
      });
    }
    
    const result = await analyticsService.saveEvents(userId, sessionId, events);
    res.json(result);
  } catch (error) {
    appLogger.error('Error saving analytics events', createLogMetadata(req, { error }));
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Error processing analytics data' 
    });
  }
});

/**
 * Endpoint to get user's consent status
 * GET /api/analytics/consent
 */
router.get('/consent', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await analyticsService.getConsentStatus(userId);
    res.json({ status });
  } catch (error) {
    appLogger.error('Error getting consent status', createLogMetadata(req, { error }));
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Error retrieving consent status' 
    });
  }
});

/**
 * Endpoint to update user's consent status
 * POST /api/analytics/consent
 */
router.post('/consent', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { consent } = req.body as UpdateConsentRequest;
    
    if (typeof consent !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid request format', 
        message: 'Consent boolean value is required' 
      });
    }
    
    const status = consent ? 'granted' : 'denied';
    const result = await analyticsService.updateConsent(userId, status);
    
    if (result) {
      res.json({ success: true, status });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to update consent status' 
      });
    }
  } catch (error) {
    appLogger.error('Error updating consent status', createLogMetadata(req, { error }));
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Error updating consent status' 
    });
  }
});

/**
 * Endpoint to get analytics metrics for pilot study dashboard
 * GET /api/analytics/metrics
 * Admin only
 */
router.get('/metrics', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin access required' 
      });
    }
    
    const request: GetMetricsRequest = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined
    };
    
    const result = await analyticsService.getMetrics(request);
    res.json(result);
  } catch (error) {
    appLogger.error('Error getting analytics metrics', createLogMetadata(req, { error }));
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Error retrieving analytics metrics' 
    });
  }
});

export default router;
