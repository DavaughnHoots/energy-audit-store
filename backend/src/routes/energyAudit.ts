import { Router, Request } from 'express';
import { EnergyAuditService } from '../services/EnergyAuditService';
import { validateToken } from '../middleware/tokenValidation';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool(); // This will use the connection details from your environment variables
const auditService = new EnergyAuditService(pool);

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// Submit audit for authenticated user
router.post('/submit', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const auditId = await auditService.submitAudit(req.body, userId);
    res.json({ auditId });
  } catch (err) {
    console.error('Error submitting audit:', err);
    res.status(500).json({ error: 'Failed to submit audit' });
  }
});

// Submit audit for guest user
router.post('/guest', async (req, res) => {
  try {
    const auditId = await auditService.submitAudit(req.body);
    res.json({ auditId });
  } catch (err) {
    console.error('Error submitting guest audit:', err);
    res.status(500).json({ error: 'Failed to submit audit' });
  }
});

// Generate and download report
router.get('/:auditId/report', async (req: AuthenticatedRequest, res) => {
  try {
    const auditId = req.params.auditId;
    if (!auditId) {
      return res.status(400).json({ error: 'Audit ID is required' });
    }

    const userId = req.user?.id;

    // If user is authenticated, verify they own this audit
    if (userId) {
      const audit = await auditService.getAuditById(auditId);
      if (audit.userId && audit.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this audit' });
      }
    }

    // For guest users, no authorization check needed

    const report = await auditService.generateReport(auditId, {
      includeProducts: true,
      includeSavingsProjections: true,
      format: 'detailed'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=energy-audit-report-${auditId}.pdf`);
    res.send(report);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get audit recommendations
router.get('/:auditId/recommendations', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const auditId = req.params.auditId;
    if (!auditId) {
      return res.status(400).json({ error: 'Audit ID is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify user owns this audit
    const audit = await auditService.getAuditById(auditId);
    if (!audit.userId || audit.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this audit' });
    }

    const recommendations = await auditService.getRecommendations(auditId);
    res.json(recommendations);
  } catch (err) {
    console.error('Error fetching recommendations:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Update recommendation implementation status
router.patch('/:auditId/recommendations/:recommendationId', validateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const auditId = req.params.auditId;
    const recommendationId = req.params.recommendationId;
    const status = req.body.status as 'pending' | 'in_progress' | 'completed';

    if (!auditId) {
      return res.status(400).json({ error: 'Audit ID is required' });
    }

    if (!recommendationId) {
      return res.status(400).json({ error: 'Recommendation ID is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    // Verify user owns this audit
    const audit = await auditService.getAuditById(auditId);
    if (!audit.userId || audit.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this audit' });
    }

    await auditService.updateRecommendationStatus(auditId, recommendationId, status);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating recommendation status:', err);
    res.status(500).json({ error: 'Failed to update recommendation status' });
  }
});

export default router;
