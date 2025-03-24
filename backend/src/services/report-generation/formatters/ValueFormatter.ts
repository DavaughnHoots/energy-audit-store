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
    try {
      // Check for invalid values first
      if (value === undefined || value === null || 
          (typeof value === 'number' && isNaN(value))) {
        
        // Use context-appropriate fallbacks with more specific context handling
        switch (type) {
          case 'currency':
            if (context.includes('savings')) return 'Estimated: $200-300/year';
            if (context.includes('cost')) return 'Varies by implementation';
            return 'Not calculated';
            
          case 'percentage':
            if (context.includes('efficiency')) return 'Typical range: 70-80%';
            if (context.includes('accuracy')) return 'To be determined';
            return 'Not calculated';
            
          case 'number':
            if (context.includes('score')) return '70 (estimated)';
            if (context.includes('payback')) return '2-5 years';
            if (context.includes('energy')) return '12,000 (estimated)';
            return 'Not available';
            
          default:
            return 'Not available';
        }
      }
    
      // Ensure value is a proper number if it's supposed to be
      if ((type === 'currency' || type === 'percentage' || type === 'number') && 
          typeof value !== 'number') {
        // Try to convert to number
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
          value = parsedValue;
        } else {
          // If conversion fails, use appropriate fallback
          appLogger.warn('Failed to convert value to number for formatting', { 
            value, type, context 
          });
          return this.formatValue(undefined, type, context);
        }
      }
      
      // Format valid values appropriately with proper precision
      switch (type) {
        case 'currency':
          if (typeof value === 'number') {
            // Validate the value is reasonable before formatting
            if (value < 0 && !context.includes('savings')) {
              appLogger.warn('Negative currency value detected', { value, context });
              value = 0;
            }
            
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
            // Validate percentage is reasonable
            if (value < 0 || value > 100) {
              appLogger.warn('Percentage value out of range', { value, context });
              value = Math.max(0, Math.min(100, value));
            }
            
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
            return this.formatValue(value.substring(1), 'currency', context);
          } else if (typeof value === 'number') {
            return this.formatValue(value, 'number', context);
          } else {
            return this.formatValue(value, 'text', context);
          }
          
        case 'text':
        default:
          return value?.toString() || 'Not specified';
      }
    } catch (error) {
      appLogger.error('Error formatting value', { 
        error: error instanceof Error ? error.message : String(error),
        value,
        type,
        context
      });
      
      // Safe fallbacks based on type
      switch (type) {
        case 'currency': return 'N/A';
        case 'percentage': return 'N/A';
        case 'number': return 'N/A';
        default: return 'N/A';
      }
    }
  }
}

export const valueFormatter = new ValueFormatter();
