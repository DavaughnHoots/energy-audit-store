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
 * to the expected EnergyAuditData format (camelCase) with comprehensive defaults
 * This function is aligned with ReportDataService for consistency between PDF and dashboard
 */
function safelyTransformAuditData(audit: any): EnergyAuditData {
  if (!audit) {
    throw new Error('Cannot transform null or undefined audit data');
  }
  
  // Create a deep copy to avoid modifying the original
  const auditCopy = JSON.parse(JSON.stringify(audit));
  
  // Set up all required sections with defaults if needed
  const transformedAudit: EnergyAuditData = {
    basicInfo: safeParseJson(auditCopy.basic_info) || safeParseJson(auditCopy.basicInfo) || {},
    homeDetails: safeParseJson(auditCopy.home_details) || safeParseJson(auditCopy.homeDetails) || {},
    currentConditions: safeParseJson(auditCopy.current_conditions) || safeParseJson(auditCopy.currentConditions) || {},
    heatingCooling: safeParseJson(auditCopy.heating_cooling) || safeParseJson(auditCopy.heatingCooling) || {},
    energyConsumption: safeParseJson(auditCopy.energy_consumption) || safeParseJson(auditCopy.energyConsumption) || {}
  };
  
  // Add product preferences if they exist
  if (auditCopy.product_preferences || auditCopy.productPreferences) {
    transformedAudit.productPreferences = safeParseJson(auditCopy.product_preferences) || 
                                         safeParseJson(auditCopy.productPreferences) || {
                                           categories: [],
                                           features: [],
                                           budgetConstraint: 0
                                         };
  } else {
    // Initialize product preferences if they don't exist (for consistency with dashboard)
    transformedAudit.productPreferences = {
      categories: [],
      features: [],
      budgetConstraint: 0
    };
  }
  
  // Apply comprehensive defaults for basic information
  ensureBasicInfoDefaults(transformedAudit);
  
  // Apply comprehensive defaults for home details
  ensureHomeDetailsDefaults(transformedAudit);
  
  // Apply comprehensive defaults for current conditions
  ensureCurrentConditionsDefaults(transformedAudit);
  
  // Apply comprehensive defaults for heating and cooling
  ensureHeatingCoolingDefaults(transformedAudit);
  
  // Apply comprehensive defaults for energy consumption
  ensureEnergyConsumptionDefaults(transformedAudit);
  
  // Log successful transformation
  appLogger.debug('Transformed audit data successfully', {
    originalKeys: Object.keys(audit),
    transformedKeys: Object.keys(transformedAudit),
    basicInfoKeys: Object.keys(transformedAudit.basicInfo),
    homeDetailsKeys: Object.keys(transformedAudit.homeDetails)
  });
  
  return transformedAudit;
}

/**
 * Safely parse JSON or return the original object if already parsed
 * @param data The data to parse
 * @returns Parsed object or null
 */
function safeParseJson(data: any): any {
  if (!data) return null;
  
  // If already an object, return as is
  if (typeof data === 'object' && !Array.isArray(data)) return data;
  
  // Try to parse if it's a string
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      appLogger.debug('Failed to parse JSON data', { 
        data: typeof data === 'string' ? data.substring(0, 50) + '...' : typeof data 
      });
      return null; // Return null for invalid JSON
    }
  }
  
  return null; // Return null for other types
}

/**
 * Ensure basic info has all required defaults
 * @param auditData The audit data to update
 */
function ensureBasicInfoDefaults(auditData: EnergyAuditData): void {
  if (!auditData.basicInfo.address) auditData.basicInfo.address = 'Unknown Address';
  if (!auditData.basicInfo.propertyType) auditData.basicInfo.propertyType = 'single-family';
  if (!auditData.basicInfo.yearBuilt) auditData.basicInfo.yearBuilt = 2000;
  if (!auditData.basicInfo.fullName) auditData.basicInfo.fullName = 'Anonymous User';
  if (!auditData.basicInfo.email) auditData.basicInfo.email = 'anonymous@example.com';
  if (!auditData.basicInfo.phone) auditData.basicInfo.phone = '555-555-5555';
  if (!auditData.basicInfo.auditDate) {
    auditData.basicInfo.auditDate = new Date().toISOString().split('T')[0];
  }
  if (!auditData.basicInfo.occupants) auditData.basicInfo.occupants = 2;
  if (!auditData.basicInfo.ownershipStatus) auditData.basicInfo.ownershipStatus = 'owned';
}

/**
 * Ensure home details has all required defaults
 * @param auditData The audit data to update
 */
