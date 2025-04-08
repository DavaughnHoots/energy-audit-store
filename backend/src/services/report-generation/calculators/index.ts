import { ICalculators } from '../types/index.js';
import { EnergyCalculator, energyCalculator } from './EnergyCalculator.js';
import { SavingsCalculator, savingsCalculator } from './SavingsCalculator.js';
import { BulbCalculator, bulbCalculator } from './BulbCalculator.js';
import { HvacCalculator, hvacCalculator } from './HvacCalculator.js';
import { SummaryCalculator, summaryCalculator } from './SummaryCalculator.js';

export { EnergyCalculator, energyCalculator } from './EnergyCalculator.js';
export { SavingsCalculator, savingsCalculator } from './SavingsCalculator.js';
export { BulbCalculator, bulbCalculator } from './BulbCalculator.js';
export { HvacCalculator, hvacCalculator } from './HvacCalculator.js';
export { SummaryCalculator, summaryCalculator } from './SummaryCalculator.js';

/**
 * Factory function to create a calculators object with all calculator implementations
 * @returns An object containing all calculator instances
 */
export function createCalculators(): ICalculators {
  return {
    energyCalculator,
    savingsCalculator,
    bulbCalculator,
    hvacCalculator,
    summaryCalculator
  };
}

/**
 * Default calculators instance to use
 */
export const calculators: ICalculators = {
  energyCalculator,
  savingsCalculator,
  bulbCalculator,
  hvacCalculator,
  summaryCalculator
};
