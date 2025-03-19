import { IEnergyCalculator } from '../types/index.js';
import { EnergyAuditData } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';

export class EnergyCalculator implements IEnergyCalculator {
  /**
   * Calculates the total energy consumption from audit data
   * @param auditData Energy audit data
   * @returns Total energy consumption in kWh
   */
  calculateTotalEnergy(auditData: EnergyAuditData): number {
    try {
      const electricKwhPerYear = auditData.energyConsumption.electricBill * 12;
      const gasKwhPerYear = auditData.energyConsumption.gasBill * 29.3 * 12; // Convert therms to kWh
      return electricKwhPerYear + gasKwhPerYear;
    } catch (error) {
      appLogger.error('Error calculating total energy', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * Returns baseline energy consumption by property type and square footage
   * Based on Energy Information Administration (EIA) data
   * @param propertyType Type of property
   * @param squareFootage Square footage of property
   * @returns Baseline energy consumption in kWh/year
   */
  getBaselineConsumption(
    propertyType: string,
    squareFootage: number
  ): number {
    // Default values in kWh/year per square foot
    const baselinesByType: Record<string, number> = {
      'single-family': 12.5,
      'multi-family': 9.8,
      'apartment': 8.3,
      'condo': 7.5,
      'townhouse': 10.2,
      'mobile-home': 13.1,
      'commercial': 16.7
    };
    
    // Get baseline or use average if type not found
    const baselinePerSqFt = baselinesByType[propertyType.toLowerCase()] || 11.0;
    
    // Calculate total baseline consumption
    return baselinePerSqFt * squareFootage;
  }

  /**
   * Calculates the energy efficiency percentage
   * @param auditData Energy audit data
   * @returns Energy efficiency percentage (40-100)
   */
  calculateEnergyEfficiency(auditData: EnergyAuditData): number {
    try {
      // Use industry standard baselines based on property type and size
      const baselineConsumption = this.getBaselineConsumption(
        auditData.basicInfo.propertyType,
        auditData.homeDetails.squareFootage
      );
      const actualConsumption = this.calculateTotalEnergy(auditData);
      
      if (baselineConsumption <= 0 || actualConsumption <= 0) {
        return 70; // Provide a reasonable default rather than 0
      }
      
      // Calculate efficiency (capped between 40-100%)
      // If actual consumption is less than baseline, efficiency is better
      const efficiency = Math.min(100, Math.max(40, 
        (baselineConsumption / actualConsumption) * 100
      ));
      
      appLogger.debug('Energy efficiency calculation', {
        baselineConsumption,
        actualConsumption,
        calculatedEfficiency: efficiency
      });
      
      return efficiency;
    } catch (error) {
      appLogger.error('Error calculating energy efficiency', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 70; // Return reasonable default on error
    }
  }
}

export const energyCalculator = new EnergyCalculator();
