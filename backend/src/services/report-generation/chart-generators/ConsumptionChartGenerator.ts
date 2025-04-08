import { IConsumptionChartGenerator } from '../types/index.js';
import { EnergyAuditData } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';
import { createCanvas } from 'canvas';
import { Chart, TooltipItem } from 'chart.js/auto';

export class ConsumptionChartGenerator implements IConsumptionChartGenerator {
  /**
   * Generates an energy consumption breakdown bar chart
   * @param auditData Energy audit data
   * @param width Chart width
   * @param height Chart height
   * @returns Buffer containing the chart image
   */
  async generate(
    auditData: EnergyAuditData,
    width: number,
    height: number
  ): Promise<Buffer> {
    appLogger.debug('Generating energy consumption breakdown chart', { 
      chartDimensions: { width, height }
    });

    try {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Calculate values based on available properties
      const baseConsumption = auditData.energyConsumption.electricBill * 12; // Use annual electric bill as base
      const seasonalFactor = auditData.energyConsumption.seasonalFactor || 1.2;
      const occupancyFactor = auditData.energyConsumption.occupancyFactor || 0.9;
      const powerFactor = auditData.energyConsumption.powerFactor || 0.95;
      
      // Calculate consumption at different stages
      const seasonalConsumption = baseConsumption * seasonalFactor;
      const occupiedConsumption = seasonalConsumption * occupancyFactor;
      const realConsumption = occupiedConsumption * powerFactor;
      
      // Log chart data for debugging
      appLogger.debug('Energy consumption breakdown data', {
        baseConsumption,
        seasonalConsumption,
        occupiedConsumption,
        realConsumption,
        factors: {
          seasonalFactor,
          occupancyFactor,
          powerFactor
        }
      });
      
      // Cast context to any to avoid Chart.js type issues
      const chart = new Chart(ctx as any, {
        type: 'bar',
        data: {
          labels: ['Base', 'Seasonal', 'Occupied', 'Real'],
          datasets: [{
            label: 'Energy (kWh)',
            data: [baseConsumption, seasonalConsumption, occupiedConsumption, realConsumption],
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Energy (kWh)'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Energy Consumption Breakdown'
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem: TooltipItem<'bar'>) => {
                  const value = tooltipItem.raw as number;
                  return `${value.toFixed(0)} kWh`;
                }
              }
            }
          }
        }
      });
      
      return canvas.toBuffer('image/png');
    } catch (error) {
      appLogger.error('Error generating energy consumption breakdown chart', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

export const consumptionChartGenerator = new ConsumptionChartGenerator();
