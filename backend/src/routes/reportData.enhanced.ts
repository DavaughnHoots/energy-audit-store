import express, { Response } from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { AuditRecommendation } from '../types/energyAudit.js';
import { pool } from '../config/database.js';
import { EnergyAuditService } from '../services/EnergyAuditService.js';
import { reportDataService } from '../services/ReportDataService.js';

const router = express.Router();
const energyAuditService = new EnergyAuditService(pool);

/**
 * Debug logging middleware
 * Logs detailed information about each request to help debugging
 */
router.use((req, res, next) => {
  appLogger.debug('Enhanced report data route accessed', createLogMetadata(req, {
    params: req.params,
    query: req.query,
    user: req.user?.id || 'none',
    path: req.path
  }));
  next();
});

/**
 * Get health check status
 * Verifies database connection and service availability
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
      timestamp: result.rows[0]?.time || new Date().toISOString(),
      service: 'report-data-enhanced'
    });
  } catch (error: any) {
    appLogger.error('Report data health check failed:', { 
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

/**
 * Get report data for a specific audit
 * Uses ReportDataService for robust parsing and error handling
 * 
 * This route is registered to match the frontend's expected pattern:
 * /api/energy-audit/:id/report-data
 */
router.get('/', optionalTokenValidation, async (req: AuthenticatedRequest, res: Response) => {
  // Get the audit ID from the route parameter
  const auditId = req.params.id;
  const userId = req.user?.id;
  
  appLogger.info('Fetching report data with enhanced handler', createLogMetadata(req, {
    auditId,
    authenticatedUser: !!userId,
    path: req.path,
    originalUrl: req.originalUrl
  }));
  
  try {
    // Validate that we have a proper UUID format for the audit ID
    if (!auditId || auditId === 'undefined' || auditId === 'null') {
      appLogger.warn('Invalid audit ID format', createLogMetadata(req, {
        auditId,
        error: 'Invalid or missing audit ID'
      }));
      
      return res.status(400).json({
        error: 'Invalid audit ID',
        message: 'The audit ID must be a valid identifier.'
      });
    }
    
    // Check for UUID format using regex
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(auditId)) {
      appLogger.warn('Audit ID is not a valid UUID', createLogMetadata(req, {
        auditId,
        error: 'Invalid UUID format'
      }));
      
      return res.status(400).json({
        error: 'Invalid audit ID format', 
        message: 'The audit ID must be a valid UUID.'
      });
    }
    
    // Fetch the audit data with detailed error handling
    let audit = null;
    try {
      audit = await energyAuditService.getAuditById(auditId);
    } catch (error: any) {
      appLogger.error('Error fetching audit', createLogMetadata(req, {
        auditId,
        error: error.message,
        stack: error.stack
      }));
      
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to retrieve audit data. Please try again later.'
      });
    }
    
    // If no audit was found, return a 404
    if (!audit) {
      appLogger.warn('Audit not found', createLogMetadata(req, { auditId }));
      return res.status(404).json({
        error: 'Audit not found',
        message: 'No audit found with the provided ID.'
      });
    }
    
    // If the audit belongs to a user, check if the user is authorized
    if (audit.userId && userId !== audit.userId) {
      appLogger.warn('Unauthorized access attempt', createLogMetadata(req, {
        auditId,
        requestUser: userId,
        auditUser: audit.userId
      }));
      
      return res.status(403).json({
        error: 'Not authorized',
        message: 'You do not have permission to access this audit.'
      });
    }
    
    // Get recommendations for this audit
    let recommendations: AuditRecommendation[] = [];
    try {
      recommendations = await energyAuditService.getRecommendations(auditId);
      
      appLogger.debug('Retrieved recommendations', createLogMetadata(req, {
        auditId,
        recommendationsCount: recommendations.length
      }));
    } catch (error: any) {
      appLogger.error('Error fetching recommendations', createLogMetadata(req, {
        auditId,
        error: error.message,
        stack: error.stack
      }));
      
      // Continue without recommendations if there was an error
      recommendations = [];
    }
    
    // Generate report data using the specialized service
    try {
      const reportData = await reportDataService.generateReportData(audit, recommendations);
      
      appLogger.info('Report data generated successfully', createLogMetadata(req, {
        auditId,
        recommendationsCount: recommendations.length
      }));
      
      return res.json(reportData);
    } catch (error: any) {
      // Extract status code if it's a ReportDataError
      const statusCode = error.statusCode || 500;
      const errorMessage = error.message || 'Unknown error generating report data';
      
      appLogger.error('Error generating report data', createLogMetadata(req, {
        auditId,
        statusCode,
        error: errorMessage,
        stack: error.stack
      }));
      
      return res.status(statusCode).json({
        error: 'Report generation failed',
        message: errorMessage
      });
    }
  } catch (error: any) {
    // General error handler for unexpected errors
    appLogger.error('Unhandled error in report data endpoint', createLogMetadata(req, {
      auditId,
      error: error.message,
      stack: error.stack
    }));
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request.'
    });
  }
});

export default router;
