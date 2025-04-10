/**
 * Badge routes for the API
 * Handles badge definitions and user badge progress
 */

import express from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { appLogger } from '../config/logger.js';
import { BadgeService } from '../services/BadgeService.js';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();
const badgeService = new BadgeService();

/**
 * Get all badge definitions
 */
router.get('/badges', async (req: AuthenticatedRequest, res) => {
  try {
    const badges = await badgeService.getAllBadgeDefinitions();
    res.json({ badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badge definitions' });
  }
});

/**
 * Get a specific badge definition
 */
router.get(
  '/badges/:badgeId',
  [
    param('badgeId').isString().notEmpty().withMessage('Badge ID is required'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const badgeId = req.params.badgeId;
      const badge = await badgeService.getBadgeDefinition(badgeId);
      
      if (!badge) {
        return res.status(404).json({ error: 'Badge not found' });
      }
      
      res.json({ badge });
    } catch (error) {
      console.error('Error fetching badge:', error);
      res.status(500).json({ error: 'Failed to fetch badge definition' });
    }
  }
);

/**
 * Get all badges for a user
 */
router.get(
  '/users/:userId/badges',
  [
    validateToken,
    param('userId').isUUID().withMessage('Valid user ID is required'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      // Ensure user can only access their own badges unless they're an admin
      if (req.user?.id !== req.params.userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to access these badges' });
      }
      
      const userId = req.params.userId;
      const badges = await badgeService.getUserBadges(userId);
      
      res.json({ badges });
    } catch (error) {
      console.error('Error fetching user badges:', error);
      res.status(500).json({ error: 'Failed to fetch user badges' });
    }
  }
);

/**
 * Get user points and level
 */
router.get(
  '/users/:userId/points',
  [
    validateToken,
    param('userId').isUUID().withMessage('Valid user ID is required'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      // Ensure user can only access their own points unless they're an admin
      if (req.user?.id !== req.params.userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to access this information' });
      }
      
      const userId = req.params.userId;
      const pointsData = await badgeService.getUserPoints(userId);
      
      res.json(pointsData);
    } catch (error) {
      console.error('Error fetching user points:', error);
      res.status(500).json({ error: 'Failed to fetch user points' });
    }
  }
);

/**
 * Update badge progress
 * Note: This endpoint would typically be used internally by other services
 * rather than being called directly from the frontend
 */
router.put(
  '/users/:userId/badges/:badgeId/progress',
  [
    validateToken,
    param('userId').isUUID().withMessage('Valid user ID is required'),
    param('badgeId').isString().notEmpty().withMessage('Badge ID is required'),
    body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be a number between 0 and 100'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      // Only admins can manually update badge progress
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to update badge progress' });
      }
      
      const { userId, badgeId } = req.params;
      const { progress } = req.body;
      
      const updated = await badgeService.updateBadgeProgress(userId, badgeId, progress);
      
      if (!updated) {
        return res.status(404).json({ error: 'Badge or user not found' });
      }
      
      res.json({ success: true, message: 'Badge progress updated' });
    } catch (error) {
      console.error('Error updating badge progress:', error);
      res.status(500).json({ error: 'Failed to update badge progress' });
    }
  }
);

/**
 * Manually evaluate badges for a user
 * Typically used for testing or admin operations
 */
router.post(
  '/users/:userId/evaluate-badges',
  [
    validateToken,
    param('userId').isUUID().withMessage('Valid user ID is required'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      // Only admins can trigger manual badge evaluation
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to trigger badge evaluation' });
      }
      
      const userId = req.params.userId;
      const results = await badgeService.evaluateAllBadges(userId);
      
      res.json({ success: true, results });
    } catch (error) {
      console.error('Error evaluating badges:', error);
      res.status(500).json({ error: 'Failed to evaluate badges' });
    }
  }
);

/**
 * Record a user activity that might trigger badge evaluations
 */
router.post(
  '/users/:userId/activities',
  [
    validateToken,
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('activityType').isString().notEmpty().withMessage('Activity type is required'),
    body('metadata').isObject().withMessage('Metadata must be an object'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      // Ensure user can only record their own activities unless they're an admin
      if (req.user?.id !== req.params.userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to record activities for this user' });
      }
      
      const userId = req.params.userId;
      const { activityType, metadata } = req.body;
      
      const activity = await badgeService.recordActivity(userId, activityType, metadata);
      const evaluationResults = await badgeService.evaluateRelevantBadges(userId, activityType);
      
      res.json({ 
        success: true, 
        activity,
        badgeUpdates: evaluationResults
      });
    } catch (error) {
      console.error('Error recording activity:', error);
      res.status(500).json({ error: 'Failed to record activity' });
    }
  }
);

export default router;
