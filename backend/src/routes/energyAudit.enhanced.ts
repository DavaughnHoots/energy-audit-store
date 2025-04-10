import express, { Request, Response, NextFunction } from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { optionalTokenValidation } from '../middleware/optionalTokenValidation.js';
import { reportGenerationLimiter } from '../middleware/reportRateLimit.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import { reportGenerationService } from '../services/ReportGenerationService.js';
import { EnergyAuditService } from '../services/EnergyAuditService.js';
import { productRecommendationService } from '../services/productRecommendationService.js';
import { ReportData } from '../types/report.js';
import { cache } from '../config/cache.js';
import pkg from 'pg';
const { Pool } = pkg;
import { EnergyAuditData } from '../types/energyAudit.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { BadgeService } from '../services/BadgeService.js';

// Import the configured pool
import { pool } from '../config/database.js';
const energyAuditService = new EnergyAuditService(pool);
const badgeService = new BadgeService();

const router = express.Router();

// Helper function to record audit completion activity for badge evaluation
async function recordAuditCompletion(userId: string, auditId: string, auditData: any) {
  try {
    // Don't process badge activities for anonymous users
    if (!userId) return null;
    
    // Record audit completion activity
    const activity = await badgeService.recordActivity(
      userId,
      'audit_completed',
      {
        auditId,
        timestamp: new Date().toISOString(),
        auditType: auditData.basicInfo?.property_type || 'unknown',
        ...auditData
      }
    );
    
    // Evaluate audit badges
    const badgeUpdates = await badgeService.evaluateRelevantBadges(
      userId,
      'audit_completed'
    );
    
    appLogger.info('Audit completion recorded for badge evaluation', {
      userId,
      auditId,
      activity,
      badgeUpdates
    });
    
    return { activity, badgeUpdates };
  } catch (error) {
    appLogger.error('Error recording audit completion for badges', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      auditId
    });
    
    // Don't throw - we don't want badge errors to break the audit flow
    return { error };
  }
}

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

// Add a dedicated route for /user to fix the routing conflict
router.get('/user', validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const audits = await energyAuditService.getAuditHistory(userId);
    res.json(audits);
  } catch (error) {
    appLogger.error('Error fetching user audits:', createLogMetadata(req, { error }));
    res.status(500).json({ error: 'Failed to fetch user audits' });
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

    // Validate that auditId is a UUID to prevent invalid database queries
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(auditId)) {
      return res.status(400).json({ error: 'Invalid audit ID format' });
    }

    const audit = await energyAuditService.getAuditById(auditId);

    // If audit belongs to a user verify ownership
    if (audit.userId && audit.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this audit' });
    }

    // Add product recommendations if product preferences exist
    if (audit.product_preferences) {
      try {
        const productPreferences = typeof audit.product_preferences === 'string'
          ? JSON.parse(audit.product_preferences)
          : audit.product_preferences;

        const recommendations = await productRecommendationService.recommendProducts(productPreferences);

        // Add recommendations to the response
        audit.product_recommendations = recommendations;

        // Calculate potential savings for each category
        const savingsByCategory: Record<string, number> = {};

        for (const [category, products] of Object.entries(recommendations)) {
          savingsByCategory[category] = productRecommendationService.calculateProductSavings(products);
        }

        audit.product_savings = {
          byCategory: savingsByCategory,
          total: Object.values(savingsByCategory).reduce((sum, val) => sum + val, 0)
        };
      } catch (recError) {
        appLogger.error('Error fetching product recommendations:', createLogMetadata(req, { error: recError }));
        // Continue without recommendations if there's an error
      }
    }

    res.json(audit);
  } catch (error) {
    appLogger.error('Error fetching energy audit:', createLogMetadata(req, { error }));
    res.status(500).json({ error: 'Failed to fetch energy audit' });
  }
});

// Create new audit with badge integration
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

      const auditId = await energyAuditService.createAudit(auditData, userId, clientId);
      
      // Record audit completion for badge evaluation if user is authenticated
      let badgeResults = null;
      if (userId) {
        badgeResults = await recordAuditCompletion(userId, auditId, auditData);
      }
      
      appLogger.info('Energy audit created successfully:', createLogMetadata(req, {
        auditId,
        userId: userId || 'anonymous',
        clientId,
        badgeResults
      }));

      if (userId) {
        // Invalidate relevant caches for authenticated users
        await cache.del(`user_audits:${userId}`);
        await cache.del(`dashboard_stats:${userId}`);
      }

      res.status(201).json({ 
        id: auditId, 
        clientId,
        badges: badgeResults?.badgeUpdates || null
      });
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

    // Associate audits and get the array of associated audit IDs
    const associatedAuditIds = await energyAuditService.associateAuditsWithUser(userId, clientId);

    // Invalidate relevant caches
    await cache.del(`user_audits:${userId}`);
    await cache.del(`dashboard_stats:${userId}`);
    
    // Record audit completions for badges (for each associated audit)
    const badgeResults = [];
    if (associatedAuditIds && Array.isArray(associatedAuditIds) && associatedAuditIds.length > 0) {
      for (const auditId of associatedAuditIds) {
        try {
          // Get audit data
          const audit = await energyAuditService.getAuditById(auditId);
          
          // Get field values from audit (handling both string and object formats)
          const basicInfo = typeof audit.basic_info === 'string' 
            ? JSON.parse(audit.basic_info) 
            : audit.basic_info;
            
          const homeDetails = typeof audit.home_details === 'string' 
            ? JSON.parse(audit.home_details) 
            : audit.home_details;
            
          const currentConditions = typeof audit.current_conditions === 'string' 
            ? JSON.parse(audit.current_conditions) 
            : audit.current_conditions;
            
          const heatingCooling = typeof audit.heating_cooling === 'string' 
            ? JSON.parse(audit.heating_cooling) 
            : audit.heating_cooling;
            
          const energyConsumption = typeof audit.energy_consumption === 'string' 
            ? JSON.parse(audit.energy_consumption) 
            : audit.energy_consumption;
          
          // Transform audit data to match the expected format for badge evaluation
          const auditData = {
            basicInfo,
            homeDetails,
            currentConditions,
            heatingCooling,
            energyConsumption
          };
          
          // Record for badge evaluation
          const result = await recordAuditCompletion(userId, auditId, auditData);
          badgeResults.push({ auditId, result });
        } catch (badgeError) {
          appLogger.error('Error evaluating badges for associated audit', {
            error: badgeError,
            userId,
            auditId
          });
          // Continue with other audits
        }
      }
    }

    res.status(200).json({ 
      message: 'Audits associated successfully', 
      associatedAudits: associatedAuditIds,
      badges: badgeResults.length > 0 ? badgeResults : null
    });
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

