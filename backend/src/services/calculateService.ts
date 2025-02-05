// backend/src/services/calculationService.ts

import { EnergyAuditData } from '../types/energyAudit';
import { appLogger } from '../config/logger';

/**
 * Constants for calculations
 */
const CONSTANTS = {
  AIR_DENSITY: 1.225, // kg/m³ at sea level and 15°C
  AIR_SPECIFIC_HEAT: 1005, // J/kg·K
  EMISSION_FACTOR: 0.4, // kg CO2/kWh (example value, should be region-specific)
  HVAC_DEFAULT_EFFICIENCY: 0.8,
  TYPICAL_SOLAR_PANEL_EFFICIENCY: 0.2,
  PERFORMANCE_RATIO: 0.75,
  LUMENS_PER_WATT_LED: 100 // Modern LED efficiency
};

export class CalculationService {
  /**
   * Calculate total energy consumption
   * E = P × t
   */
  calculateEnergyConsumption(power: number, time: number): number {
    try {
      return power * time; // kWh
    } catch (error) {
      appLogger.error('Energy consumption calculation error:', { error });
      throw new Error('Failed to calculate energy consumption');
    }
  }

  /**
   * Calculate heat transfer through building envelope
   * Q = U × A × ∆T
   */
  calculateHeatTransfer(
    uValue: number,
    area: number,
    temperatureDiff: number
  ): number {
    try {
      return uValue * area * temperatureDiff; // Watts
    } catch (error) {
      appLogger.error('Heat transfer calculation error:', { error });
      throw new Error('Failed to calculate heat transfer');
    }
  }

  /**
   * Calculate HVAC energy consumption
   * EHVAC = (V × ρ × Cp × ∆T) / η
   */
  calculateHVACEnergy(
    volume: number,
    temperatureDiff: number,
    efficiency: number = CONSTANTS.HVAC_DEFAULT_EFFICIENCY
  ): number {
    try {
      return (
        (volume * 
        CONSTANTS.AIR_DENSITY * 
        CONSTANTS.AIR_SPECIFIC_HEAT * 
        temperatureDiff) / 
        efficiency
      ); // Joules
    } catch (error) {
      appLogger.error('HVAC energy calculation error:', { error });
      throw new Error('Failed to calculate HVAC energy');
    }
  }

  /**
   * Calculate lighting efficiency
   * Elighting = Luminous flux / Wattage
   */
  calculateLightingEfficiency(luminousFlux: number, wattage: number): number {
    try {
      return luminousFlux / wattage; // lumens per watt
    } catch (error) {
      appLogger.error('Lighting efficiency calculation error:', { error });
      throw new Error('Failed to calculate lighting efficiency');
    }
  }

  /**
   * Calculate solar energy potential
   * Esolar = A × r × H × PR
   */
  calculateSolarPotential(
    area: number,
    solarRadiation: number,
    efficiency: number = CONSTANTS.TYPICAL_SOLAR_PANEL_EFFICIENCY,
    performanceRatio: number = CONSTANTS.PERFORMANCE_RATIO
  ): number {
    try {
      return area * efficiency * solarRadiation * performanceRatio; // kWh
    } catch (error) {
      appLogger.error('Solar potential calculation error:', { error });
      throw new Error('Failed to calculate solar potential');
    }
  }

  /**
   * Calculate energy savings
   * S = Ebefore - Eafter
   */
  calculateEnergySavings(
    energyBefore: number,
    energyAfter: number
  ): number {
    try {
      return energyBefore - energyAfter; // kWh
    } catch (error) {
      appLogger.error('Energy savings calculation error:', { error });
      throw new Error('Failed to calculate energy savings');
    }
  }

  /**
   * Calculate carbon emissions reduction
   * Creduced = S × EF
   */
  calculateCarbonReduction(energySaved: number): number {
    try {
      return energySaved * CONSTANTS.EMISSION_FACTOR; // kg CO2
    } catch (error) {
      appLogger.error('Carbon reduction calculation error:', { error });
      throw new Error('Failed to calculate carbon reduction');
    }
  }

  /**
   * Calculate payback period
   * P = C / Sannual
   */
  calculatePaybackPeriod(cost: number, annualSavings: number): number {
    try {
      if (annualSavings <= 0) {
        throw new Error('Annual savings must be greater than zero');
      }
      return cost / annualSavings; // years
    } catch (error) {
      appLogger.error('Payback period calculation error:', { error });
      throw new Error('Failed to calculate payback period');
    }
  }

  /**
   * Calculate Energy Efficiency Score (EES)
   * EES = Total Consumption / (Intervention Savings × Occupancy Factor)
   */
  calculateEfficiencyScore(
    totalConsumption: number,
    interventionSavings: number,
    occupancyFactor: number
  ): number {
    try {
      if (interventionSavings <= 0 || occupancyFactor <= 0) {
        throw new Error('Invalid savings or occupancy values');
      }
      return totalConsumption / (interventionSavings * occupancyFactor);
    } catch (error) {
      appLogger.error('Efficiency score calculation error:', { error });
      throw new Error('Failed to calculate efficiency score');
    }
  }

  /**
   * Calculate total potential savings from audit data
   */
  calculateSavingsPotential(auditData: EnergyAuditData) {
    try {
      // Calculate current total energy usage
      const currentEnergyUse = this.calculateEnergyConsumption(
        auditData.energyConsumption.powerConsumption,
        8760 // hours per year
      );

      // Calculate potential HVAC savings
      const hvacSavings = this.calculateHVACEnergy(
        auditData.homeDetails.homeSize * 2.5, // Approximate volume
        15, // Average temperature difference
        0.95 // Improved efficiency
      ) - this.calculateHVACEnergy(
        auditData.homeDetails.homeSize * 2.5,
        15,
        0.8 // Current efficiency
      );

      // Calculate potential lighting savings
      const lightingSavings = currentEnergyUse * 0.15; // Typical 15% from lighting upgrades

      // Calculate potential envelope improvements
      const envelopeSavings = currentEnergyUse * 0.25; // Typical 25% from insulation

      const totalPotentialSavings = hvacSavings + lightingSavings + envelopeSavings;
      const annualSavings = totalPotentialSavings * 0.12; // Average electricity rate
      const tenYearSavings = annualSavings * 10;
      const carbonReduction = this.calculateCarbonReduction(totalPotentialSavings);

      return {
        annualSavings,
        tenYearSavings,
        carbonReduction,
        breakdowns: {
          hvac: hvacSavings,
          lighting: lightingSavings,
          envelope: envelopeSavings
        }
      };
    } catch (error) {
      appLogger.error('Savings potential calculation error:', { error });
      throw new Error('Failed to calculate savings potential');
    }
  }
}

export const calculationService = new CalculationService();