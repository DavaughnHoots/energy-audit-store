import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import { Chart } from 'chart.js/auto';
import { EnergyAuditData, AuditRecommendation } from '../types/energyAudit';
import { dashboardService } from './dashboardService';

export class ReportGenerationService {
  private async generateSavingsChart(
    recommendations: AuditRecommendation[],
    width: number,
    height: number
  ): Promise<Buffer> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

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
  }

  private async generateEnergyBreakdownChart(
    auditData: EnergyAuditData,
    width: number,
    height: number
  ): Promise<Buffer> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Calculate energy usage breakdown
    const electricKwhPerYear = auditData.energyConsumption.electricBill * 12;
    const gasKwhPerYear = auditData.energyConsumption.gasBill * 29.3 * 12; // Convert therms to kWh
    const totalKwh = electricKwhPerYear + gasKwhPerYear;

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
              label: (context: any) => {
                const value = context.raw;
                return `${value.toFixed(1)}% of total energy use`;
              }
            }
          }
        }
      }
    });

    return canvas.toBuffer('image/png');
  }

  async generateReport(
    auditData: EnergyAuditData,
    recommendations: AuditRecommendation[]
  ): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];

    // Collect PDF chunks
    doc.on('data', buffer => buffers.push(buffer));

    // Header
    doc
      .fontSize(24)
      .text('Energy Audit Report', { align: 'center' })
      .moveDown();

    // Basic Information
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

    // Current Conditions Summary
    doc
      .fontSize(16)
      .text('Current Conditions')
      .moveDown(0.5)
      .fontSize(12)
      .text(`Insulation: ${auditData.currentConditions.insulation.attic} (Attic)`)
      .text(`Windows: ${auditData.currentConditions.windowType}`)
      .text(`HVAC System Age: ${auditData.heatingCooling.heatingSystem.age} years`)
      .moveDown();

    // Energy Usage
    doc
      .fontSize(16)
      .text('Energy Consumption')
      .moveDown(0.5)
      .fontSize(12)
      .text(`Average Monthly Electric: ${auditData.energyConsumption.electricBill} kWh`)
      .text(`Average Monthly Gas: ${auditData.energyConsumption.gasBill} therms`)
      .moveDown();

    // Energy Breakdown Chart
    const energyBreakdownChart = await this.generateEnergyBreakdownChart(auditData, 600, 300);
    doc
      .image(energyBreakdownChart, {
        fit: [500, 250],
        align: 'center'
      })
      .moveDown();

    // Recommendations
    doc
      .fontSize(16)
      .text('Recommendations')
      .moveDown();

    // Sort recommendations by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedRecommendations = [...recommendations].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

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

    // Savings Analysis
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

    // Summary
    const implementedRecs = recommendations.filter(r => r.status === 'completed');
    const totalEstimatedSavings = recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0);
    const totalActualSavings = implementedRecs.reduce((sum, r) => sum + (r.actualSavings || 0), 0);
    
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

    // Footer
    doc
      .fontSize(10)
      .text(
        `Report generated on ${new Date().toLocaleDateString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

    // End the document
    doc.end();

    // Return promise that resolves with the complete PDF buffer
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);
    });
  }
}

export const reportGenerationService = new ReportGenerationService();
