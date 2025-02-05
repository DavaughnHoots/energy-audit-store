// backend/src/tests/calculationService.test.ts

import { CalculationService } from '../services/calculationService';
import { CalculationError, CalculationErrorType } from '../types/calculations';

describe('CalculationService', () => {
  let calculationService: CalculationService;

  beforeEach(() => {
    calculationService = new CalculationService();
  });

  describe('calculateEnergyConsumption', () => {
    it('should correctly calculate energy consumption', () => {
      // From example in document: 2kW running for 5 hours = 10kWh
      const result = calculationService.calculateEnergyConsumption(2, 5);
      expect(result).toBe(10);
    });

    it('should handle zero power input', () => {
      const result = calculationService.calculateEnergyConsumption(0, 5);
      expect(result).toBe(0);
    });

    it('should throw error for negative time', () => {
      expect(() => {
        calculationService.calculateEnergyConsumption(2, -5);
      }).toThrow();
    });
  });

  describe('calculateHeatTransfer', () => {
    it('should correctly calculate heat transfer', () => {
      // Test with sample values
      const result = calculationService.calculateHeatTransfer(
        0.5, // U-value (W/m²·K)
        100, // Area (m²)
        20   // Temperature difference (K)
      );
      expect(result).toBe(1000); // 0.5 * 100 * 20 = 1000W
    });

    it('should handle zero temperature difference', () => {
      const result = calculationService.calculateHeatTransfer(0.5, 100, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateHVACEnergy', () => {
    it('should correctly calculate HVAC energy consumption', () => {
      const result = calculationService.calculateHVACEnergy(
        1000, // Volume (m³)
        10,   // Temperature difference (K)
        0.8   // Efficiency
      );
      // Using constants from service:
      // (1000 * 1.225 * 1005 * 10) / 0.8
      expect(result).toBeCloseTo(15451875); // Joules
    });

    it('should use default efficiency if not provided', () => {
      const withDefault = calculationService.calculateHVACEnergy(1000, 10);
      const withExplicit = calculationService.calculateHVACEnergy(1000, 10, 0.8);
      expect(withDefault).toBe(withExplicit);
    });
  });

  describe('calculateLightingEfficiency', () => {
    it('should correctly calculate lighting efficiency', () => {
      const result = calculationService.calculateLightingEfficiency(1000, 10);
      expect(result).toBe(100); // 1000 lumens / 10 watts = 100 lm/W
    });

    it('should throw error for zero wattage', () => {
      expect(() => {
        calculationService.calculateLightingEfficiency(1000, 0);
      }).toThrow();
    });
  });

  describe('calculateSolarPotential', () => {
    it('should correctly calculate solar energy potential', () => {
      const result = calculationService.calculateSolarPotential(
        100,  // Area (m²)
        5,    // Solar radiation (kWh/m²)
        0.2,  // Efficiency
        0.75  // Performance ratio
      );
      expect(result).toBe(75); // 100 * 5 * 0.2 * 0.75 = 75 kWh
    });

    it('should use default efficiency and performance ratio if not provided', () => {
      const result = calculationService.calculateSolarPotential(100, 5);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateEnergySavings', () => {
    it('should correctly calculate energy savings', () => {
      const result = calculationService.calculateEnergySavings(1000, 800);
      expect(result).toBe(200); // 1000 - 800 = 200 kWh saved
    });

    it('should handle negative savings', () => {
      const result = calculationService.calculateEnergySavings(800, 1000);
      expect(result).toBe(-200); // Negative savings = increased consumption
    });
  });

  describe('calculateCarbonReduction', () => {
    it('should correctly calculate carbon reduction', () => {
      const result = calculationService.calculateCarbonReduction(1000);
      // Using emission factor from constants (0.4 kg CO2/kWh)
      expect(result).toBe(400); // 1000 kWh * 0.4 = 400 kg CO2
    });

    it('should handle zero energy savings', () => {
      const result = calculationService.calculateCarbonReduction(0);
      expect(result).toBe(0);
    });
  });

  describe('calculatePaybackPeriod', () => {
    it('should correctly calculate payback period', () => {
      const result = calculationService.calculatePaybackPeriod(10000, 2000);
      expect(result).toBe(5); // 10000 / 2000 = 5 years
    });

    it('should throw error for zero annual savings', () => {
      expect(() => {
        calculationService.calculatePaybackPeriod(10000, 0);
      }).toThrow();
    });
  });

  describe('calculateEfficiencyScore', () => {
    it('should correctly calculate efficiency score', () => {
      const result = calculationService.calculateEfficiencyScore(
        1000,  // Total consumption
        200,   // Intervention savings
        0.75   // Occupancy factor
      );
      expect(result).toBe(6.67); // 1000 / (200 * 0.75) ≈ 6.67
    });

    it('should throw error for invalid inputs', () => {
      expect(() => {
        calculationService.calculateEfficiencyScore(1000, 0, 0.75);
      }).toThrow();
    });
  });

  describe('calculateSavingsPotential', () => {
    it('should calculate comprehensive savings potential', () => {
      const mockAuditData = {
        homeDetails: {
          homeSize: 200, // m²
        },
        energyConsumption: {
          powerConsumption: 5, // kW
        }
      };

      const result = calculationService.calculateSavingsPotential(mockAuditData);

      expect(result).toHaveProperty('annualSavings');
      expect(result).toHaveProperty('tenYearSavings');
      expect(result).toHaveProperty('carbonReduction');
      expect(result).toHaveProperty('breakdowns');
      expect(result.breakdowns).toHaveProperty('hvac');
      expect(result.breakdowns).toHaveProperty('lighting');
      expect(result.breakdowns).toHaveProperty('envelope');

      expect(result.tenYearSavings).toBe(result.annualSavings * 10);
      expect(result.annualSavings).toBeGreaterThan(0);
    });
  });
});

describe('CalculationError', () => {
  it('should create error with correct properties', () => {
    const error = new CalculationError(
      CalculationErrorType.INVALID_INPUT,
      'Invalid temperature value',
      { temp: -500 }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe(CalculationErrorType.INVALID_INPUT);
    expect(error.detail).toBe('Invalid temperature value');
    expect(error.input).toEqual({ temp: -500 });
  });
});