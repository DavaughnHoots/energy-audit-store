// src/routes/userSettings.ts

import express from 'express';
import { authenticate, requireRole, validateRequest } from '../middleware/auth';
import { AuthService } from '../services/auth/AuthService';
import { pool } from '../config/database';

const router = express.Router();
const authService = new AuthService(pool);

// Get user settings
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await authService.getUserSettings(req.user!.userId);
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Update user settings
router.put('/', authenticate, async (req, res) => {
  try {
    const { fullName, phone, address, emailNotifications, theme } = req.body;
    
    // Update user profile
    const settings = await authService.updateUserSettings(req.user!.userId, {
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
      [req.user!.userId, emailNotifications, theme]
    );

    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete account
router.delete('/', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required for account deletion' });
    }

    // Verify password before deletion
    await authService.verifyPassword(req.user!.userId, password);

    // Delete user (cascades to settings due to foreign key)
    await pool.query('DELETE FROM users WHERE id = $1', [req.user!.userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Export data (GDPR compliance)
router.get('/export', authenticate, async (req, res) => {
  try {
    const userData = await pool.query(
      `SELECT u.*, s.email_notifications, s.theme, s.notification_preferences
       FROM users u
       LEFT JOIN user_settings s ON u.id = s.user_id
       WHERE u.id = $1`,
      [req.user!.userId]
    );

    // Get user's audit history
    const auditHistory = await pool.query(
      'SELECT * FROM audit_history WHERE user_id = $1',
      [req.user!.userId]
    );

    res.json({
      userData: userData.rows[0],
      auditHistory: auditHistory.rows
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;