function ensureHomeDetailsDefaults(auditData: EnergyAuditData): void {
  if (!auditData.homeDetails.squareFootage) auditData.homeDetails.squareFootage = 1500;
  if (!auditData.homeDetails.stories) auditData.homeDetails.stories = 1;
  if (!auditData.homeDetails.bedrooms) auditData.homeDetails.bedrooms = 3;
  if (!auditData.homeDetails.bathrooms) auditData.homeDetails.bathrooms = 2;
  if (!auditData.homeDetails.homeType) auditData.homeDetails.homeType = 'single-family';
  if (!auditData.homeDetails.homeSize) auditData.homeDetails.homeSize = 1500;
  if (!auditData.homeDetails.constructionPeriod) auditData.homeDetails.constructionPeriod = 'after-2000';
  if (!auditData.homeDetails.numRooms) auditData.homeDetails.numRooms = 6;
  if (!auditData.homeDetails.numFloors) auditData.homeDetails.numFloors = 2;
  if (!auditData.homeDetails.basementType) auditData.homeDetails.basementType = 'none';
  if (!auditData.homeDetails.basementHeating) auditData.homeDetails.basementHeating = 'unheated';
}

/**
 * Ensure current conditions has all required defaults
 * @param auditData The audit data to update
 */
function ensureCurrentConditionsDefaults(auditData: EnergyAuditData): void {
  // Ensure insulation exists and has structure
  if (!auditData.currentConditions.insulation) {
    auditData.currentConditions.insulation = {
      attic: 'average',
      walls: 'average',
      basement: 'average',
      floor: 'average'
    };
  }
  
  // Ensure individual insulation values exist
  const insulation = auditData.currentConditions.insulation;
  if (!insulation.attic) insulation.attic = 'average';
  if (!insulation.walls) insulation.walls = 'average';
  if (!insulation.basement) insulation.basement = 'average';
  if (!insulation.floor) insulation.floor = 'average';
  
  // Set defaults for other current condition fields
  if (!auditData.currentConditions.windowType) auditData.currentConditions.windowType = 'not-assessed';
  if (!auditData.currentConditions.naturalLight) auditData.currentConditions.naturalLight = 'moderate';
  if (!auditData.currentConditions.lightingControls) auditData.currentConditions.lightingControls = 'basic';
  
  // Add default bulb percentages if missing
  if (!auditData.currentConditions.bulbPercentages) {
    auditData.currentConditions.bulbPercentages = {
      led: 30,
      cfl: 30,
      incandescent: 40
    };
  }
}

/**
 * Ensure heating cooling has all required defaults
 * @param auditData The audit data to update
 */
function ensureHeatingCoolingDefaults(auditData: EnergyAuditData): void {
  // Ensure heating system exists
  if (!auditData.heatingCooling.heatingSystem) {
    auditData.heatingCooling.heatingSystem = {
      type: 'furnace',
      fuel: 'natural-gas',
      fuelType: 'natural-gas',
      age: 10,
      efficiency: 80,
      lastService: new Date().toISOString().split('T')[0] // Today's date
    };
  }
  
  // Ensure heating system fields
  const heatingSystem = auditData.heatingCooling.heatingSystem;
  if (!heatingSystem.type) heatingSystem.type = 'furnace';
  if (!heatingSystem.fuel) heatingSystem.fuel = 'natural-gas';
  if (!heatingSystem.fuelType) heatingSystem.fuelType = 'natural-gas';
  if (typeof heatingSystem.age !== 'number') heatingSystem.age = 10;
  if (typeof heatingSystem.efficiency !== 'number') heatingSystem.efficiency = 80;
  if (!heatingSystem.lastService) heatingSystem.lastService = new Date().toISOString().split('T')[0];
  
  // Ensure cooling system exists
  if (!auditData.heatingCooling.coolingSystem) {
    auditData.heatingCooling.coolingSystem = {
      type: 'central-ac',
      age: 10,
      efficiency: 13 // SEER rating
    };
  }
  
  // Ensure cooling system fields
  const coolingSystem = auditData.heatingCooling.coolingSystem;
  if (!coolingSystem.type) coolingSystem.type = 'central-ac';
  if (typeof coolingSystem.age !== 'number') coolingSystem.age = 10;
  if (typeof coolingSystem.efficiency !== 'number') coolingSystem.efficiency = 13;
  
  // Set defaults for temperature difference if missing
  if (!auditData.heatingCooling.temperatureDifference && !auditData.heatingCooling.temperatureDifferenceCategory) {
    auditData.heatingCooling.temperatureDifferenceCategory = 'moderate';
  }
}

/**
 * Ensure energy consumption has all required defaults
 * @param auditData The audit data to update
 */
function ensureEnergyConsumptionDefaults(auditData: EnergyAuditData): void {
  // Ensure energy consumption fields
  if (typeof auditData.energyConsumption.electricBill !== 'number') {
    auditData.energyConsumption.electricBill = 100;
  }
  
  if (typeof auditData.energyConsumption.gasBill !== 'number') {
    auditData.energyConsumption.gasBill = 50;
  }
  
  // Add default factors if missing
  if (typeof auditData.energyConsumption.durationHours !== 'number') {
    auditData.energyConsumption.durationHours = 8;
  }
  
  if (typeof auditData.energyConsumption.powerFactor !== 'number') {
    auditData.energyConsumption.powerFactor = 0.9;
  }
  
  if (typeof auditData.energyConsumption.seasonalFactor !== 'number') {
    auditData.energyConsumption.seasonalFactor = 1.1;
  }
  
  if (typeof auditData.energyConsumption.occupancyFactor !== 'number') {
    auditData.energyConsumption.occupancyFactor = 0.6;
  }
}

