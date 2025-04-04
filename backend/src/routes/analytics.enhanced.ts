/**
 * Routes for analytics data collection and pilot study management
 * Enhanced with UUID type casting for PostgreSQL
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

const router = express.Router();

/**
 * Initialize with database connection in server.ts
 */
let analyticsService: AnalyticsService;

export const initAnalyticsRoutes = (service: AnalyticsService) => {
  analyticsService = service;
};

/**
 * Save analytics events
 * This can be used by both logged-in and anonymous users
 */
router.post('/events', optionalTokenValidation, async (req, res) => {
  try {
    const { sessionId, events } = req.body;
    const userId = req.user?.id || null;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ success: false, message: 'Events must be an array' });
    }
    
    // Added UUID type casting for sessionId
    const result = await analyticsService.saveEvents(userId, `${sessionId}::uuid`, events);
    
    return res.json(result);
  } catch (error) {
    appLogger.error('Error saving analytics events', createLogMetadata(req, { error }));
    return res.status(500).json({ success: false, message: 'Error processing analytics events' });
  }
});

/**
 * End a session
 */
router.post('/session/:sessionId/end', optionalTokenValidation, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration } = req.body;
    
    // Added UUID type casting for sessionId
    const result = await analyticsService.endSession(`${sessionId}::uuid`, duration);
    
    return res.json({ success: result });
  } catch (error) {
    appLogger.error('Error ending analytics session', createLogMetadata(req, { error }));
    return res.status(500).json({ success: false, message: 'Error ending session' });
  }
});

/**
 * Update user consent for analytics collection
 * Requires authentication
 */
router.post('/consent', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.body;
    
    if (!['granted', 'denied', 'withdrawn'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status must be one of: granted, denied, withdrawn' 
      });
    }
    
    const result = await analyticsService.updateConsent(userId, status);
    
    return res.json({ success: result });
  } catch (error) {
    appLogger.error('Error updating consent status', createLogMetadata(req, { error }));
    return res.status(500).json({ success: false, message: 'Error updating consent status' });
  }
});

/**
 * Get current consent status
 * Requires authentication
 */
router.get('/consent/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await analyticsService.getConsentStatus(userId);
    
    return res.json({ status });
  } catch (error) {
    appLogger.error('Error getting consent status', createLogMetadata(req, { error }));
    return res.status(500).json({ success: false, message: 'Error retrieving consent status' });
  }
});

/**
 * Validate a pilot study invitation token
 * Public route - no authentication required
 */
router.get('/pilot/validate-token', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        valid: false, 
        message: 'Token is required' 
      });
    }
    
    const result = await analyticsService.validatePilotToken(token);
    
    return res.json(result);
  } catch (error) {
    appLogger.error('Error validating pilot token', createLogMetadata(req, { error }));
    return res.status(500).json({ 
      valid: false, 
      message: 'Error processing token' 
    });
  }
});

/**
 * Register a pilot study participant
 * Public route - no authentication required
 */
router.post('/pilot/register', async (req, res) => {
  try {
    const { email, password, token, participantType } = req.body;
    
    // Validate required fields
    if (!email || !password || !token || !participantType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: email, password, token, and participantType are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }
    
    // Create the user account and set up pilot study status
    const result = await analyticsService.registerPilotParticipant(
      email, 
      password, 
      token, 
      participantType
    );
    
    return res.json(result);
  } catch (error) {
    appLogger.error('Error registering pilot participant', createLogMetadata(req, { error }));
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing registration' 
    });
  }
});

/**
 * Get analytics metrics
 * Admin-only route, requires admin role
 */
router.get('/metrics', authenticate, async (req, res) => {
  try {
    // Check admin role
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: Admin privileges required' 
      });
    }
    
    const { startDate, endDate, filters } = req.query;
    
    const result = await analyticsService.getMetrics({
      startDate: startDate as string,
      endDate: endDate as string,
      filters: filters ? JSON.parse(filters as string) : undefined
    });
    
    return res.json(result);
  } catch (error) {
    appLogger.error('Error getting analytics metrics', createLogMetadata(req, { error }));
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving analytics metrics' 
    });
  }
});

export default router;
