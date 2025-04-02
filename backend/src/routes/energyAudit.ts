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

// Generate report data for interactive preview
router.get('/:id/report-data', optionalTokenValidation, async (req: AuthenticatedRequest, res: Response) => {
  // Define variables outside try/catch for error logging
  const userId = req.user?.id;
  const auditId = req.params.id;
  let audit: any = null;
  let recommendations: any[] = [];
  let transformedAudit: Partial<EnergyAuditData> = {};

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
    // ENHANCED: Safe transformation with defaults for missing data
    try {
      transformedAudit = safelyTransformAuditData(audit);
      
      // Additional validation
      if (!transformedAudit.basicInfo || !transformedAudit.homeDetails) {
        throw new Error('Missing basic information or home details');
      }
      
      appLogger.debug('Transformed audit data for report data generation:', createLogMetadata(req, {
        originalKeys: Object.keys(audit),
        transformedKeys: Object.keys(transformedAudit),
        hasProductPreferences: !!audit.product_preferences,
        productPreferencesType: audit.product_preferences ? typeof audit.product_preferences : 'undefined'
      }));
    } catch (error) {
      const transformError = error as Error;
      appLogger.error('Error transforming audit data for report data:', createLogMetadata(req, {
        error: transformError,
        auditId: auditId,
        auditKeys: audit ? Object.keys(audit) : []
      }));
      throw new Error(`Invalid audit data structure: ${transformError.message}`);
    }
    
    const reportData: ReportData = await reportGenerationService.prepareReportData(transformedAudit as EnergyAuditData, recommendations);

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
/**
 * Enhanced function to safely transform audit data from database format (snake_case)
 * to the expected EnergyAuditData format (camelCase) with proper defaults
 */
function safelyTransformAuditData(audit: any): EnergyAuditData {
  if (!audit) {
    throw new Error('Cannot transform null or undefined audit data');
  }
  
  // Create a deep copy to avoid modifying the original
  const auditCopy = JSON.parse(JSON.stringify(audit));
  
  // Set up all required sections with defaults if needed
  const transformedAudit: EnergyAuditData = {
    basicInfo: typeof auditCopy.basic_info === 'string' 
      ? JSON.parse(auditCopy.basic_info) 
      : (auditCopy.basic_info || {}),
      
    homeDetails: typeof auditCopy.home_details === 'string' 
      ? JSON.parse(auditCopy.home_details) 
      : (auditCopy.home_details || {}),
      
    currentConditions: typeof auditCopy.current_conditions === 'string' 
      ? JSON.parse(auditCopy.current_conditions) 
      : (auditCopy.current_conditions || {}),
      
    heatingCooling: typeof auditCopy.heating_cooling === 'string' 
      ? JSON.parse(auditCopy.heating_cooling) 
      : (auditCopy.heating_cooling || {}),
      
    energyConsumption: typeof auditCopy.energy_consumption === 'string' 
      ? JSON.parse(auditCopy.energy_consumption) 
      : (auditCopy.energy_consumption || {})
  };
  
  // Add product preferences if they exist
  if (auditCopy.product_preferences) {
    transformedAudit.productPreferences = typeof auditCopy.product_preferences === 'string'
      ? JSON.parse(auditCopy.product_preferences)
      : auditCopy.product_preferences;
  }
  
  // Ensure required nested objects exist with reasonable defaults
  if (!transformedAudit.currentConditions.insulation) {
    transformedAudit.currentConditions.insulation = {
      attic: 'unknown',
      walls: 'unknown',
      basement: 'unknown',
      floor: 'unknown'
    };
  }
  
  // Ensure heating system exists
  if (!transformedAudit.heatingCooling.heatingSystem) {
    transformedAudit.heatingCooling.heatingSystem = {
      type: 'unknown',
      fuel: 'unknown',
      fuelType: 'unknown',
      age: 0,
      efficiency: 0,
      lastService: 'unknown'
    };
  }
  
  // Ensure cooling system exists
  if (!transformedAudit.heatingCooling.coolingSystem) {
    transformedAudit.heatingCooling.coolingSystem = {
      type: 'unknown',
      age: 0,
      efficiency: 0
    };
  }
  
  // Log successful transformation
  appLogger.debug('Transformed audit data successfully', {
    originalKeys: Object.keys(audit),
    transformedKeys: Object.keys(transformedAudit)
  });
  
  return transformedAudit;
}

// Generate PDF report [ENHANCED with better data validation]
router.get('/:id/report', [optionalTokenValidation, ...reportGenerationLimiter], async (req: AuthenticatedRequest, res: Response) => {
  // Define variables outside try/catch for error logging
  const userId = req.user?.id;
  const auditId = req.params.id;
  let audit: any = null;
  let recommendations: any[] = [];
  let transformedAudit: EnergyAuditData;

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
    
    // Use the enhanced transformation function to ensure all required data is present
    try {
      transformedAudit = safelyTransformAuditData(audit);
      
      // Additional validation
      if (!transformedAudit.basicInfo || !transformedAudit.homeDetails) {
        throw new Error('Missing basic information or home details');
      }
      
      // Log the transformed audit structure for debugging
      appLogger.debug('Audit data structure for report generation:', createLogMetadata(req, {
        auditId: auditId,
        transformedStructure: {
          basicInfoKeys: Object.keys(transformedAudit.basicInfo),
          homeDetailsKeys: Object.keys(transformedAudit.homeDetails),
          currentConditionsKeys: Object.keys(transformedAudit.currentConditions),
          heatingCoolingKeys: Object.keys(transformedAudit.heatingCooling),
          energyConsumptionKeys: Object.keys(transformedAudit.energyConsumption)
        }
      }));
    } catch (error) {
      const transformError = error as Error;
      appLogger.error('Error transforming audit data:', createLogMetadata(req, {
        error: transformError,
        auditId: auditId,
        auditKeys: audit ? Object.keys(audit) : []
      }));
      throw new Error(`Invalid audit data structure: ${transformError.message}`);
    }
    
    // Generate the PDF report
    const report = await reportGenerationService.generateReport(transformedAudit, recommendations);

    // Send the PDF as a download
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
