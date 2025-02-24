// backend/src/routes/userPropertySettings.ts

import express, { Response, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { rateLimiter } from '../middleware/security';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { appLogger } from '../config/logger.js';
import { propertySettingsService } from '../services/propertySettingsService';
import { UpdateWindowMaintenanceDto, UpdateWeatherizationDto } from '../types/propertySettings';

const router = express.Router();

// Validation schemas
const propertySettingsSchema = z.object({
  insulation: z.object({
    attic: z.enum(['poor', 'average', 'good', 'excellent', 'not-sure']),
    walls: z.enum(['poor', 'average', 'good', 'excellent', 'not-sure']),
    basement: z.enum(['poor', 'average', 'good', 'excellent', 'not-sure']),
    floor: z.enum(['poor', 'average', 'good', 'excellent', 'not-sure'])
  }),
  windows: z.object({
    type: z.enum(['single', 'double', 'triple', 'not-sure']),
    count: z.number().min(0, "Number of windows cannot be negative"),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']),
    lastReplaced: z.string().optional()
  }),
  weatherization: z.object({
    weatherStripping: z.enum(['door-sweep', 'foam', 'metal', 'none', 'not-sure']),
    drafts: z.boolean(),
    visibleGaps: z.boolean(),
    condensation: z.boolean()
  })
});

const windowMaintenanceSchema = z.object({
  windowCount: z.number().min(0).optional(),
  lastReplacementDate: z.string().nullable().optional(),
  nextMaintenanceDate: z.string().nullable().optional(),
  maintenanceNotes: z.string().nullable().optional()
});

const weatherizationSchema = z.object({
  inspectionDate: z.string().optional(),
  condensationIssues: z.object({
    locations: z.array(z.string()),
    severity: z.enum(['none', 'mild', 'moderate', 'severe'])
  }).optional(),
  draftLocations: z.object({
    locations: z.array(z.string()),
    severity: z.enum(['none', 'mild', 'moderate', 'severe'])
  }).optional(),
  notes: z.string().nullable().optional()
});

// Get user's property settings
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT property_details 
       FROM user_settings 
       WHERE user_id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.json({ property_details: null });
    }

    res.json({ property_details: result.rows[0].property_details });
  } catch (error) {
    appLogger.error('Error fetching property settings:', { error, userId: req.user!.id });
    res.status(500).json({ error: 'Failed to fetch property settings' });
  }
});

// Window Maintenance Routes
router.get('/windows', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const maintenance = await propertySettingsService.getWindowMaintenance(req.user!.id);
    res.json(maintenance);
  } catch (error) {
    appLogger.error('Error fetching window maintenance:', { error, userId: req.user!.id });
    res.status(500).json({ error: 'Failed to fetch window maintenance data' });
  }
});

router.put('/windows', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = windowMaintenanceSchema.parse(req.body) as UpdateWindowMaintenanceDto;
    const updated = await propertySettingsService.updateWindowMaintenance(req.user!.id, data);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      appLogger.error('Error updating window maintenance:', { error, userId: req.user!.id });
      res.status(500).json({ error: 'Failed to update window maintenance data' });
    }
  }
});

// Weatherization Monitoring Routes
router.get('/weatherization', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const monitoring = await propertySettingsService.getWeatherizationMonitoring(req.user!.id);
    res.json(monitoring);
  } catch (error) {
    appLogger.error('Error fetching weatherization monitoring:', { error, userId: req.user!.id });
    res.status(500).json({ error: 'Failed to fetch weatherization data' });
  }
});

router.put('/weatherization', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = weatherizationSchema.parse(req.body) as UpdateWeatherizationDto;
    const updated = await propertySettingsService.updateWeatherizationMonitoring(req.user!.id, data);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      appLogger.error('Error updating weatherization monitoring:', { error, userId: req.user!.id });
      res.status(500).json({ error: 'Failed to update weatherization data' });
    }
  }
});

// Update user's property settings
const updatePropertyHandler: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validatedData = propertySettingsSchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update or insert property details
      const result = await client.query(
        `INSERT INTO user_settings (
          user_id,
          property_details,
          updated_at
        )
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
          property_details = $2,
          updated_at = CURRENT_TIMESTAMP
        RETURNING property_details`,
        [
          req.user!.id,
          validatedData
        ]
      );

      // Log the update in the activity log
      await client.query(
        `INSERT INTO user_activity_log (
          user_id,
          activity_type,
          details,
          created_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [
          req.user!.id,
          'property_settings_update',
          { previous: result.rows[0]?.property_details, new: validatedData }
        ]
      );

      await client.query('COMMIT');

      // Send success response
      res.json({
        message: 'Property settings updated successfully',
        property_details: validatedData
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      appLogger.error('Error updating property settings:', {
        error,
        userId: req.user!.id
      });
      res.status(500).json({ error: 'Failed to update property settings' });
    }
  }
};

router.put('/', [authenticate, rateLimiter, updatePropertyHandler]);

// Delete user's property settings
router.delete('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current settings for logging
      const currentSettings = await client.query(
        'SELECT property_details FROM user_settings WHERE user_id = $1',
        [req.user!.id]
      );

      // Remove property details
      await client.query(
        `UPDATE user_settings 
         SET property_details = NULL,
             updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1`,
        [req.user!.id]
      );

      // Log the deletion
      await client.query(
        `INSERT INTO user_activity_log (
          user_id,
          activity_type,
          details,
          created_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [
          req.user!.id,
          'property_settings_delete',
          { deleted: currentSettings.rows[0]?.property_details }
        ]
      );

      await client.query('COMMIT');
      res.json({ message: 'Property settings deleted successfully' });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    appLogger.error('Error deleting property settings:', {
      error,
      userId: req.user!.id
    });
    res.status(500).json({ error: 'Failed to delete property settings' });
  }
});

export default router;
