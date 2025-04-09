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

// Validate and normalize status value to prevent DB errors
function validateStatus(status: string): string {
  const validStatuses = ['pending', 'in-progress', 'implemented', 'rejected', 'deferred'];
  // Convert status to lowercase and trim whitespace
  status = status.toLowerCase().trim();
  
  // Check if status is valid
  if (!validStatuses.includes(status)) {
    appLogger.warn(`Invalid status value received: ${status}, defaulting to 'pending'`);
    return 'pending';
  }
  
  return status;
}

// Format date string to YYYY-MM-DD format
function formatDateString(dateStr: string): string {
  try {
    // Handle ISO date string conversion to YYYY-MM-DD
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    appLogger.warn(`Invalid date format: ${dateStr}, using current date`);
    return new Date().toISOString().split('T')[0];
  }
}

// Update recommendation status
router.put('/:id/status', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const status = validateStatus(req.body.status);
    const userId = req.user?.id;

    appLogger.info('Updating recommendation status', {
      recommendationId: id,
      newStatus: status,
      userId,
      originalStatus: req.body.status,
      requestBody: JSON.stringify(req.body)
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

    // First check if recommendation exists to get better error messages
    const checkResult = await client.query(`
      SELECT id FROM audit_recommendations WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Recommendation with ID ${id} not found` });
    }

    // Update recommendation status only
    const updateResult = await client.query(`
      UPDATE audit_recommendations
      SET status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status
    `, [status, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    appLogger.info('Status updated successfully', {
      recommendationId: id,
      status: updateResult.rows[0].status
    });

    res.json({ 
      message: 'Status updated successfully',
      recommendation: updateResult.rows[0]
    });
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
    const implementationDate = formatDateString(req.body.implementationDate);
    const implementationCost = parseFloat(req.body.implementationCost) || 0;
    const userId = req.user?.id;

    appLogger.info('Updating implementation details', {
      recommendationId: id,
      implementationDate,
      implementationCost,
      userId,
      originalDate: req.body.implementationDate,
      requestBody: JSON.stringify(req.body)
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

    // First check if recommendation exists to get better error messages
    const checkResult = await client.query(`
      SELECT id FROM audit_recommendations WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Recommendation with ID ${id} not found` });
    }

    // Update implementation details only
    const updateResult = await client.query(`
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

    appLogger.info('Implementation details updated successfully', {
      recommendationId: id,
      date: updateResult.rows[0].implementation_date,
      cost: updateResult.rows[0].implementation_cost
    });

    res.json({ 
      message: 'Implementation details updated successfully',
      details: updateResult.rows[0]
    });
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
