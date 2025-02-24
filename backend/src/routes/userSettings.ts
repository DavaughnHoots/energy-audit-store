// src/routes/userSettings.ts

import express, { Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { UserSettingsService } from '../services/userSettingsService';
import { pool } from '../config/database.js';
import { appLogger } from '../config/logger.js';

const router = express.Router();
const settingsService = new UserSettingsService(pool);

// Get user settings
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await settingsService.getUserSettings(req.user!.id);
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Update user settings
router.put('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, phone, address, emailNotifications, theme } = req.body;
    
    // Update user profile
    const settings = await settingsService.updateUserSettings(req.user!.id, {
      fullName,
      phone,
      address
    });

    // Update preferences in user_settings table
    await pool.query(
      `INSERT INTO user_settings (user_id, email_notifications, theme)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         email_notifications = $2,
         theme = $3,
         updated_at = CURRENT_TIMESTAMP`,
      [req.user!.id, emailNotifications, theme]
    );

    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete account
router.delete('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required for account deletion' });
    }

    // Verify password before deletion
    const isValid = await settingsService.verifyPassword(req.user!.id, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user (cascades to settings due to foreign key)
    await pool.query('DELETE FROM users WHERE id = $1', [req.user!.id]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Export data (GDPR compliance)
router.get('/export', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userData = await pool.query(
      `SELECT u.*, s.email_notifications, s.theme, s.notification_preferences
       FROM users u
       LEFT JOIN user_settings s ON u.id = s.user_id
       WHERE u.id = $1`,
      [req.user!.id]
    );

    // Get user's audit history
    const auditHistory = await pool.query(
      'SELECT * FROM audit_history WHERE user_id = $1',
      [req.user!.id]
    );

    res.json({
      userData: userData.rows[0],
      auditHistory: auditHistory.rows
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get property details
router.get('/property', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT property_details FROM user_settings WHERE user_id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.json({ property_details: null });
    }

    res.json({ property_details: result.rows[0].property_details });
  } catch (error) {
    appLogger.error('Error fetching property details:', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to fetch property details' });
  }
});

// Update property details
router.put('/property', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const propertyDetails = req.body;

    const result = await pool.query(
      `INSERT INTO user_settings (user_id, property_details, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         property_details = $2,
         updated_at = CURRENT_TIMESTAMP
       RETURNING property_details`,
      [req.user!.id, propertyDetails]
    );

    res.json({ property_details: result.rows[0].property_details });
  } catch (error) {
    appLogger.error('Error updating property details:', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to update property details' });
  }
});

export default router;
