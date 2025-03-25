import { EnergyAuditData } from '../types/energyAudit.js';
import { appLogger } from './logger.js';

/**
 * Validates and normalizes daily usage hours
 * Ensures that usage hours are reasonable values
 */
export class UsageHoursValidator {
  /**
   * Default daily usage hours by property type
   * These are used when no valid data is provided
   */
  private static readonly defaultUsageHours: Record<string, number> = {
    'single-family': 6.5,
    'multi-family': 7.2,
    'apartment': 8.0,
    'condo': 7.5,
    'townhouse': 6.8,
    'mobile-home': 8.5,
    'commercial': 10.5
  };

  /**
   * Occupancy-based adjustment factors
   * Applied as multipliers on the default hours
   */
  private static readonly occupancyFactors: Record<string, number> = {
    'low': 0.7,      // Low occupancy (e.g., vacation home)
    'medium': 1.0,   // Medium occupancy (e.g., average family)
    'high': 1.3      // High occupancy (e.g., large family, home business)
  };

  /**
   * Room-specific default hours
   * For more granular room-by-room recommendations
   */
  private static readonly roomDefaultHours: Record<string, number> = {
    'kitchen': 5.0,
    'living_room': 6.0,
    'bedroom': 3.5,
    'bathroom': 2.0,
    'office': 8.0,
    'garage': 1.0,
    'basement': 1.5,
    'hallway': 2.0,
    'outdoor': 4.0
  };

  /**
   * Validate and normalize daily usage hours
   * @param auditData Full energy audit data
   * @returns Validated daily usage hours
   */
  public static validateDailyUsageHours(auditData: EnergyAuditData): number {
    try {
      // Extract usage hours from audit data
      let usageHours = 0;
      if (auditData.energyConsumption) {
        usageHours = auditData.energyConsumption.durationHours || 0;
      }

      // Always ensure a valid value, even if it's zero in the data
      // Min allowed is 1 hour (reasonable minimum for any occupied home)
      if (usageHours <= 0 || usageHours > 24) {
        appLogger.warn('Invalid daily usage hours', { 
          providedValue: usageHours 
        });

        // Calculate default based on property type
        const propertyType = (auditData.basicInfo?.propertyType || 'single-family').toLowerCase();
        const defaultHours = this.defaultUsageHours[propertyType] || 7.0;

        // Determine occupancy level based on number of occupants
        let occupancyLevel = 'medium';
        if (auditData.basicInfo?.occupants) {
          if (auditData.basicInfo.occupants <= 1) {
            occupancyLevel = 'low';
          } else if (auditData.basicInfo.occupants >= 5) {
            occupancyLevel = 'high';
          }
        }
        
        // Use inferred occupancy or fallback to medium
        const occupancyFactor = this.occupancyFactors[occupancyLevel] || 1.0;
        
        usageHours = defaultHours * occupancyFactor;
        
        appLogger.debug('Using default daily usage hours', { 
          propertyType, 
          defaultHours,
          occupancyLevel,
          occupancyFactor,
          calculatedHours: usageHours
        });
      }

      // Ensure hours are within reasonable range and properly formatted
      usageHours = Math.min(24, Math.max(1, usageHours));
      
      return parseFloat(usageHours.toFixed(1));
    } catch (error) {
      appLogger.error('Error validating daily usage hours', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 7.0; // Sensible default for most homes
    }
  }

  /**
   * Get default usage hours for a specific room or space
   * Used for room-specific recommendations
   * @param roomType Type of room (kitchen, bedroom, etc.)
   * @param auditData Full energy audit data for context
   * @returns Default usage hours for the specified room
   */
  public static getRoomUsageHours(roomType: string, auditData: EnergyAuditData): number {
    try {
      // Get default for the room type
      const roomTypeKey = roomType.toLowerCase().replace(' ', '_');
      let roomHours = this.roomDefaultHours[roomTypeKey] || 4.0;
      
      // Determine occupancy level based on number of occupants
      let occupancyLevel = 'medium';
      if (auditData.basicInfo?.occupants) {
        if (auditData.basicInfo.occupants <= 1) {
          occupancyLevel = 'low';
        } else if (auditData.basicInfo.occupants >= 5) {
          occupancyLevel = 'high';
        }
      }
      
      // Use inferred occupancy or fallback to medium
      const occupancyFactor = this.occupancyFactors[occupancyLevel] || 1.0;
      
      roomHours *= occupancyFactor;
      
      return parseFloat(roomHours.toFixed(1));
    } catch (error) {
      appLogger.error('Error calculating room usage hours', { 
        error: error instanceof Error ? error.message : String(error),
        roomType
      });
      return 4.0; // Reasonable default
    }
  }
}
