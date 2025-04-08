/**
 * Report Generation Module
 * 
 * This module handles the generation of PDF reports for energy audits.
 * It is organized into several sub-modules:
 * 
 * - formatters: Handle formatting of values, tables, and headers in the PDF
 * - calculators: Perform calculations for energy efficiency, savings, etc.
 * - chart-generators: Generate charts and graphs for the report
 * - section-generators: Generate specific sections of the report
 * 
 * The main ReportGenerationService class orchestrates all these components
 * to produce a complete PDF report.
 */

import { formatters, createFormatters } from './formatters/index.js';
import { calculators, createCalculators } from './calculators/index.js';
import { chartGenerators, createChartGenerators } from './chart-generators/index.js';
import { ReportGenerationService } from './ReportGenerationService.js';

// Create default instance with all components
const defaultService = new ReportGenerationService(
  formatters,
  calculators,
  chartGenerators
);

// Export everything
export { 
  ReportGenerationService,
  formatters,
  calculators,
  chartGenerators,
  createFormatters,
  createCalculators,
  createChartGenerators,
  defaultService as reportGenerationService
};

// Re-export types
export * from './types/index.js';

// Re-export individual components for direct access
export * from './formatters/index.js';
export * from './calculators/index.js';
export * from './chart-generators/index.js';
