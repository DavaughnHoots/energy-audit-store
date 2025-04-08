import express, { Response } from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { pool } from '../config/database.js';
import { AuditHistoryService } from '../services/AuditHistoryService.js';

const router = express.Router();
const auditHistoryService = new AuditHistoryService(pool);

// Debug logging middleware for the route
router.use((req, res, next) => {
  appLogger.debug('Enhanced audit history route accessed', createLogMetadata(req, {
    query: req.query,
    user: req.user?.id || 'none',
    path: req.path
  }));
  next();
});

/**
 * Get paginated audit history for the authenticated user
 * This route uses the enhanced AuditHistoryService with better error handling
 * and simplified queries to avoid 500 errors
 */
router.get('/', validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    appLogger.info('Fetching audit history (enhanced route)', createLogMetadata(req));
    
    const userId = req.user?.id;
    if (!userId) {
      // Use 401 for authentication errors
      appLogger.warn('Authentication required for audit history', createLogMetadata(req));
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to view audit history'
      });
    }

    // Parse pagination parameters with sensible defaults and limits
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 5));

    // Get paginated audit history using the enhanced service
    try {
      const result = await auditHistoryService.getAuditHistory(userId, page, limit);
      
      appLogger.info('Successfully retrieved audit history', createLogMetadata(req, {
        count: result.audits.length,
        page,
        limit,
        totalPages: result.pagination.totalPages
      }));
      
      res.json(result);
    } catch (serviceError: any) {
      // Handle specific error codes from the service
      const statusCode = serviceError.statusCode || 500;
      const errorMessage = serviceError.message || 'Unknown service error';
      
      appLogger.error('Error in audit history service:', createLogMetadata(req, { 
        statusCode,
        errorMessage,
        stack: serviceError.stack
      }));
      
      // Send appropriate error response
      res.status(statusCode).json({ 
        error: 'Failed to fetch audit history',
        message: errorMessage
      });
    }
  } catch (error: any) {
    // Global error handler for uncaught exceptions
    appLogger.error('Uncaught error in audit history route:', createLogMetadata(req, { 
      error,
      message: error.message || 'Unknown error',
      stack: error.stack
    }));
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
});

/**
 * Health check endpoint for the audit history service
 * This can be used to verify that the database connection is working
 * without needing to fetch real data
 */
router.get('/health', async (req, res) => {
  try {
    // Get a client from the pool to verify connection
    const client = await pool.connect();
    
    // Run a simple query to test the database
    const result = await client.query('SELECT NOW() as time');
    
    // Release the client back to the pool
    client.release();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0]?.time || new Date().toISOString()
    });
  } catch (error: any) {
    appLogger.error('Health check failed:', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
