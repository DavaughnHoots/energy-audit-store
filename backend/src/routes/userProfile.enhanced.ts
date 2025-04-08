import express from 'express';
import { UserSettingsService } from '../services/userSettingsService.js';
import { propertySettingsService } from '../services/propertySettingsService.js';
import { authenticate } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();
const userSettingsService = new UserSettingsService(pool);

// Get combined user profile data
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Fetch user settings with error handling
      const userSettings = await userSettingsService.getUserSettings(userId).catch(err => {
        console.error('Error fetching user settings:', err);
        return null;
      });

      // Fetch property settings with error handling
      const windowMaintenance = await propertySettingsService.getWindowMaintenance(userId).catch(err => {
        console.error('Error fetching window maintenance:', err);
        return null;
      });
      
      const weatherization = await propertySettingsService.getWeatherizationMonitoring(userId).catch(err => {
        console.error('Error fetching weatherization:', err);
        return null;
      });

      // Combine data with null checks for all properties
      const profileData = {
        fullName: userSettings?.full_name || '',
        email: req.user?.email || '',
        phone: userSettings?.phone || '',
        address: userSettings?.address || '',
        
        // Optional property fields with null checks
        emailNotifications: userSettings?.email_notifications,
        theme: userSettings?.theme,
        
      // Window maintenance with null checks - include only properties that exist in the type
      windowMaintenance: windowMaintenance ? {
        windowCount: windowMaintenance.windowCount || 0,
        lastReplacementDate: windowMaintenance.lastReplacementDate || null
        // Removed windowType and condition as they don't exist in the type
      } : undefined,
      
      // Weatherization with null checks - include only properties that exist in the type
      weatherization: weatherization ? {
        draftLocations: weatherization.draftLocations || { locations: [], severity: 'none' },
        condensationIssues: weatherization.condensationIssues || { locations: [], severity: 'none' }
        // Removed weatherStripping as it doesn't exist in the type
      } : undefined,
        
        // Property details - structured as expected by the frontend
        propertyDetails: userSettings?.property_details ? {
          propertyType: userSettings.property_details.property_type || '',
          yearBuilt: userSettings.property_details.year_built || 0,
          squareFootage: userSettings.property_details.square_footage || 0,
          stories: userSettings.property_details.stories || 1,
          ownershipStatus: userSettings.property_details.ownership_status || '',
          insulation: userSettings.property_details.insulation ? {
            attic: userSettings.property_details.insulation.attic || '',
            walls: userSettings.property_details.insulation.walls || '',
            basement: userSettings.property_details.insulation.basement || '',
            floor: userSettings.property_details.insulation.floor || ''
          } : undefined
        } : undefined,
        
        // Energy systems details
        energySystems: userSettings?.energy_systems ? {
          heatingSystem: userSettings.energy_systems.heating_system ? {
            type: userSettings.energy_systems.heating_system.type || '',
            age: userSettings.energy_systems.heating_system.age || 0,
            fuel: userSettings.energy_systems.heating_system.fuel || ''
          } : undefined,
          coolingSystem: userSettings.energy_systems.cooling_system ? {
            type: userSettings.energy_systems.cooling_system.type || '',
            age: userSettings.energy_systems.cooling_system.age || 0
          } : undefined,
          waterHeater: userSettings.energy_systems.water_heater ? {
            type: userSettings.energy_systems.water_heater.type || '',
            age: userSettings.energy_systems.water_heater.age || 0,
            fuel: userSettings.energy_systems.water_heater.fuel || ''
          } : undefined
        } : undefined
      };

      console.log('Profile fetch successful');
      res.json(profileData);
    } catch (innerError: any) {
      console.error('Detailed profile fetch error:', innerError);
      res.status(500).json({ 
        message: 'Failed to process profile data', 
        error: innerError.message || 'Unknown error' 
      });
    }
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
    
    if (!auditData || !fieldsToUpdate || !Array.isArray(fieldsToUpdate)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Update user settings if needed
    if (fieldsToUpdate.includes('basicInfo') && auditData.basicInfo) {
      await userSettingsService.updateUserSettings(userId, {
        fullName: auditData.basicInfo.fullName || '',
        phone: auditData.basicInfo.phone || '',
        address: auditData.basicInfo.address || ''
      });
    }

    // Update window maintenance if needed
    if (fieldsToUpdate.includes('windowMaintenance') &&
        auditData.currentConditions?.numWindows) {
      await propertySettingsService.updateWindowMaintenance(userId, {
        windowCount: auditData.currentConditions.numWindows
        // Note: windowType property was removed as it doesn't exist in UpdateWindowMaintenanceDto
      });
    }

    // Update weatherization if needed
    if (fieldsToUpdate.includes('weatherization') &&
        auditData.currentConditions?.airLeaks) {
      await propertySettingsService.updateWeatherizationMonitoring(userId, {
        draftLocations: {
          locations: Array.isArray(auditData.currentConditions.airLeaks) 
            ? auditData.currentConditions.airLeaks 
            : [],
          severity: Array.isArray(auditData.currentConditions.airLeaks) && 
                   auditData.currentConditions.airLeaks.length > 3 
            ? 'moderate' 
            : 'mild'
        }
        // Note: weatherStripping property was removed as it doesn't exist in UpdateWeatherizationDto
      });
    }

    // Update property details if needed
    if (fieldsToUpdate.includes('propertyDetails') && 
        (auditData.basicInfo?.propertyType || auditData.homeDetails?.squareFootage)) {
      
      // Rather than trying to update property details directly which seems to not be supported,
      // log this for future implementation
      console.log('Property details update requested but not implemented in backend API:', {
        propertyType: auditData.basicInfo?.propertyType || '',
        yearBuilt: auditData.basicInfo?.yearBuilt || 0,
        squareFootage: auditData.homeDetails?.squareFootage || 0,
        stories: auditData.homeDetails?.stories || 1
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating profile from audit:', error);
    res.status(500).json({ 
      message: 'Failed to update profile', 
      error: error.message || 'Unknown error' 
    });
  }
});

export default router;
