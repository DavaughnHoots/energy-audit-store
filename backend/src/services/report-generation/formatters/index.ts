import { IFormatters } from '../types/index.js';
import { ValueFormatter, valueFormatter } from './ValueFormatter.js';
import { TableFormatter, tableFormatter } from './TableFormatter.js';
import { HeaderFormatter, headerFormatter } from './HeaderFormatter.js';
import { RecommendationFormatter } from './RecommendationFormatter.js';

export { ValueFormatter, valueFormatter } from './ValueFormatter.js';
export { TableFormatter, tableFormatter } from './TableFormatter.js';
export { HeaderFormatter, headerFormatter } from './HeaderFormatter.js';
export { RecommendationFormatter } from './RecommendationFormatter.js';

// Create singleton instance of the RecommendationFormatter
export const recommendationFormatter = new RecommendationFormatter();

/**
 * Factory function to create a formatters object with all formatter implementations
 * @returns An object containing all formatter instances
 */
export function createFormatters(): IFormatters {
  return {
    valueFormatter,
    tableFormatter,
    headerFormatter,
    recommendationFormatter
  };
}

/**
 * Default formatters instance to use
 */
export const formatters: IFormatters = {
  valueFormatter,
  tableFormatter,
  headerFormatter,
  recommendationFormatter
};
