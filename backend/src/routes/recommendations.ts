// backend/src/routes/recommendations.ts

import express from 'express';
import { authenticate, validateEmailVerification } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';
import { RecommendationService } from '../services/recommendationService';
import { pool } from '../config/database';
import { EnergyAuditService } from '../services/EnergyAuditService';

const router = express.Router();
const recommendationService = new RecommendationService(pool);
const auditService = new EnergyAuditService(pool);

/**
 * @route GET /api/recommendations
 * @desc Get personalized recommendations for the authenticated user
 * @access Private
 */
router.get('/',
  authenticate,
  validateEmailVerification,
  rateLimiter,
  async (req, res) => {
    try {
      const recommendations = await recommendationService.getUserRecommendations(req.user!.userId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route POST /api/recommendations/generate
 * @desc Generate new recommendations based on audit data
 * @access Private
 */
router.post('/generate',
  authenticate,
  validateEmailVerification,
  async (req, res) => {
    try {
      const { auditId } = req.body;

      // Verify audit belongs to user
      const audit = await auditService.getAuditById(auditId);
      if (!audit || audit.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Unauthorized access to audit' });
      }

      const recommendations = await recommendationService.generateRecommendations(
        req.user!.userId,
        audit
      );

      await recommendationService.storeRecommendations(recommendations);

      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route GET /api/recommendations/products
 * @desc Get product recommendations based on user profile and history
 * @access Private
 */
router.get('/products',
  authenticate,
  rateLimiter,
  async (req, res) => {
    try {
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 10;

      const recommendations = await recommendationService.getProductRecommendations(
        req.user!.userId,
        { category, limit }
      );

      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route GET /api/recommendations/savings
 * @desc Get energy savings recommendations
 * @access Private
 */
router.get('/savings',
  authenticate,
  rateLimiter,
  async (req, res) => {
    try {
      const savings = await recommendationService.getEnergySavingsRecommendations(
        req.user!.userId
      );
      res.json(savings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route POST /api/recommendations/:id/feedback
 * @desc Submit feedback on a recommendation
 * @access Private
 */
router.post('/:id/feedback',
  authenticate,
  async (req, res) => {
    try {
      const { helpful, feedback } = req.body;
      
      await pool.query(
        `INSERT INTO recommendation_feedback (
          recommendation_id, user_id, helpful, feedback
        ) VALUES ($1, $2, $3, $4)`,
        [req.params.id, req.user!.userId, helpful, feedback]
      );

      // Update recommendation effectiveness score
      await recommendationService.updateRecommendationScore(req.params.id, helpful);

      res.status(200).end();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route POST /api/recommendations/:id/implement
 * @desc Mark a recommendation as implemented
 * @access Private
 */
router.post('/:id/implement',
  authenticate,
  async (req, res) => {
    try {
      const { implementationDate, notes } = req.body;

      const result = await pool.query(
        `UPDATE recommendations 
         SET implemented = true,
             implementation_date = $1,
             implementation_notes = $2
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [implementationDate, notes, req.params.id, req.user!.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Recommendation not found' });
      }

      // Update user progress
      await pool.query(
        `UPDATE user_progress 
         SET implementations_count = implementations_count + 1,
             total_points = total_points + 100
         WHERE user_id = $1`,
        [req.user!.userId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @route GET /api/recommendations/progress
 * @desc Get implementation progress of recommendations
 * @access Private
 */
router.get('/progress',
  authenticate,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_recommendations,
          COUNT(CASE WHEN implemented THEN 1 END) as implemented_count,
          SUM(estimated_savings) as potential_savings,
          SUM(CASE WHEN implemented THEN estimated_savings ELSE 0 END) as achieved_savings
         FROM recommendations
         WHERE user_id = $1`,
        [req.user!.userId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;