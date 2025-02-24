import express from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { appLogger } from '../config/logger.js';
import { dashboardService } from '../services/dashboardService.js';
import pool from '../config/database.js';

const router = express.Router();

// Update recommendation status
router.put('/:id/status', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, implementationDate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await client.query('BEGIN');

    // Verify ownership
    const ownershipCheck = await client.query(`
      SELECT ea.user_id
      FROM audit_recommendations ar
      JOIN energy_audits ea ON ar.audit_id = ea.id
      WHERE ar.id = $1
    `, [id]);

    if (ownershipCheck.rows.length === 0 || ownershipCheck.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to update this recommendation' });
    }

    // Update recommendation status
    await client.query(`
      UPDATE audit_recommendations
      SET status = $1,
          implementation_date = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [status, implementationDate, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error updating recommendation status:', { error });
    res.status(500).json({ error: 'Failed to update recommendation status' });
  } finally {
    client.release();
  }
});

// Update recommendation savings
router.put('/:id/savings', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { actualSavings, implementationCost, notes, month } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await client.query('BEGIN');

    // Verify ownership
    const ownershipCheck = await client.query(`
      SELECT ea.user_id
      FROM audit_recommendations ar
      JOIN energy_audits ea ON ar.audit_id = ea.id
      WHERE ar.id = $1
    `, [id]);

    if (ownershipCheck.rows.length === 0 || ownershipCheck.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to update this recommendation' });
    }

    // Update recommendation savings
    await client.query(`
      UPDATE audit_recommendations
      SET actual_savings = $1,
          implementation_cost = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [actualSavings, implementationCost, id]);

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
    appLogger.error('Error updating recommendation savings:', { error });
    res.status(500).json({ error: 'Failed to update recommendation savings' });
  } finally {
    client.release();
  }
});

export default router;
