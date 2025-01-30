import express from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { EnergyConsumptionService } from '../services/energyConsumptionService';

const router = express.Router();
const energyConsumptionService = new EnergyConsumptionService();

// Get energy consumption data
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const data = await energyConsumptionService.getUserEnergyData(userId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching energy consumption data:', error);
    res.status(500).json({ message: 'Failed to fetch energy consumption data' });
  }
});

// Update energy consumption data
router.put('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const data = req.body;
    await energyConsumptionService.updateUserEnergyData(userId, data);
    res.json({ message: 'Energy consumption data updated successfully' });
  } catch (error) {
    console.error('Error updating energy consumption data:', error);
    res.status(500).json({ message: 'Failed to update energy consumption data' });
  }
});

export default router;
