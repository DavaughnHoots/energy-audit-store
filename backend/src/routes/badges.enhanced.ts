/**
 * Enhanced Badge routes for the API
 * Handles badge definitions and user badge progress
 * Fixed route paths to match frontend expectations
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

// Log all badge-related requests for debugging
router.use((req, res, next) => {
  appLogger.info(`Badge request received: ${req.method} ${req.path}`, {
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
 * Get all badge definitions
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    appLogger.info('Fetching all badge definitions');
    const badges = await badgeService.getAllBadgeDefinitions();
    appLogger.info(`Returning ${badges.length} badge definitions`);
    res.json({ badges });
  } catch (error) {
    appLogger.error('Error fetching badges:', error);
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badge definitions' });
  }
});

/**
 * Get a specific badge definition
 */
router.get(
  '/:badgeId',
  [
    param('badgeId').isString().notEmpty().withMessage('Badge ID is required'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const badgeId = req.params.badgeId;
      appLogger.info(`Fetching badge definition for ${badgeId}`);
      const badge = await badgeService.getBadgeDefinition(badgeId);
      
      if (!badge) {
        appLogger.warn(`Badge not found: ${badgeId}`);
        return res.status(404).json({ error: 'Badge not found' });
      }
      
      res.json({ badge });
    } catch (error) {
      appLogger.error(`Error fetching badge ${req.params.badgeId}:`, error);
      console.error('Error fetching badge:', error);
      res.status(500).json({ error: 'Failed to fetch badge definition' });
    }
  }
);

export default router;