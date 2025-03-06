import express, { Request, Response, NextFunction } from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { reportGenerationLimiter } from '../middleware/reportRateLimit.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import { reportGenerationService } from '../services/ReportGenerationService.js';
import { EnergyAuditService } from '../services/EnergyAuditService.js';
import { cache } from '../config/cache.js';
import { Pool } from 'pg';
import { EnergyAuditData } from '../types/energyAudit.js';
import { AuthenticatedRequest } from '../types/auth.js';

// Import the configured pool
import { pool } from '../config/database.js';
const energyAuditService = new EnergyAuditService(pool);

const router = express.Router();

// Get user's energy audits
router.get('/', validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const audits = await energyAuditService.getAuditHistory(userId);
    res.json(audits);
  } catch (error) {
    appLogger.error('Error fetching energy audits:', createLogMetadata(req, { error }));
    res.status(500).json({ error: 'Failed to fetch energy audits' });
  }
});

// Get audits by client ID (for anonymous users)
router.get('/client/:clientId', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const audits = await energyAuditService.getAuditsByClientId(clientId);
    res.json(audits);
  } catch (error) {
    appLogger.error('Error fetching client audits:', createLogMetadata(req, { error }));
    res.status(500).json({ error: 'Failed to fetch energy audits' });
  }
});

// Get specific audit
router.get('/:id', optionalTokenValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const auditId = req.params.id;

    const audit = await energyAuditService.getAuditById(auditId);
    
    // If audit belongs to a user, verify ownership
    if (audit.userId && audit.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this audit' });
    }

    res.json(audit);
  } catch (error) {
    appLogger.error('Error fetching energy audit:', createLogMetadata(req, { error }));
    res.status(500).json({ error: 'Failed to fetch energy audit' });
  }
});

// Create new audit
router.post('/', optionalTokenValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    // Only generate a client ID for anonymous users
    const clientId = userId ? null : (req.body.clientId || `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`);
    
    appLogger.info('Processing energy audit submission:', createLogMetadata(req, {
      hasUserId: !!userId,
      userId: userId || 'none',
      hasClientId: !!clientId,
      clientId: clientId || 'none',
      authHeader: !!req.headers.authorization,
      contentType: req.headers['content-type'],
      cookies: Object.keys(req.cookies),
      hasAccessToken: !!req.cookies.accessToken,
      user: req.user || 'none'
    }));

    if (!req.body.auditData) {
      appLogger.error('Missing audit data in request');
      return res.status(400).json({ error: 'Audit data is required' });
    }

    const { auditData } = req.body as { 
      auditData: EnergyAuditData;
    };

    // Log the request data for debugging
    appLogger.debug('Audit submission details:', createLogMetadata(req, {
      clientId: clientId,
      auditDataSections: Object.keys(auditData),
      dbConfig: {
        database: pool.options.database,
        user: pool.options.user,
        host: pool.options.host
      }
    }));

    try {
      // Test database connection before creating audit
      await pool.query('SELECT NOW()');
      appLogger.info('Database connection verified before audit creation');
      
      const audit = await energyAuditService.createAudit(auditData, userId, clientId);
      appLogger.info('Energy audit created successfully:', createLogMetadata(req, { 
        auditId: audit,
        userId: userId || 'anonymous',
        clientId
      }));

      if (userId) {
        // Invalidate relevant caches for authenticated users
        await cache.del(`user_audits:${userId}`);
        await cache.del(`dashboard_stats:${userId}`);
      }

      res.status(201).json({ id: audit, clientId });
    } catch (serviceError) {
      appLogger.error('Service error creating energy audit:', createLogMetadata(req, {
        error: serviceError,
        clientId,
        userId: userId || 'anonymous'
      }));
      
      // Check if it's a validation error
      if (serviceError instanceof Error && serviceError.message.includes('Invalid audit data')) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: serviceError.message
        });
      }
      
      throw serviceError; // Re-throw for general error handling
    }
  } catch (error) {
    const clientId = req.body?.clientId || 'unknown';
    const userId = req.user?.id;
    
    appLogger.error('Unhandled error in energy audit creation:', createLogMetadata(req, {
      error,
      clientId,
      userId: userId || 'anonymous'
    }));
    
    res.status(500).json({ 
      error: 'Failed to create energy audit',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Associate anonymous audits with user
router.post('/associate', validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { clientId } = req.body as { clientId: string };

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    await energyAuditService.associateAuditsWithUser(userId, clientId);

    // Invalidate relevant caches
    await cache.del(`user_audits:${userId}`);
    await cache.del(`dashboard_stats:${userId}`);

    res.status(200).json({ message: 'Audits associated successfully' });
  } catch (error) {
    appLogger.error('Error associating audits:', createLogMetadata(req, { error }));
    res.status(500).json({ error: 'Failed to associate audits' });
  }
});

// Update audit
router.put('/:id', validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const auditId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const auditData = req.body;
    const audit = await energyAuditService.updateAudit(auditId, userId, auditData);

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Invalidate relevant caches
    await cache.del(`user_audits:${userId}`);
    await cache.del(`audit:${auditId}`);
    await cache.del(`dashboard_stats:${userId}`);

    res.json(audit);
  } catch (error) {
    appLogger.error('Error updating energy audit:', createLogMetadata(req, { error }));
    res.status(500).json({ error: 'Failed to update energy audit' });
  }
});

