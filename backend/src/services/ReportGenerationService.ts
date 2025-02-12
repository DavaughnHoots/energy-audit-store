import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import { Chart } from 'chart.js/auto';
import { EnergyAuditData, AuditRecommendation } from '../types/energyAudit';

export class ReportGenerationService {
  private async generateSavingsChart(
    recommendations: AuditRecommendation[],
    width: number,
    height: number
  ): Promise<Buffer> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const data = {
      labels: recommendations.map(rec => rec.title.substring(0, 20) + '...'),
      datasets: [{
        label: 'Estimated Savings ($)',
        data: recommendations.map(rec => rec.estimatedSavings),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }]
    };

    new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Estimated Annual Savings ($)'
            }
          }
        }
      }
    });

    return canvas.toBuffer('image/png');
  }

  private async generatePaybackChart(
    recommendations: AuditRecommendation[],
    width: number,
    height: number
  ): Promise<Buffer> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const data = {
      labels: recommendations.map(rec => rec.title.substring(0, 20) + '...'),
      datasets: [{
        label: 'Payback Period (Years)',
        data: recommendations.map(rec => rec.paybackPeriod),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    };

    new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Years to Payback'
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
    }

    // Generate and add charts
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

    const paybackChart = await this.generatePaybackChart(recommendations, 600, 300);
    doc
      .moveDown()
      .fontSize(16)
      .text('Payback Analysis', { align: 'center' })
      .moveDown()
      .image(paybackChart, {
        fit: [500, 250],
        align: 'center'
      });

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
