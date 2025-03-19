import { IValueFormatter } from '../types/index.js';
import { appLogger } from '../../../utils/logger.js';

export class ValueFormatter implements IValueFormatter {
  /**
   * Formats a value for display in the PDF
   * @param value Value to format
   * @param type Type of formatting to apply
   * @param context Optional context for providing better fallbacks
   * @returns Formatted string
   */
  formatValue(
    value: any,
    type: 'currency' | 'percentage' | 'number' | 'text' | 'auto' = 'text',
    context: string = ''
  ): string {
    // Check for invalid values first
    if (value === undefined || value === null || 
        (typeof value === 'number' && isNaN(value))) {
      
      // Use context-appropriate fallbacks
      switch (type) {
        case 'currency':
          return context.includes('savings') ? 'Estimated: $200-300/year' : 'Not calculated';
        case 'percentage':
          return context.includes('efficiency') ? 'Typical range: 70-80%' : 'Not calculated';
        case 'number':
          return 'Not available';
        default:
          return 'Not available';
      }
    }
    
    // Format valid values appropriately with proper precision
    switch (type) {
      case 'currency':
        if (typeof value === 'number') {
          // Use appropriate precision based on value magnitude
          if (Math.abs(value) >= 1000) {
            return `$${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
          } else {
            return `$${value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
          }
        }
        return value.toString();
        
      case 'percentage':
        if (typeof value === 'number') {
          // Don't show decimal places for whole percentages
          return value % 1 === 0 ? `${value}%` : `${value.toFixed(1)}%`;
        }
        return value.toString();
        
      case 'number':
        if (typeof value === 'number') {
          // Use appropriate precision based on value magnitude
          if (Math.abs(value) >= 1000) {
            return value.toLocaleString(undefined, {maximumFractionDigits: 0});
          } else if (Math.abs(value) >= 100) {
            return value.toLocaleString(undefined, {maximumFractionDigits: 1});
          } else {
            return value.toLocaleString(undefined, {maximumFractionDigits: 2});
          }
        }
        return value.toString();
        
      case 'auto':
        // Try to determine the type
        if (typeof value === 'string' && value.startsWith('$')) {
          return this.formatValue(value, 'currency', context);
        } else if (typeof value === 'number') {
          return this.formatValue(value, 'number', context);
        } else {
          return this.formatValue(value, 'text', context);
        }
        
      case 'text':
      default:
        return value.toString();
    }
  }
}

export const valueFormatter = new ValueFormatter();