// Generate report data for interactive preview
router.get('/:id/report-data', optionalTokenValidation, async (req: AuthenticatedRequest, res: Response) => {
  // Define variables outside try/catch for error logging
  const userId = req.user?.id;
  const auditId = req.params.id;
  let audit: any = null;
  let recommendations: any[] = [];

  try {
    // Validate audit ID
    if (!auditId || auditId === 'null' || auditId === 'undefined') {
      return res.status(400).json({ error: 'Invalid audit ID' });
    }

    audit = await energyAuditService.getAuditById(auditId);
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Only check ownership if the user is authenticated and the audit belongs to a user
    if (userId && audit.userId && audit.userId !== userId) {
      appLogger.warn('Unauthorized access attempt to audit report data:', createLogMetadata(req, {
        auditId,
        requestUserId: userId,
        auditUserId: audit.userId
      }));
      return res.status(403).json({ error: 'Not authorized to access this audit' });
    }

    recommendations = await energyAuditService.getRecommendations(auditId);

    // Transform the audit data to match the expected format for ReportGenerationService
    const transformedAudit = {
      basicInfo: typeof audit.basic_info === 'string' ? JSON.parse(audit.basic_info) : audit.basic_info,
      homeDetails: typeof audit.home_details === 'string' ? JSON.parse(audit.home_details) : audit.home_details,
      currentConditions: typeof audit.current_conditions === 'string' ? JSON.parse(audit.current_conditions) : audit.current_conditions,
      heatingCooling: typeof audit.heating_cooling === 'string' ? JSON.parse(audit.heating_cooling) : audit.heating_cooling,
      energyConsumption: typeof audit.energy_consumption === 'string' ? JSON.parse(audit.energy_consumption) : audit.energy_consumption,
      productPreferences: typeof audit.product_preferences === 'string' ? JSON.parse(audit.product_preferences) : audit.product_preferences
    };

    appLogger.debug('Transformed audit data for report data generation:', createLogMetadata(req, {
      originalKeys: Object.keys(audit),
      transformedKeys: Object.keys(transformedAudit)
    }));

    const reportData: ReportData = await reportGenerationService.prepareReportData(transformedAudit, recommendations);

    res.json(reportData);

    appLogger.info('Report data generated successfully:', createLogMetadata(req, { auditId }));
  } catch (error) {
    // Enhanced error logging for report data generation
    appLogger.error('Error generating report data:', createLogMetadata(req, {
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
      ? 'Failed to generate report data'
      : `Failed to generate report data: ${error instanceof Error ? error.message : String(error)}`;

    res.status(500).json({ error: errorMessage });
  }
});

// Generate PDF report
router.get('/:id/report', [optionalTokenValidation, ...reportGenerationLimiter], async (req: AuthenticatedRequest, res: Response) => {
  // Define variables outside try/catch for error logging
  const userId = req.user?.id;
  const auditId = req.params.id;
  let audit: any = null;
  let recommendations: any[] = [];

  try {
    // No longer requiring authentication for report generation
    // This allows both authenticated and anonymous users to download reports

    // Validate audit ID
    if (!auditId || auditId === 'null' || auditId === 'undefined') {
      return res.status(400).json({ error: 'Invalid audit ID' });
    }

    audit = await energyAuditService.getAuditById(auditId);
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Only check ownership if the user is authenticated and the audit belongs to a user
    if (userId && audit.userId && audit.userId !== userId) {
      appLogger.warn('Unauthorized access attempt to audit report:', createLogMetadata(req, {
        auditId,
        requestUserId: userId,
        auditUserId: audit.userId
      }));
      return res.status(403).json({ error: 'Not authorized to access this audit' });
    }

    recommendations = await energyAuditService.getRecommendations(auditId);

    // Transform the audit data to match the expected format for ReportGenerationService
    const transformedAudit = {
      basicInfo: typeof audit.basic_info === 'string' ? JSON.parse(audit.basic_info) : audit.basic_info,
      homeDetails: typeof audit.home_details === 'string' ? JSON.parse(audit.home_details) : audit.home_details,
      currentConditions: typeof audit.current_conditions === 'string' ? JSON.parse(audit.current_conditions) : audit.current_conditions,
      heatingCooling: typeof audit.heating_cooling === 'string' ? JSON.parse(audit.heating_cooling) : audit.heating_cooling,
      energyConsumption: typeof audit.energy_consumption === 'string' ? JSON.parse(audit.energy_consumption) : audit.energy_consumption,
      productPreferences: typeof audit.product_preferences === 'string' ? JSON.parse(audit.product_preferences) : audit.product_preferences
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
