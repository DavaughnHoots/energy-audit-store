// backend/src/types/calculations.ts

/**
 * Energy consumption calculation inputs
 */
export interface EnergyConsumptionInput {
    power: number; // in kilowatts (kW)
    time: number; // in hours
  }
  
  /**
   * Heat transfer calculation inputs
   */
  export interface HeatTransferInput {
    uValue: number; // heat transfer coefficient (W/m²·K)
    area: number; // surface area (m²)
    temperatureDiff: number; // temperature difference (K)
  }
  
  /**
   * HVAC energy calculation inputs
   */
  export interface HVACEnergyInput {
    volume: number; // room volume (m³)
    temperatureDiff: number; // temperature difference (K)
    efficiency?: number; // system efficiency (0-1)
  }
  
  /**
   * Lighting efficiency calculation inputs
   */
  export interface LightingEfficiencyInput {
    luminousFlux: number; // in lumens
    wattage: number; // in watts
  }
  
  /**
   * Solar potential calculation inputs
   */
  export interface SolarPotentialInput {
    area: number; // panel area (m²)
    solarRadiation: number; // daily insolation (kWh/m²)
    efficiency?: number; // panel efficiency (0-1)
    performanceRatio?: number; // system performance ratio (0-1)
  }
  
  /**
   * Energy savings calculation inputs
   */
  export interface EnergySavingsInput {
    energyBefore: number; // energy usage before (kWh)
    energyAfter: number; // energy usage after (kWh)
  }
  
  /**
   * Payback period calculation inputs
   */
  export interface PaybackPeriodInput {
    cost: number; // total cost of upgrade ($)
    annualSavings: number; // yearly savings ($)
  }
  
  /**
   * Energy efficiency score inputs
   */
  export interface EfficiencyScoreInput {
    totalConsumption: number; // total energy consumption (kWh)
    interventionSavings: number; // energy saved from interventions (kWh)
    occupancyFactor: number; // building occupancy factor (0-1)
  }
  
  /**
   * Savings potential calculation results
   */
  export interface SavingsPotentialResult {
    annualSavings: number; // yearly cost savings ($)
    tenYearSavings: number; // 10-year cost savings ($)
    carbonReduction: number; // carbon reduction (kg CO2)
    breakdowns: {
      hvac: number; // HVAC savings (kWh)
      lighting: number; // lighting savings (kWh)
      envelope: number; // building envelope savings (kWh)
    };
  }
  
  /**
   * Building envelope characteristics
   */
  export interface EnvelopeCharacteristics {
    wallArea: number; // total wall area (m²)
    windowArea: number; // total window area (m²)
    roofArea: number; // roof area (m²)
    wallUValue: number; // wall heat transfer coefficient (W/m²·K)
    windowUValue: number; // window heat transfer coefficient (W/m²·K)
    roofUValue: number; // roof heat transfer coefficient (W/m²·K)
  }
  
  /**
   * HVAC system characteristics
   */
  export interface HVACCharacteristics {
    heatingEfficiency: number; // heating system efficiency (0-1)
    coolingEfficiency: number; // cooling system efficiency (0-1)
    ventilationRate: number; // air changes per hour
    zoneVolume: number; // conditioned space volume (m³)
  }
  
  /**
   * Lighting system characteristics
   */
  export interface LightingCharacteristics {
    totalLumens: number; // total light output (lumens)
    totalWattage: number; // total power consumption (watts)
    operatingHours: number; // yearly operating hours
  }
  
  /**
   * Calculation error types
   */
  export enum CalculationErrorType {
    INVALID_INPUT = 'INVALID_INPUT',
    DIVISION_BY_ZERO = 'DIVISION_BY_ZERO',
    NEGATIVE_VALUE = 'NEGATIVE_VALUE',
    COMPUTATION_ERROR = 'COMPUTATION_ERROR'
  }
  
  /**
   * Custom error class for calculations
   */
  export class CalculationError extends Error {
    constructor(
      public type: CalculationErrorType,
      public detail: string,
      public input?: any
    ) {
      super(`Calculation error: ${detail}`);
      this.name = 'CalculationError';
    }
  }