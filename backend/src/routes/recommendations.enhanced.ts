import express from 'express';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import type { AuthenticatedRequest } from '../types/auth.js';
import { recommendationUpdateService } from '../services/RecommendationUpdateService.js';

const router = express.Router();

// Middleware to log requests
router.use((req, res, next) => {
  appLogger.debug('Enhanced recommendations route accessed', createLogMetadata(req, {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body
  }));
  next();
});

/**
 * Enhanced endpoint to update recommendation status with persistence
 * Uses the RecommendationUpdateService to store user-specific updates
 */
router.put('/:id/status', authenticate, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, actualSavings, implementationDate } = req.body;
  const userId = req.user?.id;
  
  appLogger.info('Updating recommendation status', {
    recommendationId: id,
    status,
    actualSavings,
    implementationDate,
    userId
  });
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to update recommendation status.'
    });
  }
  
  // Validate status value
  if (!status || !['active', 'implemented'].includes(status)) {
    return res.status(400).json({
      error: 'Invalid status',
      message: 'Status must be "active" or "implemented".'
    });
  }
  
  // Validate actualSavings if provided
  if (actualSavings !== undefined && (typeof actualSavings !== 'number' || isNaN(actualSavings))) {
    return res.status(400).json({
      error: 'Invalid actual savings',
      message: 'Actual savings must be a valid number.'
    });
  }
  
  // Validate implementationDate if provided
  if (implementationDate && typeof implementationDate !== 'string') {
    return res.status(400).json({
      error: 'Invalid implementation date',
      message: 'Implementation date must be a valid date string (YYYY-MM-DD).'
    });
  }
  
  try {
    // First, verify that the recommendation exists and belongs to one of the user's audits
    const client = await pool.connect();
    try {
      const ownershipCheck = await client.query(`
        SELECT ea.user_id
        FROM audit_recommendations ar
        JOIN energy_audits ea ON ar.audit_id = ea.id
        WHERE ar.id = $1
      `, [id]);
      
      if (ownershipCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Recommendation not found',
          message: 'No recommendation found with the provided ID.'
        });
      }
      
      if (ownershipCheck.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Not authorized',
          message: 'You do not have permission to update this recommendation.'
        });
      }
    } finally {
      client.release();
    }
    
    // Save the update using the recommendation update service
    const updates: any = { status };
    
    if (actualSavings !== undefined) {
      updates.actualSavings = actualSavings;
    }
    
    if (implementationDate) {
      updates.implementationDate = implementationDate;
    } else if (status === 'implemented') {
      // If implementing and no date provided, use current date
      updates.implementationDate = new Date().toISOString().split('T')[0];
    }
    
    const result = await recommendationUpdateService.saveUpdate(id, userId, updates);
    
    appLogger.info('Recommendation status updated successfully', {
      recommendationId: id,
      userId,
      status,
      actualSavings,
      implementationDate: updates.implementationDate
    });
    
    res.json({
      message: 'Status updated successfully',
      recommendation: {
        id,
        status: result.status,
        actualSavings: result.actualSavings,
        implementationDate: result.implementationDate
      }
    });
  } catch (error) {
    appLogger.error('Error updating recommendation status', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recommendationId: id,
      userId
    });
    
    res.status(500).json({
      error: 'Failed to update recommendation status',
      message: 'An error occurred while updating the recommendation status.'
    });
  }
});

/**
 * Enhanced endpoint to update recommendation priority with persistence
 * Uses the RecommendationUpdateService to store user-specific updates
 */
router.put('/:id/priority', authenticate, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { priority } = req.body;
  const userId = req.user?.id;
  
  appLogger.info('Updating recommendation priority', {
    recommendationId: id,
    priority,
    userId
  });
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to update recommendation priority.'
    });
  }
  
  // Validate priority value
  if (!priority || !['high', 'medium', 'low'].includes(priority)) {
    return res.status(400).json({
      error: 'Invalid priority',
      message: 'Priority must be "high", "medium", or "low".'
    });
  }
  
  try {
    // First, verify that the recommendation exists and belongs to one of the user's audits
    const client = await pool.connect();
    try {
      const ownershipCheck = await client.query(`
        SELECT ea.user_id
        FROM audit_recommendations ar
        JOIN energy_audits ea ON ar.audit_id = ea.id
        WHERE ar.id = $1
      `, [id]);
      
      if (ownershipCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Recommendation not found',
          message: 'No recommendation found with the provided ID.'
        });
      }
      
      if (ownershipCheck.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Not authorized',
          message: 'You do not have permission to update this recommendation.'
        });
      }
    } finally {
      client.release();
    }
    
    // Save the update using the recommendation update service
    const result = await recommendationUpdateService.saveUpdate(id, userId, { priority });
    
    appLogger.info('Recommendation priority updated successfully', {
      recommendationId: id,
      userId,
      priority
    });
    
    res.json({
      message: 'Priority updated successfully',
      recommendation: {
        id,
        priority: result.priority
      }
    });
  } catch (error) {
    appLogger.error('Error updating recommendation priority', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recommendationId: id,
      userId
    });
    
    res.status(500).json({
      error: 'Failed to update recommendation priority',
      message: 'An error occurred while updating the recommendation priority.'
    });
  }
});

/**
 * Enhanced endpoint to update implementation details with persistence
 * Uses the RecommendationUpdateService to store user-specific updates
 */
router.put('/:id/implementation-details', authenticate, async (req: AuthenticatedRequest, res) => {
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
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to update implementation details.'
    });
  }
  
  // Validate implementation date
  if (!implementationDate || typeof implementationDate !== 'string') {
    return res.status(400).json({
      error: 'Invalid implementation date',
      message: 'Implementation date is required and must be a valid date string (YYYY-MM-DD).'
    });
  }
  
  // Validate implementation cost
  if (implementationCost === undefined || typeof implementationCost !== 'number' || isNaN(implementationCost)) {
    return res.status(400).json({
      error: 'Invalid implementation cost',
      message: 'Implementation cost is required and must be a valid number.'
    });
  }
  
  try {
    // First, verify that the recommendation exists and belongs to one of the user's audits
    const client = await pool.connect();
    try {
      const ownershipCheck = await client.query(`
        SELECT ea.user_id
        FROM audit_recommendations ar
        JOIN energy_audits ea ON ar.audit_id = ea.id
        WHERE ar.id = $1
      `, [id]);
      
      if (ownershipCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Recommendation not found',
          message: 'No recommendation found with the provided ID.'
        });
      }
      
      if (ownershipCheck.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'Not authorized',
          message: 'You do not have permission to update this recommendation.'
        });
      }
    } finally {
      client.release();
    }
    
    // Save the update using the recommendation update service
    const result = await recommendationUpdateService.saveUpdate(id, userId, {
      implementationDate,
      implementationCost,
      // When implementation details are set, also mark as implemented
      status: 'implemented'
    });
    
    appLogger.info('Implementation details updated successfully', {
      recommendationId: id,
      userId,
      implementationDate,
      implementationCost
    });
    
    res.json({
      message: 'Implementation details updated successfully',
      details: {
        implementationDate: result.implementationDate,
        implementationCost: result.implementationCost,
        status: result.status
      }
    });
  } catch (error) {
    appLogger.error('Error updating implementation details', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recommendationId: id,
      userId
    });
    
    res.status(500).json({
      error: 'Failed to update implementation details',
      message: 'An error occurred while updating the implementation details.'
    });
  }
});

export default router;
