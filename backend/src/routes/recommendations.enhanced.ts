import express from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { appLogger } from '../config/logger.js';
import { dashboardService } from '../services/dashboardService.js';
import { pool } from '../config/database.js';

const router = express.Router();

/**
 * Update recommendation status
 * 
 * Enhanced version (v2.0): Now properly handles actualSavings parameter
 * along with status and implementationDate
 */
router.put('/:id/status', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, actualSavings, implementationDate } = req.body;
    const userId = req.user?.id;

    appLogger.info('Updating recommendation status', { 
      recommendationId: id,
      status,
      actualSavings,
      implementationDate
    });

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate status
    if (!status || (status !== 'active' && status !== 'implemented')) {
      return res.status(400).json({ error: 'Invalid status value. Must be "active" or "implemented"' });
    }

    // Validate actualSavings if provided
    if (actualSavings !== undefined && (typeof actualSavings !== 'number' || isNaN(actualSavings))) {
      return res.status(400).json({ error: 'Actual savings must be a valid number' });
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

    // Determine implementation date
    const finalImplementationDate = implementationDate || 
      (status === 'implemented' ? new Date().toISOString().split('T')[0] : null);

    // Update recommendation status with support for actualSavings
    await client.query(`
      UPDATE audit_recommendations
      SET status = $1,
          implementation_date = $2,
          actual_savings = COALESCE($3, actual_savings),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [status, finalImplementationDate, actualSavings, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    res.json({ 
      message: 'Status updated successfully',
      recommendation: {
        id,
        status,
        implementationDate: finalImplementationDate,
        actualSavings
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error updating recommendation status:', { error });
    res.status(500).json({ error: 'Failed to update recommendation status' });
  } finally {
    client.release();
  }
});

/**
 * Update recommendation savings
 * 
 * No changes needed to this endpoint, it works correctly
 */
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

/**
 * Update implementation details
 * 
 * New endpoint added in v2.0 to handle implementation date and cost updates
 */
router.put('/:id/implementation-details', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { implementationDate, implementationCost } = req.body;
    const userId = req.user?.id;

    appLogger.info('Updating implementation details', { 
      recommendationId: id, 
      implementationDate, 
      implementationCost 
    });

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate inputs
    if (!implementationDate) {
      return res.status(400).json({ error: 'Implementation date is required' });
    }

    if (typeof implementationCost !== 'number' || isNaN(implementationCost)) {
      return res.status(400).json({ error: 'Implementation cost must be a valid number' });
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

    // Update implementation details
    const result = await client.query(`
      UPDATE audit_recommendations
      SET implementation_date = $1,
          implementation_cost = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, implementation_date, implementation_cost
    `, [implementationDate, implementationCost, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    res.json({ 
      message: 'Implementation details updated successfully',
      details: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error updating implementation details:', { error });
    res.status(500).json({ error: 'Failed to update implementation details' });
  } finally {
    client.release();
  }
});

/**
 * Get recommendation details
 */
router.get('/:id', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get recommendation with ownership check
    const result = await pool.query(`
      SELECT ar.* 
      FROM audit_recommendations ar
      JOIN energy_audits ea ON ar.audit_id = ea.id
      WHERE ar.id = $1 AND ea.user_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found or not authorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    appLogger.error('Error fetching recommendation details:', { error });
    res.status(500).json({ error: 'Failed to fetch recommendation details' });
  }
});

export default router;