// Import report data service
import { reportDataService } from '../services/ReportDataService.js';

// Generate PDF report [ENHANCED with better data validation]
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
    
    // Generate report data using the same service as the interactive dashboard
    // This ensures consistency between the PDF and dashboard
    appLogger.info('Using Report Data Service for PDF generation:', createLogMetadata(req, { 
      auditId, 
      recommendationsCount: recommendations.length 
    }));
    
    // Generate common report data that will be used for both PDF and dashboard
    const reportData = await reportDataService.generateReportData(audit, recommendations);
    
    // Log for debugging
    appLogger.debug('Report data generated for PDF:', createLogMetadata(req, {
      reportDataKeys: Object.keys(reportData),
      executiveSummaryKeys: reportData.executiveSummary ? Object.keys(reportData.executiveSummary) : [],
      totalEnergy: reportData.executiveSummary?.totalEnergy,
      efficiencyScore: reportData.executiveSummary?.efficiencyScore,
      potentialSavings: reportData.executiveSummary?.potentialSavings
    }));
    
    // Convert back to EnergyAuditData format for PDF generator
    // While we could refactor the PDF generator to use ReportData directly,
    // that would be a larger change. This approach maintains compatibility.
    const transformedAudit: EnergyAuditData = {
      basicInfo: {
        fullName: 'Anonymous User',
        email: 'anonymous@example.com',
        phone: '555-555-5555',
        auditDate: new Date().toISOString().split('T')[0],
        occupants: 2,
        ...reportData.propertyInfo,
        propertyType: reportData.propertyInfo.propertyType || 'single-family'
      },
      homeDetails: {
        squareFootage: reportData.propertyInfo.squareFootage || 1500,
        stories: 2,
        bedrooms: 3,
        bathrooms: 2,
        homeType: reportData.propertyInfo.propertyType || 'single-family',
        homeSize: reportData.propertyInfo.squareFootage || 1500,
        constructionPeriod: 'after-2000',
        numRooms: 6,
        numFloors: 2,
        wallLength: 0,
        wallWidth: 0,
        ceilingHeight: 0,
        basementType: 'none',
        basementHeating: 'unheated'
      },
      currentConditions: {
        insulation: {
          attic: reportData.currentConditions?.insulation || 'average',
          walls: 'average',
          basement: 'average',
          floor: 'average'
        },
        windowType: reportData.currentConditions?.windows || 'not-assessed',
        windowCondition: 'good',
        numWindows: 0,
        windowCount: 'average',
        doorCount: 0,
        airLeaks: [],
        weatherStripping: 'average',
        temperatureConsistency: 'some-variations',
        comfortIssues: [],
        naturalLight: reportData.lighting?.naturalLight || 'moderate',
        lightingControls: reportData.lighting?.controls || 'basic',
        bulbPercentages: reportData.lighting?.bulbTypes || { led: 30, cfl: 30, incandescent: 40 }
      },
      heatingCooling: {
        heatingSystem: {
          type: 'furnace',
          fuel: 'natural-gas',
          fuelType: 'natural-gas',
          age: reportData.currentConditions?.hvacSystemAge || 10,
          efficiency: 80,
          lastService: new Date().toISOString().split('T')[0]
        },
        coolingSystem: {
          type: 'central-ac',
          age: reportData.currentConditions?.hvacSystemAge || 10,
          efficiency: 13
        },
        thermostatType: 'programmable',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        electricBill: reportData.energyConsumption?.electricityUsage / 12 || 100,
        gasBill: reportData.energyConsumption?.gasUsage / 12 || 50,
        seasonalVariation: 'moderate',
        powerConsumption: reportData.executiveSummary?.totalEnergy || 0,
        occupancyPattern: 'home-evenings-weekends',
        occupancyHours: { weekday: '6h', weekend: '16h' },
        peakUsageTimes: ['evening'],
        monthlyBill: 0,
        season: 'all-year',
        durationHours: reportData.energyConsumption?.usageHours || 8,
        powerFactor: reportData.energyConsumption?.powerFactor || 0.9,
        seasonalFactor: reportData.energyConsumption?.seasonalFactor || 1.1,
        occupancyFactor: reportData.energyConsumption?.occupancyFactor || 0.6
      },
      productPreferences: reportData.productPreferences
    };
    
    // Generate the PDF report with data consistent with the dashboard
    const report = await reportGenerationService.generateReport(transformedAudit, recommendations);

    // Send the PDF as a download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=energy-audit-report-${auditId}.pdf`);
    res.send(report);

    appLogger.info('PDF report generated successfully:', createLogMetadata(req, { auditId }));
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
