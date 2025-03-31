import express, { Response } from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import { EnergyAuditService } from '../services/EnergyAuditService.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();
const energyAuditService = new EnergyAuditService(pool);

/**
 * Get paginated audit history for the authenticated user
 * This endpoint supports pagination via query parameters:
 * - page: Page number (default: 1)
 * - limit: Records per page (default: 5)
 */
router.get('/', validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Parse pagination parameters from query string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters',
        message: 'Page must be >= 1 and limit must be between 1 and 50'
      });
    }

    // Get paginated audit history
    const result = await energyAuditService.getPaginatedAuditHistory(userId, page, limit);

    res.json(result);
  } catch (error) {
    appLogger.error('Error fetching paginated audit history:', createLogMetadata(req, { error }));
    res.status(500).json({ 
      error: 'Failed to fetch audit history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
