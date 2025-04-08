import { IHvacCalculator } from '../types/index.js';
import { EnergyAuditData } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';

export class HvacCalculator implements IHvacCalculator {
  /**
   * Calculates the HVAC efficiency gap
   * @param auditData Energy audit data
   * @returns HVAC efficiency gap percentage (always non-negative)
   */
  calculateHvacEfficiencyGap(auditData: EnergyAuditData): number {
    try {
      if (!auditData || !auditData.heatingCooling) {
        appLogger.warn('Missing HVAC data for efficiency gap calculation');
        return 15; // Return a reasonable default gap
      }

      // Get heating system data with fallbacks for missing values
      const heatingSystem = auditData.heatingCooling.heatingSystem || {};
      const currentEfficiency = this.normalizeEfficiencyValue(
        heatingSystem.efficiency,
        heatingSystem.type
      );
      
      // Get target efficiency with fallback
      const targetEfficiency = heatingSystem.targetEfficiency || 
                              this.getIdealEfficiency(heatingSystem.type);
      
      // Calculate gap and ensure it's never negative
      // The gap should represent the improvement potential
      const gap = Math.max(0, targetEfficiency - currentEfficiency);
      
      // Cap at reasonable maximum to prevent extreme values
      return Math.min(50, gap);
    } catch (error) {
      appLogger.error('Error calculating HVAC efficiency gap', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 15; // Return a reasonable default gap on error
    }
  }

  /**
   * Normalize efficiency value based on system type
   * This prevents unrealistic values and handles different unit scales
   * @param value Raw efficiency value
   * @param systemType Type of heating/cooling system
   * @returns Normalized efficiency value
   */
  private normalizeEfficiencyValue(value: number | undefined, systemType: string | undefined): number {
    if (value === undefined || value === null || isNaN(value)) {
      return 70; // Default to average efficiency if no value provided
    }

    // Check if system type contains "furnace" or "boiler" (typically using AFUE %)
    const type = (systemType || '').toLowerCase();
    if (type.includes('furnace') || type.includes('boiler')) {
      // AFUE is typically 80-98% for modern systems
      if (value > 100) {
        // Value may be in basis points or other unusual unit - normalize
        return value > 1000 ? (value / 10) : (value > 100 ? (value / 100) * 100 : value);
      }
      // Cap at reasonable range for AFUE
      return Math.min(98, Math.max(60, value));
    } 
    // Heat pump (typically using HSPF or SEER)
    else if (type.includes('heat pump') || type.includes('heat-pump')) {
      // HSPF typically ranges from 8-12
      if (value > 20) {
        // Might be a percentage - normalize to HSPF scale
        return value > 100 ? 10 : (value / 10);
      }
      // Cap at reasonable range for HSPF
      return Math.min(13, Math.max(6, value));
    }
    // Default normalization for other system types
    else {
      // Cap at reasonable efficiency range (0-100%)
      return Math.min(100, Math.max(0, value));
    }
  }

  /**
   * Get ideal efficiency based on system type
   * @param systemType Type of heating/cooling system
   * @returns Ideal efficiency target
   */
  private getIdealEfficiency(systemType: string | undefined): number {
    const type = (systemType || '').toLowerCase();
    
    // Furnace or boiler - use AFUE target
    if (type.includes('furnace')) {
      return 95; // 95% AFUE is high-efficiency
    } 
    else if (type.includes('boiler')) {
      return 90; // 90% AFUE is high-efficiency for boilers
    }
    // Heat pump - use HSPF target
    else if (type.includes('heat pump') || type.includes('heat-pump')) {
      return 10; // 10 HSPF is high-efficiency
    }
    // Unknown system type
    else {
      return 85; // Default to 85% efficiency target
    }
  }
}

export const hvacCalculator = new HvacCalculator();
