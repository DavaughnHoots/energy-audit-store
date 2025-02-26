import express from 'express';
import { UserSettingsService } from '../services/userSettingsService.js';
import { propertySettingsService } from '../services/propertySettingsService.js';
import { authenticate } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();
const userSettingsService = new UserSettingsService(pool);

// Get combined user profile data
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Fetch user settings
    const userSettings = await userSettingsService.getUserSettings(userId);
    
    // Fetch property settings
    const windowMaintenance = await propertySettingsService.getWindowMaintenance(userId);
    const weatherization = await propertySettingsService.getWeatherizationMonitoring(userId);
    
    // Combine data
    const profileData = {
      fullName: userSettings.full_name,
      email: req.user.email,
      phone: userSettings.phone,
      address: userSettings.address,
      windowMaintenance: {
        windowCount: (windowMaintenance as any).window_count,
        lastReplacementDate: (windowMaintenance as any).last_replacement_date
      },
      weatherization: {
        draftLocations: (weatherization as any).draft_locations,
        condensationIssues: (weatherization as any).condensation_issues
      }
    };
    
    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).json({ message: 'Failed to fetch profile data' });
  }
});

// Update user profile from audit data
router.post('/update-from-audit', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { auditData, fieldsToUpdate } = req.body;
    
    // Update user settings if needed
    if (fieldsToUpdate.includes('basicInfo')) {
      await userSettingsService.updateUserSettings(userId, {
        fullName: auditData.basicInfo.fullName,
        phone: auditData.basicInfo.phone,
        address: auditData.basicInfo.address
      });
    }
    
    // Update window maintenance if needed
    if (fieldsToUpdate.includes('windowMaintenance') && 
        auditData.currentConditions.numWindows) {
      await propertySettingsService.updateWindowMaintenance(userId, {
        windowCount: auditData.currentConditions.numWindows
      });
    }
    
    // Update weatherization if needed
    if (fieldsToUpdate.includes('weatherization') && 
        auditData.currentConditions.airLeaks) {
      await propertySettingsService.updateWeatherizationMonitoring(userId, {
        draftLocations: {
          locations: auditData.currentConditions.airLeaks,
          severity: auditData.currentConditions.airLeaks.length > 3 ? 'moderate' : 'mild'
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating profile from audit:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;
