/**
 * Routes for analytics data collection and pilot study management
 * Enhanced version with improved error handling and diagnostics
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import util from 'util';

const router = express.Router();

/**
 * Initialize with database connection in server.ts
 */
let analyticsService: AnalyticsService;

export const initAnalyticsRoutes = (service: AnalyticsService) => {
  analyticsService = service;
  appLogger.info('Analytics routes initialized with service', createLogMetadata(undefined, {
    serviceType: typeof service,
    hasValidService: !!service,
  }));
};

/**
 * Save analytics events with enhanced error handling
 * This can be used by both logged-in and anonymous users
 */
router.post('/events', optionalTokenValidation, async (req, res) => {
  const startTime = Date.now();
  try {
    // Log incoming request for diagnostics
    appLogger.info('Analytics events request received', createLogMetadata(req, {
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
      hasSessionId: !!req.body?.sessionId,
      eventsCount: req.body?.events?.length || 0,
      authenticated: !!req.user,
    }));
    
    const { sessionId, events } = req.body;
    const userId = req.user?.id || null;
    
    // Detailed validation to give better error messages
    if (!sessionId) {
      appLogger.warn('Missing sessionId in analytics request', createLogMetadata(req, {}));
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }
    
    if (!events) {
      appLogger.warn('Missing events array in analytics request', createLogMetadata(req, { sessionId }));
      return res.status(400).json({ success: false, message: 'Events array is required' });
    }
    
    if (!Array.isArray(events)) {
      appLogger.warn('Events is not an array', createLogMetadata(req, { 
        sessionId,
        eventsType: typeof events
      }));
      return res.status(400).json({ success: false, message: 'Events must be an array' });
    }
    
    if (events.length === 0) {
      appLogger.info('Empty events array received', createLogMetadata(req, { sessionId }));
      return res.json({ success: true, eventsProcessed: 0, message: 'No events to process' });
    }

    // Enhanced validation of event structure
    const invalidEvents = events.filter(event => {
      return !event.eventType || !event.area || !event.timestamp;
    });
    
    if (invalidEvents.length > 0) {
      appLogger.warn('Invalid events in request', createLogMetadata(req, { 
        sessionId,
        invalidCount: invalidEvents.length,
        sampleInvalid: invalidEvents[0]
      }));
    }

    // Log sample event for debugging
    if (events.length > 0) {
      appLogger.debug('Sample event data', createLogMetadata(req, {
        sessionId,
        sampleEvent: JSON.stringify(events[0]),
        eventTypes: events.slice(0, 5).map(e => e.eventType)
      }));
    }
    
    try {
      // Add explicit timeout to diagnose hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analytics save timeout after 5s')), 5000);
      });
      
      // Race against timeout
      const result = await Promise.race([
        analyticsService.saveEvents(userId, sessionId, events),
        timeoutPromise
      ]) as any;
      
      // Log success metrics
      const duration = Date.now() - startTime;
      appLogger.info('Analytics events processed successfully', createLogMetadata(req, {
        sessionId,
        eventsCount: events.length,
        processedCount: result.eventsProcessed,
        durationMs: duration,
        success: result.success
      }));
      
      return res.json(result);
    } catch (serviceError: any) {
      // Enhanced error logging with full details
      appLogger.error('Error in analytics service', createLogMetadata(req, {
        sessionId,
        eventsCount: events.length,
        errorName: serviceError.name,
        errorMessage: serviceError.message,
        errorStack: serviceError.stack,
        errorCode: serviceError.code,
        errorDetail: serviceError.detail,
        // Use util.inspect to get better error serialization
        errorInspect: util.inspect(serviceError, { depth: 3 })
      }));
      
      return res.status(500).json({ 
        success: false, 
        message: 'Error processing analytics events', 
        error: serviceError.message,
        errorCode: serviceError.code
      });
    }
  } catch (error: any) {
    // Catch-all for unexpected errors
    const duration = Date.now() - startTime;
    appLogger.error('Unexpected error saving analytics events', createLogMetadata(req, {
      durationMs: duration,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      // Use util.inspect to get better error serialization
      errorInspect: util.inspect(error, { depth: 3 })
    }));
    
    return res.status(500).json({ 
      success: false, 
      message: 'Unexpected error processing analytics events',
      error: error.message
    });
  }
});

/**
 * End a session
 */
router.post('/session/:sessionId/end', optionalTokenValidation, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration } = req.body;
    
    const result = await analyticsService.endSession(sessionId, duration);
    
    return res.json({ success: result });
  } catch (error: any) {
    appLogger.error('Error ending analytics session', createLogMetadata(req, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }));
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
  } catch (error: any) {
    appLogger.error('Error updating consent status', createLogMetadata(req, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }));
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
  } catch (error: any) {
    appLogger.error('Error getting consent status', createLogMetadata(req, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }));
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
  } catch (error: any) {
    appLogger.error('Error validating pilot token', createLogMetadata(req, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }));
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
  } catch (error: any) {
    appLogger.error('Error registering pilot participant', createLogMetadata(req, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }));
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
  } catch (error: any) {
    appLogger.error('Error getting analytics metrics', createLogMetadata(req, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }));
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving analytics metrics' 
    });
  }
});

/**
 * Diagnostic endpoint to check database tables and connection
 * Admin-only route
 */
router.get('/diagnostics', authenticate, async (req, res) => {
  try {
    // Check admin role
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: Admin privileges required' 
      });
    }

    // We need to implement this in the service
    if (!analyticsService.runDiagnostics) {
      return res.status(501).json({
        success: false,
        message: 'Diagnostics not implemented in service'
      });
    }
    
    const results = await analyticsService.runDiagnostics();
    return res.json(results);
  } catch (error: any) {
    appLogger.error('Error running analytics diagnostics', createLogMetadata(req, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }));
    return res.status(500).json({ 
      success: false, 
      message: 'Error running analytics diagnostics' 
    });
  }
});

export default router;
