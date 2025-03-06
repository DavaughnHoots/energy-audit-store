import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import { Chart, TooltipItem } from 'chart.js/auto';
import { EnergyAuditData, AuditRecommendation } from '../types/energyAudit.js';
import { dashboardService } from './dashboardService.js';
import { appLogger } from '../utils/logger.js';

export class ReportGenerationService {
  private async generateSavingsChart(
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

  private async generateEnergyBreakdownChart(
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

  async generateReport(
    auditData: EnergyAuditData,
    recommendations: AuditRecommendation[]
  ): Promise<Buffer> {
    appLogger.info('Starting PDF report generation', { 
      recommendationsCount: recommendations.length 
    });

    try {
      // Validate input data
      if (!auditData || !auditData.basicInfo) {
        appLogger.error('Invalid audit data for report generation', { 
          auditData: auditData ? Object.keys(auditData) : 'null' 
        });
        throw new Error('Invalid audit data structure');
      }

      if (!recommendations || !Array.isArray(recommendations)) {
        appLogger.error('Invalid recommendations data for report generation', { 
          recommendations: recommendations ? typeof recommendations : 'null' 
        });
        throw new Error('Invalid recommendations data structure');
      }

      appLogger.debug('Creating PDF document');
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      // Collect PDF chunks
      doc.on('data', buffer => buffers.push(buffer));

      // Header
      try {
        appLogger.debug('Adding report header');
        doc
          .fontSize(24)
          .text('Energy Audit Report', { align: 'center' })
          .moveDown();
      } catch (error) {
        appLogger.error('Error adding report header', { error });
        throw error;
      }

      // Basic Information
      try {
        appLogger.debug('Adding property information section');
        doc
          .fontSize(16)
          .text('Property Information')
          .moveDown(0.5)
          .fontSize(12)
          .text(`Address: ${auditData.basicInfo.address}`)
          .text(`Property Type: ${auditData.basicInfo.propertyType}`)
          .text(`Year Built: ${auditData.basicInfo.yearBuilt}`)
          .text(`Square Footage: ${auditData.homeDetails.squareFootage} sq ft`)
          .moveDown();
      } catch (error) {
        appLogger.error('Error adding property information section', { 
          error,
          basicInfo: {
            hasAddress: !!auditData.basicInfo.address,
            hasPropertyType: !!auditData.basicInfo.propertyType,
            hasYearBuilt: !!auditData.basicInfo.yearBuilt
          },
          homeDetails: {
            hasSquareFootage: !!auditData.homeDetails.squareFootage
          }
        });
        throw error;
      }

      // Current Conditions Summary
      try {
        appLogger.debug('Adding current conditions section');
        doc
          .fontSize(16)
          .text('Current Conditions')
          .moveDown(0.5)
          .fontSize(12)
          .text(`Insulation: ${auditData.currentConditions.insulation.attic} (Attic)`)
          .text(`Windows: ${auditData.currentConditions.windowType}`)
          .text(`HVAC System Age: ${auditData.heatingCooling.heatingSystem.age} years`)
          .moveDown();
      } catch (error) {
        appLogger.error('Error adding current conditions section', { 
          error,
          currentConditions: {
            hasInsulation: !!auditData.currentConditions.insulation,
            hasWindowType: !!auditData.currentConditions.windowType
          },
          heatingCooling: {
            hasHeatingSystem: !!auditData.heatingCooling.heatingSystem,
            hasAge: !!auditData.heatingCooling.heatingSystem?.age
          }
        });
        throw error;
      }

      // Energy Usage
      try {
        appLogger.debug('Adding energy consumption section');
        doc
          .fontSize(16)
          .text('Energy Consumption')
          .moveDown(0.5)
          .fontSize(12)
          .text(`Average Monthly Electric: ${auditData.energyConsumption.electricBill} kWh`)
          .text(`Average Monthly Gas: ${auditData.energyConsumption.gasBill} therms`);
        
        // Add new fields if they exist
        if (auditData.energyConsumption.durationHours !== undefined) {
          doc.text(`Daily Usage Hours: ${auditData.energyConsumption.durationHours} hours`);
        }
        
        if (auditData.energyConsumption.powerFactor !== undefined) {
          doc.text(`Power Factor: ${auditData.energyConsumption.powerFactor.toFixed(2)}`);
        }
        
        doc.moveDown();
      } catch (error) {
        appLogger.error('Error adding energy consumption section', { 
          error,
          energyConsumption: {
            hasElectricBill: !!auditData.energyConsumption.electricBill,
            hasGasBill: !!auditData.energyConsumption.gasBill,
            hasDurationHours: auditData.energyConsumption.durationHours !== undefined,
            hasPowerFactor: auditData.energyConsumption.powerFactor !== undefined
          }
        });
        throw error;
      }

      // Energy Breakdown Chart
      try {
        appLogger.debug('Generating and adding energy breakdown chart');
        const energyBreakdownChart = await this.generateEnergyBreakdownChart(auditData, 600, 300);
        doc
          .image(energyBreakdownChart, {
            fit: [500, 250],
            align: 'center'
          })
          .moveDown();
        appLogger.debug('Energy breakdown chart added successfully');
      } catch (error) {
        appLogger.error('Error adding energy breakdown chart', { error });
        // Continue with the report without the chart
        doc
          .fontSize(12)
          .text('Energy breakdown chart could not be generated')
          .moveDown();
      }

      // Recommendations
      try {
        appLogger.debug('Adding recommendations section');
        doc
          .fontSize(16)
          .text('Recommendations')
          .moveDown();

        // Sort recommendations by priority
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const sortedRecommendations = [...recommendations].sort(
          (a, b) => (priorityOrder[a.priority] ?? 0) - (priorityOrder[b.priority] ?? 0)
        );

        appLogger.debug('Processing recommendations', { 
          recommendationCount: sortedRecommendations.length,
          priorities: sortedRecommendations.map(r => r.priority)
        });

        for (const rec of sortedRecommendations) {
          doc
            .fontSize(14)
            .fillColor(
              rec.priority === 'high' ? '#dc2626' :
              rec.priority === 'medium' ? '#d97706' : '#059669'
            )
            .text(rec.title)
            .fillColor('black')
            .fontSize(12)
            .text(rec.description)
            .text(`Estimated Savings: $${rec.estimatedSavings}/year`)
            .text(`Implementation Cost: $${rec.estimatedCost}`)
            .text(`Payback Period: ${rec.paybackPeriod} years`)
            .moveDown();

          if (rec.actualSavings !== null) {
            doc
              .text(`Actual Savings: $${rec.actualSavings}/year`)
              .text(`Savings Accuracy: ${((rec.actualSavings / rec.estimatedSavings) * 100).toFixed(1)}%`)
              .moveDown();
          }
        }
        appLogger.debug('Recommendations section added successfully');
      } catch (error) {
        appLogger.error('Error adding recommendations section', { 
          error,
          recommendationsCount: recommendations.length
        });
        throw error;
      }

      // Savings Analysis
      try {
        appLogger.debug('Generating and adding savings analysis chart');
        const savingsChart = await this.generateSavingsChart(recommendations, 600, 300);
        doc
          .addPage()
          .fontSize(16)
          .text('Savings Analysis', { align: 'center' })
          .moveDown()
          .image(savingsChart, {
            fit: [500, 250],
            align: 'center'
          })
          .moveDown();
        appLogger.debug('Savings analysis chart added successfully');
      } catch (error) {
        appLogger.error('Error adding savings analysis chart', { error });
        // Continue with the report without the chart
        doc
          .addPage()
          .fontSize(16)
          .text('Savings Analysis', { align: 'center' })
          .moveDown()
          .fontSize(12)
          .text('Savings analysis chart could not be generated')
          .moveDown();
      }

      // Summary
      try {
        appLogger.debug('Adding summary section');
        const implementedRecs = recommendations.filter(r => r.status === 'implemented');
        const totalEstimatedSavings = recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0);
        const totalActualSavings = implementedRecs.reduce((sum, r) => sum + (r.actualSavings || 0), 0);
        
        appLogger.debug('Summary calculations', {
          implementedRecsCount: implementedRecs.length,
          totalEstimatedSavings,
          totalActualSavings
        });
        
        doc
          .fontSize(16)
          .text('Summary')
          .moveDown()
          .fontSize(12)
          .text(`Total Estimated Annual Savings: $${totalEstimatedSavings}`)
          .text(`Total Actual Annual Savings: $${totalActualSavings}`)
          .text(`Number of Implemented Recommendations: ${implementedRecs.length}`)
          .text(`Overall Savings Accuracy: ${
            implementedRecs.length > 0
              ? ((totalActualSavings / totalEstimatedSavings) * 100).toFixed(1)
              : 'N/A'
          }%`)
          .moveDown();
        appLogger.debug('Summary section added successfully');
      } catch (error) {
        appLogger.error('Error adding summary section', { error });
        throw error;
      }

      // Footer
      try {
        appLogger.debug('Adding footer');
        doc
          .fontSize(10)
          .text(
            `Report generated on ${new Date().toLocaleDateString()}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
      } catch (error) {
        appLogger.error('Error adding footer', { error });
        // Continue without footer
      }

      // End the document
      appLogger.debug('Finalizing PDF document');
      doc.end();

      // Return promise that resolves with the complete PDF buffer
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          appLogger.info('PDF generation completed successfully');
          resolve(Buffer.concat(buffers));
        });
        doc.on('error', (error) => {
          appLogger.error('Error in PDF document finalization', { error });
          reject(error);
        });
      });
    } catch (error) {
      appLogger.error('Error in PDF generation process', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

export const reportGenerationService = new ReportGenerationService();
