// backend/src/routes/userPropertySettings.ts

import express, { Response, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { rateLimiter } from '../middleware/security';
import { z } from 'zod';
import { pool } from '../config/database';
import { appLogger } from '../config/logger';

const router = express.Router();

// Validation schema for property settings
const propertySettingsSchema = z.object({
  propertyType: z.enum([
    'single-family',
    'townhouse',
    'duplex',
    'mobile'
  ], {
    required_error: "Property type is required",
    invalid_type_error: "Invalid property type"
  }),
  
  constructionPeriod: z.enum([
    'before-1940',
    '1940-1959',
    '1960-1979',
    '1980-1999',
    '2000-2019',
    '2020-newer'
  ], {
    required_error: "Construction period is required"
  }),
  
  stories: z.number()
    .int()
    .min(1, "Must have at least 1 story")
    .max(10, "Maximum 10 stories allowed"),
    
  squareFootage: z.number()
    .min(100, "Square footage must be at least 100")
    .max(50000, "Square footage must not exceed 50,000"),
    
  ceilingHeight: z.number()
    .optional(),
    
  foundation: z.enum([
    'basement',
    'crawlspace',
    'slab'
  ]).optional(),
    
  atticType: z.enum([
    'full',
    'partial',
    'none'
  ]).optional()
});

// Get user's property settings
router.get('/property', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

router.put('/property', [authenticate, rateLimiter, updatePropertyHandler]);

// Delete user's property settings
router.delete('/property', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