// Delete audit
router.delete('/:id', validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const auditId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await energyAuditService.deleteAudit(auditId, userId);

    // Invalidate relevant caches
    await cache.del(`user_audits:${userId}`);
    await cache.del(`audit:${auditId}`);
    await cache.del(`dashboard_stats:${userId}`);

    res.status(204).send();
  } catch (error) {
    appLogger.error('Error deleting energy audit:', createLogMetadata(req, { error }));
    res.status(500).json({ error: 'Failed to delete energy audit' });
  }
});

// Generate PDF report
router.get('/:id/report', [validateToken, ...reportGenerationLimiter], async (req: AuthenticatedRequest, res: Response) => {
  // Define variables outside try/catch for error logging
  const userId = req.user?.id;
  const auditId = req.params.id;
  let audit: any = null;
  let recommendations: any[] = [];

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate audit ID
    if (!auditId || auditId === 'null' || auditId === 'undefined') {
      return res.status(400).json({ error: 'Invalid audit ID' });
    }

    audit = await energyAuditService.getAuditById(auditId);
    if (!audit || (audit.userId && audit.userId !== userId)) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    recommendations = await energyAuditService.getRecommendations(auditId);
    
    // Transform the audit data to match the expected format for ReportGenerationService
    const transformedAudit = {
      basicInfo: typeof audit.basic_info === 'string' ? JSON.parse(audit.basic_info) : audit.basic_info,
      homeDetails: typeof audit.home_details === 'string' ? JSON.parse(audit.home_details) : audit.home_details,
      currentConditions: typeof audit.current_conditions === 'string' ? JSON.parse(audit.current_conditions) : audit.current_conditions,
      heatingCooling: typeof audit.heating_cooling === 'string' ? JSON.parse(audit.heating_cooling) : audit.heating_cooling,
      energyConsumption: typeof audit.energy_consumption === 'string' ? JSON.parse(audit.energy_consumption) : audit.energy_consumption
    };
    
    appLogger.debug('Transformed audit data for report generation:', createLogMetadata(req, {
      originalKeys: Object.keys(audit),
      transformedKeys: Object.keys(transformedAudit)
    }));
    
    const report = await reportGenerationService.generateReport(transformedAudit, recommendations);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=energy-audit-report-${auditId}.pdf`);
    res.send(report);

    appLogger.info('Report generated successfully:', createLogMetadata(req, { auditId }));
  } catch (error) {
    // Enhanced error logging for PDF generation
    appLogger.error('Error generating report:', createLogMetadata(req, { 
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      auditId: auditId,
      userId: userId,
      recommendationsCount: recommendations ? recommendations.length : 0,
      auditDataKeys: audit ? Object.keys(audit) : []
    }));
    
    // Return detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to generate report' 
      : `Failed to generate report: ${error instanceof Error ? error.message : String(error)}`;
    
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
