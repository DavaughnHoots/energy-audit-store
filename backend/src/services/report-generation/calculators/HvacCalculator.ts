import { IHvacCalculator } from '../types/index.js';
import { EnergyAuditData } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';

export class HvacCalculator implements IHvacCalculator {
  /**
   * Calculates the HVAC efficiency gap
   * @param auditData Energy audit data
   * @returns HVAC efficiency gap percentage
   */
  calculateHvacEfficiencyGap(auditData: EnergyAuditData): number {
    try {
      // This is a simplified calculation - in a real implementation, this would use more complex logic
      const currentEfficiency = auditData.heatingCooling.heatingSystem.efficiency || 0;
      const targetEfficiency = auditData.heatingCooling.heatingSystem.targetEfficiency || 95;
      
      return targetEfficiency - currentEfficiency;
    } catch (error) {
      appLogger.error('Error calculating HVAC efficiency gap', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }
}

export const hvacCalculator = new HvacCalculator();
