import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { validateHVACData } from '../middleware/hvacValidators.js';
import { pool } from '../config/database.js';
import { appLogger } from '../config/logger.js';

const router = express.Router();

router.put('/', authenticate, validateHVACData, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Store the validated HVAC data
    const result = await client.query(
      `INSERT INTO user_hvac_settings (
        user_id,
        heating_system,
        cooling_system,
        ventilation,
        maintenance,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        heating_system = $2,
        cooling_system = $3,
        ventilation = $4,
        maintenance = $5,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        req.user!.id,
        req.body.heating,
        req.body.cooling,
        req.body.ventilation,
        req.body.maintenance
      ]
    );

    // Log the update
    await client.query(
      `INSERT INTO user_activity_log (
        user_id,
        activity_type,
        details,
        created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [
        req.user!.id,
        'hvac_settings_update',
        { newSettings: req.body }
      ]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Failed to update HVAC settings:', { error });
    res.status(500).json({ error: 'Failed to update HVAC settings' });
  } finally {
    client.release();
  }
});

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        heating_system,
        cooling_system,
        ventilation,
        maintenance,
        updated_at
      FROM user_hvac_settings
      WHERE user_id = $1`,
      [req.user!.id]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    appLogger.error('Failed to fetch HVAC settings:', { error });
    res.status(500).json({ error: 'Failed to fetch HVAC settings' });
  }
});

export default router;
