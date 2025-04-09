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

// Validate and normalize implementation status value to prevent DB errors
function validateImplementationStatus(status: string): string {
  const validImplementationStatuses = ['pending', 'in-progress', 'implemented', 'rejected', 'deferred'];
  // Convert status to lowercase and trim whitespace
  status = status.toLowerCase().trim();
  
  // Check if status is valid
  if (!validImplementationStatuses.includes(status)) {
    appLogger.warn(`Invalid implementation status value received: ${status}, defaulting to 'pending'`);
    return 'pending';
  }
  
  return status;
}

// Format date string to timestamp format
function formatDateString(dateStr: string): string {
  try {
    // Handle ISO date string conversion
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString();
  } catch (error) {
    appLogger.warn(`Invalid date format: ${dateStr}, using current date`);
    return new Date().toISOString();
  }
}

// Update recommendation implementation status
router.put('/:id/status', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const implementationStatus = validateImplementationStatus(req.body.status);
    const userId = req.user?.id;

    appLogger.info('Updating recommendation implementation status', {
      recommendationId: id,
      newStatus: implementationStatus,
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

    // Update implementation_status instead of status
    const updateResult = await client.query(`
      UPDATE audit_recommendations
      SET implementation_status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, implementation_status
    `, [implementationStatus, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    appLogger.info('Implementation status updated successfully', {
      recommendationId: id,
      implementationStatus: updateResult.rows[0].implementation_status
    });

    res.json({ 
      message: 'Implementation status updated successfully',
      recommendation: {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].implementation_status
      }
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
    const actualSavings = parseFloat(req.body.actualSavings) || null;
    const userId = req.user?.id;

    appLogger.info('Updating implementation details', {
      recommendationId: id,
      implementationDate,
      implementationCost,
      actualSavings,
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

    // Also update the implementation_status to 'implemented' if it's being implemented
    const queryParams = [];
    let querySetClause = '';
    
    // Always update implementation_date and implementation_cost
    querySetClause = `
      implementation_date = $1,
      implementation_cost = $2,
    `;
    queryParams.push(implementationDate, implementationCost);
    
    // Add actual_savings if provided
    if (actualSavings !== null) {
      querySetClause += `actual_savings = $${queryParams.length + 1},\n`;
      queryParams.push(actualSavings);
    }
    
    // Always set implementation_status to 'implemented' and update timestamp
    querySetClause += `
      implementation_status = 'implemented',
      updated_at = CURRENT_TIMESTAMP
    `;
    
    // Add the id parameter
    queryParams.push(id);

    // Update implementation details with all the parameters
    const updateQuery = `
      UPDATE audit_recommendations
      SET ${querySetClause}
      WHERE id = $${queryParams.length}
      RETURNING id, implementation_date, implementation_cost, implementation_status, actual_savings
    `;
    
    const updateResult = await client.query(updateQuery, queryParams);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    appLogger.info('Implementation details updated successfully', {
      recommendationId: id,
      date: updateResult.rows[0].implementation_date,
      cost: updateResult.rows[0].implementation_cost,
      status: updateResult.rows[0].implementation_status,
      savings: updateResult.rows[0].actual_savings
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
    const actualSavings = parseFloat(req.body.actualSavings) || 0;
    const notes = req.body.notes || '';
    const month = req.body.month || new Date().toISOString().split('T')[0].substring(0, 7) + '-01'; // Default to first day of current month
    const userId = req.user?.id;

    appLogger.info('Updating recommendation savings', {
      recommendationId: id,
      actualSavings,
      month,
      notes,
      userId,
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

    // First check if recommendation exists
    const checkResult = await client.query(`
      SELECT id, implementation_status FROM audit_recommendations WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Recommendation with ID ${id} not found` });
    }

    // Update recommendation actual_savings and last_savings_update
    const updateResult = await client.query(`
      UPDATE audit_recommendations
      SET actual_savings = $1,
          last_savings_update = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, actual_savings, last_savings_update
    `, [actualSavings, id]);

    // Update monthly savings
    const monthlySavingsResult = await client.query(`
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
      RETURNING month, actual_savings, notes
    `, [userId, id, month, actualSavings, notes]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    appLogger.info('Savings updated successfully', {
      recommendationId: id, 
      actualSavings: updateResult.rows[0].actual_savings,
      monthlyEntry: monthlySavingsResult.rows[0]
    });

    res.json({ 
      message: 'Savings updated successfully',
      savings: {
        totalSavings: updateResult.rows[0].actual_savings,
        lastUpdated: updateResult.rows[0].last_savings_update,
        monthlySavings: monthlySavingsResult.rows[0]
      }
    });
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
