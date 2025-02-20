import express, { Request } from 'express';
import { validateToken } from '../middleware/tokenValidation';
import { appLogger } from '../config/logger';
import { dashboardService } from '../services/dashboardService';
import { cache } from '../config/cache';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

interface StatusUpdateBody {
  status: 'active' | 'implemented';
  implementationDate?: string;
}

interface SavingsUpdateBody {
  actualSavings: number;
  implementationCost?: number;
  notes?: string;
  month: string;
}

const router = express.Router();

// Get recommendations for a user
router.get('/', validateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cachedData = await cache.get(`recommendations:${userId}`);
    if (cachedData) {
      return res.json(cachedData);
    }

    const stats = await dashboardService.getUserStats(userId);
    await cache.set(`recommendations:${userId}`, stats.recommendations, 300); // Cache for 5 minutes
    res.json(stats.recommendations);
  } catch (error) {
    appLogger.error('Error fetching recommendations:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Update recommendation status
router.put('/:id/status', validateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, implementationDate } = req.body as StatusUpdateBody;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Recommendation ID is required' });
    }

    if (!['active', 'implemented'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await dashboardService.updateRecommendationStatus(
      userId,
      id,
      status,
      implementationDate ? new Date(implementationDate) : undefined
    );

    // Invalidate cache
    await cache.del(`recommendations:${userId}`);
    await cache.del(`dashboard_stats:${userId}`);

    res.json({ success: true });
  } catch (error) {
    appLogger.error('Error updating recommendation status:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Failed to update recommendation status' });
  }
});

// Update recommendation savings
router.put('/:id/savings', validateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { actualSavings, implementationCost, notes, month } = req.body as SavingsUpdateBody;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Recommendation ID is required' });
    }

    if (typeof actualSavings !== 'number' || actualSavings < 0) {
      return res.status(400).json({ error: 'Invalid savings amount' });
    }

    if (implementationCost !== undefined && (typeof implementationCost !== 'number' || implementationCost < 0)) {
      return res.status(400).json({ error: 'Invalid implementation cost' });
    }

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    await dashboardService.updateActualSavings(userId, id, new Date(month), {
      actualSavings,
      implementationCost,
      notes
    });

    // Invalidate cache
    await cache.del(`recommendations:${userId}`);
    await cache.del(`dashboard_stats:${userId}`);

    res.json({ success: true });
  } catch (error) {
    appLogger.error('Error updating recommendation savings:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Failed to update savings information' });
  }
});

// Get monthly savings history for a recommendation
router.get('/:id/savings-history', validateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Recommendation ID is required' });
    }

    const cachedData = await cache.get(`savings_history:${id}`);
    if (cachedData) {
      return res.json(cachedData);
    }

    const stats = await dashboardService.getUserStats(userId);
    const recommendation = stats.recommendations?.find(r => r.id === id);
    
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const savingsHistory = {
      estimated: recommendation.estimatedSavings,
      actual: recommendation.actualSavings,
      monthlySavings: stats.monthlySavings.filter(ms => ms.actual > 0)
    };

    await cache.set(`savings_history:${id}`, savingsHistory, 300); // Cache for 5 minutes
    res.json(savingsHistory);
  } catch (error) {
    appLogger.error('Error fetching savings history:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ error: 'Failed to fetch savings history' });
  }
});

export default router;
