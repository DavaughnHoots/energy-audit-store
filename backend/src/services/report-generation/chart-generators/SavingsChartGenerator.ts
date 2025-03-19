import { ISavingsChartGenerator } from '../types/index.js';
import { AuditRecommendation } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';
import { createCanvas } from 'canvas';
import { Chart } from 'chart.js/auto';

export class SavingsChartGenerator implements ISavingsChartGenerator {
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

      // Log chart data for debugging
      appLogger.debug('Chart data preparation', {
        labels: recommendations.map(rec => rec.title.substring(0, 20) + '...'),
        estimatedSavings: recommendations.map(rec => rec.estimatedSavings),
        actualSavings: recommendations.map(rec => rec.actualSavings || 0)
      });

      // Cast context to any to avoid Chart.js type issues
      const chart = new Chart(ctx as any, {
        type: 'bar',
        data: {
          labels: recommendations.map(rec => rec.title.substring(0, 20) + '...'),
          datasets: [
            {
              label: 'Estimated Savings ($)',
              data: recommendations.map(rec => rec.estimatedSavings),
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            },
            {
              label: 'Actual Savings ($)',
              data: recommendations.map(rec => rec.actualSavings || 0),
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
