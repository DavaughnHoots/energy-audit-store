import { IBulbCalculator } from '../types/index.js';
import { EnergyAuditData } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';

export class BulbCalculator implements IBulbCalculator {
  /**
   * Normalize and validate bulb percentages
   * @param auditData The audit data object
   * @returns Normalized bulb percentages that sum to 100%
   */
  normalizeBulbPercentages(auditData: EnergyAuditData): { led: number, cfl: number, incandescent: number } {
    try {
      if (!auditData.currentConditions.bulbPercentages) {
        // Generate estimates based on property age and type
        return this.estimateBulbPercentagesByProperty(auditData);
      }
      
      const { led, cfl, incandescent } = auditData.currentConditions.bulbPercentages;
      
      // Convert to numbers and ensure they're valid
      const ledValue = typeof led === 'number' && !isNaN(led) ? led : 0;
      const cflValue = typeof cfl === 'number' && !isNaN(cfl) ? cfl : 0;
      const incandescentValue = typeof incandescent === 'number' && !isNaN(incandescent) ? incandescent : 0;
      
      const total = ledValue + cflValue + incandescentValue;
      
      // If no data (all zeros), estimate based on property
      if (total === 0) {
        return this.estimateBulbPercentagesByProperty(auditData);
      }
      
      // Otherwise normalize to 100%
      return {
        led: Math.round((ledValue / total) * 100),
        cfl: Math.round((cflValue / total) * 100),
        incandescent: Math.round((incandescentValue / total) * 100)
      };
    } catch (error) {
      appLogger.error('Error normalizing bulb percentages', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Return a reasonable default distribution
      return { led: 30, cfl: 30, incandescent: 40 };
    }
  }
  
  /**
   * Estimate bulb percentages based on property age and type
   * @param auditData The audit data object
   * @returns Estimated bulb percentages
   */
  estimateBulbPercentagesByProperty(auditData: EnergyAuditData): { led: number, cfl: number, incandescent: number } {
    const yearBuilt = auditData.basicInfo.yearBuilt || 2000;
    // Use defined renovation status if exists, otherwise assume false
    const renovated = false; // recentlyRenovated field isn't in the model
    
    // Newer properties or recently renovated ones likely have more LEDs
    if (yearBuilt >= 2018 || renovated) {
      return { led: 70, cfl: 20, incandescent: 10 };
    } else if (yearBuilt >= 2010) {
      return { led: 50, cfl: 30, incandescent: 20 };
    } else if (yearBuilt >= 2000) {
      return { led: 30, cfl: 40, incandescent: 30 };
    } else if (yearBuilt >= 1990) {
      return { led: 20, cfl: 30, incandescent: 50 };
    } else {
      return { led: 10, cfl: 20, incandescent: 70 };
    }
  }
  
  /**
   * Get appropriate description for bulb types
   * @param bulbPercentages Normalized bulb percentages
   * @returns Description string
   */
  getBulbTypeDescription(bulbPercentages: { led: number, cfl: number, incandescent: number }): string {
    if (bulbPercentages.led > 70) return 'Mostly LED Bulbs';
    if (bulbPercentages.incandescent > 70) return 'Mostly Incandescent Bulbs';
    return 'Mix of Bulb Types';
  }
}

export const bulbCalculator = new BulbCalculator();
