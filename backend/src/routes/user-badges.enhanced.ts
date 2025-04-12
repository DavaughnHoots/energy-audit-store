/**
 * Enhanced User Badge routes for the API
 * Handles user-specific badge data
 * Fixed route paths to match frontend expectations
 */

import express from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { appLogger } from '../config/logger.js';
import { BadgeService } from '../services/BadgeService.js';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router({ mergeParams: true });
const badgeService = new BadgeService();

// Log all user badge-related requests for debugging
router.use((req, res, next) => {
  appLogger.info(`User badge request received: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

/**
 * Get all badges for a user
 */
router.get(
  '/badges',
  [
    validateToken,
    param('userId').isUUID().withMessage('Valid user ID is required'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.userId;
      appLogger.info(`Fetching badges for user ${userId}`);
      
      // Ensure user can only access their own badges unless they're an admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        appLogger.warn(`Unauthorized attempt to access badges for user ${userId} by user ${req.user?.id}`);
        return res.status(403).json({ error: 'Unauthorized to access these badges' });
      }
      
      const badges = await badgeService.getUserBadges(userId);
      appLogger.info(`Returning badges for user ${userId}`);
      
      res.json({ badges });
    } catch (error) {
      appLogger.error(`Error fetching user badges for ${req.params.userId}:`, error);
      console.error('Error fetching user badges:', error);
      res.status(500).json({ error: 'Failed to fetch user badges' });
    }
  }
);

/**
 * Get user points and level
 */
router.get(
  '/points',
  [
    validateToken,
    param('userId').isUUID().withMessage('Valid user ID is required'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.userId;
      appLogger.info(`Fetching points for user ${userId}`);
      
      // Ensure user can only access their own points unless they're an admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        appLogger.warn(`Unauthorized attempt to access points for user ${userId} by user ${req.user?.id}`);
        return res.status(403).json({ error: 'Unauthorized to access this information' });
      }
      
      const pointsData = await badgeService.getUserPoints(userId);
      appLogger.info(`Returning points for user ${userId}`);
      
      res.json(pointsData);
    } catch (error) {
      appLogger.error(`Error fetching user points for ${req.params.userId}:`, error);
      console.error('Error fetching user points:', error);
      res.status(500).json({ error: 'Failed to fetch user points' });
    }
  }
);

/**
 * Manually refresh badge cache for a user
 * Used when the frontend needs fresh badge data after direct database changes
 */
router.post(
  '/badges/refresh',
  [
    validateToken,
    param('userId').isUUID().withMessage('Valid user ID is required'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.userId;
      appLogger.info(`Badge cache refresh requested for user ${userId}`);
      
      // Ensure user can only refresh their own badges unless they're an admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        appLogger.warn(`Unauthorized attempt to refresh badges for user ${userId} by user ${req.user?.id}`);
        return res.status(403).json({ error: 'Unauthorized to refresh badges for this user' });
      }
      
      // Force re-evaluation of all badges
      appLogger.info(`Evaluating all badges for user ${userId}`);
      const evaluationResults = await badgeService.evaluateAllBadges(userId);
      
      // Clear any cached badge data in the service
      appLogger.info(`Clearing badge cache for user ${userId}`);
      await badgeService.clearUserCache(userId);
      
      // Get fresh badge data
      appLogger.info(`Fetching fresh badge data for user ${userId}`);
      const freshBadges = await badgeService.getUserBadges(userId);
      
      appLogger.info(`Badge refresh completed for user ${userId}`);
      res.json({ 
        success: true, 
        message: 'Badge cache refreshed',
        evaluationResults,
        badges: freshBadges 
      });
    } catch (error) {
      appLogger.error(`Error refreshing badge cache for user ${req.params.userId}:`, error);
      console.error('Error refreshing badge cache:', error);
      res.status(500).json({ error: 'Failed to refresh badge cache' });
    }
  }
);

export default router;