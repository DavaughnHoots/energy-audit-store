import express from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { appLogger } from '../config/logger.js';
import { dashboardService } from '../services/dashboardService.js';
import { pool } from '../config/database.js';
import { PoolClient } from 'pg';

const router = express.Router();

// Helper function to check recommendation ownership
async function verifyRecommendationOwnership(client: PoolClient, recommendationId: string, userId: string): Promise<boolean> {
  const ownershipCheck = await client.query(`
    SELECT ea.user_id
    FROM audit_recommendations ar
    JOIN energy_audits ea ON ar.audit_id = ea.id
    WHERE ar.id = $1
  `, [recommendationId]);

  if (ownershipCheck.rows.length === 0 || ownershipCheck.rows[0].user_id !== userId) {
    return false;
  }
  return true;
}

// Update recommendation status
router.put('/:id/status', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    appLogger.info('Updating recommendation status', {
      recommendationId: id,
      newStatus: status,
      userId
    });

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await client.query('BEGIN');

    // Verify ownership
    const isOwner = await verifyRecommendationOwnership(client, id, userId);
    if (!isOwner) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to update this recommendation' });
    }

    // Update recommendation status only
    await client.query(`
      UPDATE audit_recommendations
      SET status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [status, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error updating recommendation status:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recommendationId: req.params.id
    });
    res.status(500).json({ error: 'Failed to update recommendation status' });
  } finally {
    client.release();
  }
});

// Update implementation details (separate endpoint)
router.put('/:id/implementation-details', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { implementationDate, implementationCost } = req.body;
    const userId = req.user?.id;

    appLogger.info('Updating implementation details', {
      recommendationId: id,
      implementationDate,
      implementationCost,
      userId
    });

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await client.query('BEGIN');

    // Verify ownership
    const isOwner = await verifyRecommendationOwnership(client, id, userId);
    if (!isOwner) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to update this recommendation' });
    }

    // Update implementation details only
    await client.query(`
      UPDATE audit_recommendations
      SET implementation_date = $1,
          implementation_cost = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [implementationDate, implementationCost, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    res.json({ message: 'Implementation details updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error updating implementation details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recommendationId: req.params.id
    });
    res.status(500).json({ error: 'Failed to update implementation details' });
  } finally {
    client.release();
  }
});

// Update recommendation savings
router.put('/:id/savings', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { actualSavings, notes, month } = req.body;
    const userId = req.user?.id;

    appLogger.info('Updating recommendation savings', {
      recommendationId: id,
      actualSavings,
      month,
      userId
    });

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await client.query('BEGIN');

    // Verify ownership
    const isOwner = await verifyRecommendationOwnership(client, id, userId);
    if (!isOwner) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to update this recommendation' });
    }

    // Update recommendation savings (no longer updating implementation_cost here)
    await client.query(`
      UPDATE audit_recommendations
      SET actual_savings = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [actualSavings, id]);

    // Update monthly savings
    await client.query(`
      INSERT INTO monthly_savings (
        user_id,
        recommendation_id,
        month,
        actual_savings,
        notes,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, recommendation_id, month)
      DO UPDATE SET
        actual_savings = EXCLUDED.actual_savings,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, id, month, actualSavings, notes]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    res.json({ message: 'Savings updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error updating recommendation savings:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recommendationId: req.params.id
    });
    res.status(500).json({ error: 'Failed to update recommendation savings' });
  } finally {
    client.release();
  }
});

export default router;
