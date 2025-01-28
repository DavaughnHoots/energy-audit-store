// backend/src/routes/energyAudit.ts

import express from 'express';
import { authenticate, validateEmailVerification, auditLimiter } from '../middleware/auth';
import { validators } from '../middleware/validators';
import { EnergyAuditService } from '../services/EnergyAuditService';
import { pool } from '../config/database';

const router = express.Router();
const auditService = new EnergyAuditService(pool);

// Submit new audit
router.post('/', 
  authenticate,
  validateEmailVerification,
  auditLimiter,
  validators.validateAuditData,
  async (req, res) => {
    try {
      const auditId = await auditService.submitAudit({
        ...req.body,
        basicInfo: {
          ...req.body.basicInfo,
          userId: req.user!.userId
        }
      });
      res.status(201).json({ auditId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
});

// Get audit by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const audit = await pool.query(
      'SELECT * FROM energy_audits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    );
    
    if (audit.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    
    res.json(audit.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get user's audit history
router.get('/', authenticate, async (req, res) => {
  try {
    const audits = await auditService.getAuditHistory(req.user!.userId);
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update audit
router.put('/:id', 
  authenticate,
  validators.validateAuditData,
  async (req, res) => {
    try {
      const { id } = req.params;
      const audit = await pool.query(
        'SELECT * FROM energy_audits WHERE id = $1 AND user_id = $2',
        [id, req.user!.userId]
      );

      if (audit.rows.length === 0) {
        return res.status(404).json({ error: 'Audit not found' });
      }

      if (audit.rows[0].status === 'completed') {
        return res.status(400).json({ error: 'Cannot update completed audit' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Log changes
        const oldData = audit.rows[0];
        const changes = Object.keys(req.body).filter(key => 
          JSON.stringify(oldData[key]) !== JSON.stringify(req.body[key])
        );

        for (const field of changes) {
          await client.query(
            `INSERT INTO audit_history (
              audit_id, field_name, old_value, new_value
            ) VALUES ($1, $2, $3, $4)`,
            [id, field, oldData[field], req.body[field]]
          );
        }

        // Update audit
        await client.query(
          `UPDATE energy_audits SET
            home_details = $1,
            current_conditions = $2,
            heating_cooling = $3,
            energy_consumption = $4,
            lighting_details = $5,
            renewable_potential = $6,
            financial_details = $7,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $8`,
          [
            req.body.homeDetails,
            req.body.currentConditions,
            req.body.heatingCooling,
            req.body.energyConsumption,
            req.body.lightingDetails,
            req.body.renewablePotential,
            req.body.financialDetails,
            id
          ]
        );

        await client.query('COMMIT');
        res.json({ message: 'Audit updated successfully' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
});

// Complete audit
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE energy_audits 
       SET status = 'completed', 
           completed_at = CURRENT_TIMESTAMP,
           recommendations = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [req.body.recommendations, id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;