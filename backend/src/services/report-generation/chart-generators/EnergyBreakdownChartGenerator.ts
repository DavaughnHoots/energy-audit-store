import { IEnergyBreakdownChartGenerator } from '../types/index.js';
import { EnergyAuditData } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';
import { createCanvas } from 'canvas';
import { Chart, TooltipItem } from 'chart.js/auto';

export class EnergyBreakdownChartGenerator implements IEnergyBreakdownChartGenerator {
  /**
   * Generates an energy breakdown pie chart
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
    appLogger.debug('Generating energy breakdown chart', { 
      chartDimensions: { width, height }
    });

    try {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Calculate energy usage breakdown
      const electricKwhPerYear = auditData.energyConsumption.electricBill * 12;
      const gasKwhPerYear = auditData.energyConsumption.gasBill * 29.3 * 12; // Convert therms to kWh
      const totalKwh = electricKwhPerYear + gasKwhPerYear;

      // Log energy data for debugging
      appLogger.debug('Energy breakdown data', {
        electricKwhPerYear,
        gasKwhPerYear,
        totalKwh,
        electricPercentage: (electricKwhPerYear / totalKwh) * 100,
        gasPercentage: (gasKwhPerYear / totalKwh) * 100
      });

      // Cast context to any to avoid Chart.js type issues
      const chart = new Chart(ctx as any, {
        type: 'pie',
        data: {
          labels: ['Electricity', 'Natural Gas'],
          datasets: [{
            data: [
              (electricKwhPerYear / totalKwh) * 100,
              (gasKwhPerYear / totalKwh) * 100
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.5)',
              'rgba(234, 88, 12, 0.5)'
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(234, 88, 12)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem: TooltipItem<'pie'>) => {
                  const value = tooltipItem.raw as number;
                  return `${value.toFixed(1)}% of total energy use`;
                }
              }
            }
          }
        }
      });

      return canvas.toBuffer('image/png');
    } catch (error) {
      appLogger.error('Error generating energy breakdown chart', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        energyData: {
          electric: auditData.energyConsumption.electricBill,
          gas: auditData.energyConsumption.gasBill
        }
      });
      throw error;
    }
  }
}

export const energyBreakdownChartGenerator = new EnergyBreakdownChartGenerator();
