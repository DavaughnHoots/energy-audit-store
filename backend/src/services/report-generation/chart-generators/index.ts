import { IChartGenerators } from '../types/index.js';
import { SavingsChartGenerator, savingsChartGenerator } from './SavingsChartGenerator.js';
import { EnergyBreakdownChartGenerator, energyBreakdownChartGenerator } from './EnergyBreakdownChartGenerator.js';
import { ConsumptionChartGenerator, consumptionChartGenerator } from './ConsumptionChartGenerator.js';

export { SavingsChartGenerator, savingsChartGenerator } from './SavingsChartGenerator.js';
export { EnergyBreakdownChartGenerator, energyBreakdownChartGenerator } from './EnergyBreakdownChartGenerator.js';
export { ConsumptionChartGenerator, consumptionChartGenerator } from './ConsumptionChartGenerator.js';

/**
 * Factory function to create a chart generators object with all chart generator implementations
 * @returns An object containing all chart generator instances
 */
export function createChartGenerators(): IChartGenerators {
  return {
    savingsChartGenerator,
    energyBreakdownChartGenerator,
    consumptionChartGenerator
  };
}

/**
 * Default chart generators instance to use
 */
export const chartGenerators: IChartGenerators = {
  savingsChartGenerator,
  energyBreakdownChartGenerator,
  consumptionChartGenerator
};
