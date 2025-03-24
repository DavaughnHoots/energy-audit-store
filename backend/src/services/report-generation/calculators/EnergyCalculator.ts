import { IEnergyCalculator } from '../types/index.js';
import { EnergyAuditData } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';

// Constants for energy calculations
const THERM_TO_KWH = 29.3;  // 1 therm = 29.3 kWh
const KWH_TO_KBTU = 3.412;  // 1 kWh = 3.412 kBTU

export class EnergyCalculator implements IEnergyCalculator {
  /**
   * Calculates the total energy consumption from audit data
   * @param auditData Energy audit data
   * @returns Total energy consumption in kWh
   */
  calculateTotalEnergy(auditData: EnergyAuditData): number {
    try {
      if (!auditData || !auditData.energyConsumption) {
        appLogger.warn('Missing energy consumption data, using default values');
        return 12000; // Reasonable default for a medium-sized home
      }
      
      const electricBill = typeof auditData.energyConsumption.electricBill === 'number' ? 
        auditData.energyConsumption.electricBill : 0;
      
      const gasBill = typeof auditData.energyConsumption.gasBill === 'number' ? 
        auditData.energyConsumption.gasBill : 0;
      
      // Convert monthly bills to annual kWh
      const electricKwhPerYear = electricBill * 12;
      const gasKwhPerYear = gasBill * THERM_TO_KWH * 12; // Convert therms to kWh
      
      const totalEnergy = electricKwhPerYear + gasKwhPerYear;
      
      // Validate result is reasonable (non-zero and not too high)
      if (totalEnergy <= 0) {
        appLogger.warn('Calculated energy consumption is zero or negative, using default value');
        return 12000; // Reasonable default
      }
      
      if (totalEnergy > 100000) {
        appLogger.warn('Calculated energy consumption is unusually high, capping at reasonable maximum');
        return 100000; // Cap at reasonable maximum
      }
      
      return totalEnergy;
    } catch (error) {
      appLogger.error('Error calculating total energy', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 12000; // Return reasonable default on error
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
    try {
      if (!propertyType || typeof propertyType !== 'string') {
        appLogger.warn('Invalid property type for baseline consumption', { propertyType });
        propertyType = 'single-family'; // Default to single-family
      }
      
      if (!squareFootage || squareFootage <= 0 || typeof squareFootage !== 'number') {
        appLogger.warn('Invalid square footage for baseline consumption', { squareFootage });
        squareFootage = 2000; // Default to average home size
      }
      
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
    } catch (error) {
      appLogger.error('Error calculating baseline consumption', { 
        error: error instanceof Error ? error.message : String(error),
        propertyType,
        squareFootage
      });
      // Return a reasonable default based on a 2000 sq ft home
      return 22000;
    }
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
        auditData.basicInfo?.propertyType || 'single-family',
        auditData.homeDetails?.squareFootage || 2000
      );
      const actualConsumption = this.calculateTotalEnergy(auditData);
      
      if (baselineConsumption <= 0 || actualConsumption <= 0) {
        appLogger.warn('Invalid consumption values for efficiency calculation', {
          baselineConsumption,
          actualConsumption
        });
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
  
  /**
   * Calculates the Energy Use Intensity (EUI) in kBtu per square foot
   * EUI is a standard metric for comparing energy usage across different building sizes
   * @param auditData Energy audit data
   * @returns Energy Use Intensity (kBtu/sqft)
   */
  calculateEnergyUseIntensity(auditData: EnergyAuditData): number {
    try {
      const totalEnergy = this.calculateTotalEnergy(auditData);
      const squareFootage = auditData.homeDetails?.squareFootage || 0;
      
      if (squareFootage <= 0) {
        appLogger.warn('Invalid square footage for EUI calculation', { squareFootage });
        return 0;
      }
      
      // Convert kWh to kBtu
      const totalKbtu = totalEnergy * KWH_TO_KBTU;
      
      // Calculate EUI (kBtu/sqft)
      const eui = totalKbtu / squareFootage;
      
      appLogger.debug('Energy use intensity calculation', {
        totalEnergy,
        totalKbtu,
        squareFootage,
        eui
      });
      
      return eui;
    } catch (error) {
      appLogger.error('Error calculating energy use intensity', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }
  
  /**
   * Get contextual description of energy efficiency
   * @param efficiency The calculated efficiency percentage
   * @returns Description with rating and comparison
   */
  getEfficiencyDescription(efficiency: number): string {
    if (efficiency >= 90) return 'Excellent (top 10% of similar homes)';
    if (efficiency >= 80) return 'Very Good (top 20% of similar homes)';
    if (efficiency >= 70) return 'Good (better than average)';
    if (efficiency >= 60) return 'Average (typical for similar homes)';
    if (efficiency >= 50) return 'Below Average (improvements recommended)';
    return 'Poor (significant improvement potential)';
  }
}

export const energyCalculator = new EnergyCalculator();
