import { ISavingsChartGenerator } from '../types/index.js';
import { AuditRecommendation } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';
import { createCanvas } from 'canvas';
import { Chart } from 'chart.js/auto';

export class SavingsChartGenerator implements ISavingsChartGenerator {
  /**
   * Get default estimated savings based on recommendation type
   * @param title Recommendation title
   * @param description Recommendation description
   * @returns Default estimated savings value
   */
  private getDefaultSavingsForCategory(title: string, description: string): number {
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    
    // Default savings by category
    if (titleLower.includes('insulation') || descLower.includes('insulation')) {
      return 350;
    } else if (titleLower.includes('hvac') || descLower.includes('hvac') || 
              titleLower.includes('heating') || descLower.includes('heating')) {
      return 450;
    } else if (titleLower.includes('light') || descLower.includes('light') ||
              titleLower.includes('bulb') || descLower.includes('bulb')) {
      return 200;
    } else if (titleLower.includes('window') || descLower.includes('window')) {
      return 300;
    } else if (titleLower.includes('air seal') || descLower.includes('air seal') ||
              titleLower.includes('draft') || descLower.includes('draft')) {
      return 180;
    } else if (titleLower.includes('thermostat') || descLower.includes('thermostat')) {
      return 120;
    }
    
    // Default value
    return 200;
  }
  /**
   * Generates a savings chart for the recommendations
   * @param recommendations Audit recommendations
   * @param width Chart width
   * @param height Chart height
   * @returns Buffer containing the chart image
   */
  async generate(
    recommendations: AuditRecommendation[],
    width: number,
    height: number
  ): Promise<Buffer> {
    appLogger.debug('Generating savings chart', { 
      recommendationsCount: recommendations.length,
      chartDimensions: { width, height }
    });

    try {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Ensure all recommendations have valid financial data
      const validatedRecs = recommendations.map(rec => {
        // Use ReportValidationHelper to validate each recommendation
        const validRec = { ...rec };
        
        // Ensure we have valid savings data
        if (typeof validRec.estimatedSavings !== 'number' || isNaN(validRec.estimatedSavings)) {
          // Get default value based on category
          validRec.estimatedSavings = this.getDefaultSavingsForCategory(rec.title, rec.description);
        }
        
        return validRec;
      });
      
      // Log chart data for debugging
      appLogger.debug('Chart data preparation', {
        labels: validatedRecs.map(rec => rec.title.substring(0, 20) + '...'),
        estimatedSavings: validatedRecs.map(rec => rec.estimatedSavings),
        actualSavings: validatedRecs.map(rec => rec.actualSavings || 0)
      });

      // Cast context to any to avoid Chart.js type issues
      const chart = new Chart(ctx as any, {
        type: 'bar',
        data: {
          labels: validatedRecs.map(rec => rec.title.substring(0, 20) + '...'),
          datasets: [
            {
              label: 'Estimated Savings ($)',
              data: validatedRecs.map(rec => rec.estimatedSavings),
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            },
            {
              label: 'Actual Savings ($)',
              data: validatedRecs.map(rec => rec.actualSavings || 0),
              backgroundColor: 'rgba(34, 197, 94, 0.5)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Annual Savings ($)'
              }
            }
          }
        }
      });

      return canvas.toBuffer('image/png');
    } catch (error) {
      appLogger.error('Error generating savings chart', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        recommendationsCount: recommendations.length
      });
      throw error;
    }
  }
}

export const savingsChartGenerator = new SavingsChartGenerator();
