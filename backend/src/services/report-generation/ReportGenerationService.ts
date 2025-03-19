import PDFDocument from 'pdfkit';
import { EnergyAuditData, AuditRecommendation } from '../../types/energyAudit.js';
import { appLogger } from '../../utils/logger.js';
import { IFormatters, ICalculators, IChartGenerators } from './types/index.js';
import { 
  generateEfficiencyRadarChart,
  generateHvacPerformanceChart,
  generateLightingEfficiencyChart,
  generateHumidityLevelsChart 
} from '../../utils/chartHelpers.js';
import { productRecommendationService } from '../productRecommendationService.js';
import { calculateOverallEfficiencyScore } from '../efficiencyScoreService.js';

/**
 * Service for generating PDF reports for energy audits
 * This class orchestrates the various components to produce a complete PDF report
 */
export class ReportGenerationService {
  // Injected dependencies
  private formatters: IFormatters;
  private calculators: ICalculators;
  private chartGenerators: IChartGenerators;

  /**
   * Constructor with dependency injection
   * @param formatters Formatting services
   * @param calculators Calculation services
   * @param chartGenerators Chart generation services
   */
  constructor(
    formatters: IFormatters,
    calculators: ICalculators,
    chartGenerators: IChartGenerators
  ) {
    this.formatters = formatters;
    this.calculators = calculators;
    this.chartGenerators = chartGenerators;
  }

  /**
   * Calculates the efficiency score from audit data
   * @param auditData Energy audit data
   * @returns Efficiency score (0-100)
   */
  private calculateEfficiencyScore(auditData: EnergyAuditData): number {
    try {
      const scores = calculateOverallEfficiencyScore(auditData);
      return scores.overallScore;
    } catch (error) {
      appLogger.error('Error calculating efficiency score', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * Adds report metadata section to the PDF
   * @param doc PDFKit document
   * @param auditData Energy audit data
   */
  private addReportMetadata(
    doc: PDFKit.PDFDocument,
    auditData: EnergyAuditData
  ): void {
    try {
      appLogger.debug('Adding report metadata');
      
      const reportId = `EAT-${Date.now()}`;
      const reportDate = new Date().toLocaleString();
      
      const rows = [
        ['Report Date:', reportDate],
        ['Report ID:', reportId],
        ['Analysis Type:', 'comprehensive'],
        ['Version:', '1.0']
      ];
      
      this.formatters.tableFormatter.generateTable(doc, [], rows);
      doc.moveDown();
    } catch (error) {
      appLogger.error('Error adding report metadata', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue without metadata
      doc.moveDown();
    }
  }

  /**
   * Adds executive summary section to the PDF
   * @param doc PDFKit document
   * @param auditData Energy audit data
   * @param recommendations Audit recommendations
   */
  private addExecutiveSummary(
    doc: PDFKit.PDFDocument,
    auditData: EnergyAuditData,
    recommendations: AuditRecommendation[]
  ): void {
    try {
      appLogger.debug('Adding executive summary');
      
      this.formatters.headerFormatter.addSectionHeader(doc, 'Executive Summary', 'left', false, 0);
      
      const totalEnergy = this.calculators.energyCalculator.calculateTotalEnergy(auditData);
      const efficiencyScore = this.calculateEfficiencyScore(auditData);
      const potentialSavings = this.calculators.savingsCalculator.calculatePotentialSavings(recommendations);
      
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Energy Consumption', `${totalEnergy.toFixed(2)} kWh`],
        ['Overall Efficiency Score', efficiencyScore.toFixed(1)],
        ['Potential Annual Savings', `$${potentialSavings.toFixed(2)}`]
      ];
      
      this.formatters.tableFormatter.generateTable(doc, headers, rows);
      doc.moveDown();
    } catch (error) {
      appLogger.error('Error adding executive summary', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue without executive summary
      doc.moveDown();
    }
  }

  /**
   * Adds key findings section to the PDF
   * @param doc PDFKit document
   * @param auditData Energy audit data
   */
  private addKeyFindings(
    doc: PDFKit.PDFDocument,
    auditData: EnergyAuditData
  ): void {
    try {
      appLogger.debug('Adding key findings');
      
      this.formatters.headerFormatter.addSectionHeader(doc, 'Key Findings', 'left', false, 0);
      
      // Extract key findings from audit data
      const energyEfficiency = this.calculators.energyCalculator.calculateEnergyEfficiency(auditData);
      const hvacEfficiencyGap = this.calculators.hvacCalculator.calculateHvacEfficiencyGap(auditData);
      
      doc.fontSize(12)
         .text(`• Energy: Overall energy efficiency is ${energyEfficiency.toFixed(1)}%`)
         .text(`• HVAC: System efficiency gap is ${hvacEfficiencyGap.toFixed(1)}%`)
         .moveDown();
    } catch (error) {
      appLogger.error('Error adding key findings', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue without key findings
      doc.moveDown();
    }
  }

  /**
   * Generates a PDF report for an energy audit
   * @param auditData Energy audit data
   * @param recommendations Audit recommendations
   * @returns Buffer containing the PDF report
   */
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
      
      // Report Metadata
      try {
        this.addReportMetadata(doc, auditData);
      } catch (error) {
        appLogger.error('Error adding report metadata', { error });
        // Continue without metadata
      }
      
      // Executive Summary - left aligned
      try {
        this.addExecutiveSummary(doc, auditData, recommendations);
      } catch (error) {
        appLogger.error('Error adding executive summary', { error });
        // Continue without executive summary
      }
      
      // Key Findings
      try {
        this.addKeyFindings(doc, auditData);
      } catch (error) {
        appLogger.error('Error adding key findings', { error });
        // Continue without key findings
      }

      // Basic Information - start on new page
      try {
        appLogger.debug('Adding property information section');
        this.formatters.headerFormatter.addSectionHeader(doc, 'Property Information', 'left', false, 0);
        
        const rows = [
          ['Address:', auditData.basicInfo.address],
          ['Property Type:', auditData.basicInfo.propertyType],
          ['Year Built:', auditData.basicInfo.yearBuilt],
          ['Square Footage:', `${auditData.homeDetails.squareFootage} sq ft`]
        ];
        
        this.formatters.tableFormatter.generateTable(doc, [], rows);
        doc.moveDown();
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

      // Energy Breakdown Chart
      try {
        appLogger.debug('Generating and adding energy breakdown chart');
        const energyBreakdownChart = await this.chartGenerators.energyBreakdownChartGenerator.generate(auditData, 600, 300);
        
        // Save current Y position
        const currentY = doc.y;
        
        // Center the chart on the page
        const pageWidth = doc.page.width;
        const chartWidth = 500;
        const leftMargin = (pageWidth - chartWidth) / 2;
        
        doc
          .image(energyBreakdownChart, leftMargin, currentY, {
            fit: [chartWidth, 250],
            align: 'center'
          })
          .moveDown(2);
        appLogger.debug('Energy breakdown chart added successfully');
      } catch (error) {
        appLogger.error('Error adding energy breakdown chart', { error });
        // Continue with the report without the chart
        doc
          .fontSize(12)
          .text('Energy breakdown chart could not be generated')
          .moveDown();
      }
      
      // Recommendations - start on new page with left-aligned title and description
      try {
        appLogger.debug('Adding recommendations section');
        this.formatters.headerFormatter.addSectionHeader(doc, 'Recommendations', 'left', true);

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
          // Use color for the recommendation title based on priority
          doc
            .fontSize(14)
            .fillColor(
              rec.priority === 'high' ? '#dc2626' :
              rec.priority === 'medium' ? '#d97706' : '#059669'
            )
            .text(rec.title, { 
              align: 'left',
              indent: 0,
              continued: false
            })
            .fillColor('black')
            .moveDown(0.3);
          
          // Add description - left aligned
          doc.fontSize(12)
          .text(rec.description, { 
            align: 'left',
            continued: false
          })
          .moveDown(1);

          // Create a table for the recommendation details
          const recRows = [
            ['Estimated Savings:', `$${rec.estimatedSavings}/year`],
            ['Implementation Cost:', `$${rec.estimatedCost}`],
            ['Payback Period:', `${rec.paybackPeriod} years`]
          ];
          
          // Add actual savings if available
          if (rec.actualSavings !== null) {
            recRows.push(['Actual Savings:', `$${rec.actualSavings}/year`]);
            recRows.push(['Savings Accuracy:', `${((rec.actualSavings / rec.estimatedSavings) * 100).toFixed(1)}%`]);
          }
          
          this.formatters.tableFormatter.generateTable(doc, [], recRows);
          doc.moveDown(1.5);
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
        const savingsChart = await this.chartGenerators.savingsChartGenerator.generate(recommendations, 600, 300);
        doc
          .addPage()
          .fontSize(16)
          .text('Savings Analysis', { align: 'center' })
          .moveDown();
        
        // Save current Y position
        const currentY = doc.y;
        
        // Center the chart on the page
        const pageWidth = doc.page.width;
        const chartWidth = 500;
        const leftMargin = (pageWidth - chartWidth) / 2;
        
        doc
          .image(savingsChart, leftMargin, currentY, {
            fit: [chartWidth, 250],
            align: 'center'
          })
          .moveDown(2);
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
          .text('Savings analysis chart could not be generated', {
            align: 'center'
          })
          .moveDown();
      }

      // Energy Consumption Chart
      try {
        appLogger.debug('Generating and adding energy consumption breakdown chart');
        const energyConsumptionChart = await this.chartGenerators.consumptionChartGenerator.generate(auditData, 600, 300);
        doc
          .addPage()
          .fontSize(16)
          .text('Energy Consumption Analysis', { align: 'center' })
          .moveDown();
        
        // Save current Y position
        const currentY = doc.y;
        
        // Center the chart on the page
        const pageWidth = doc.page.width;
        const chartWidth = 500;
        const leftMargin = (pageWidth - chartWidth) / 2;
        
        doc
          .image(energyConsumptionChart, leftMargin, currentY, {
            fit: [chartWidth, 250],
            align: 'center'
          })
          .moveDown(2)
          .fontSize(12)
          .text('This chart shows how energy consumption is affected by seasonal factors, occupancy patterns, and power efficiency.', {
            align: 'center'
          })
          .moveDown();
        appLogger.debug('Energy consumption breakdown chart added successfully');
      } catch (error) {
        appLogger.error('Error adding energy consumption breakdown chart', { error });
        // Continue with the report without the chart
        doc
          .addPage()
          .fontSize(16)
          .text('Energy Consumption Analysis', { align: 'center' })
          .moveDown()
          .fontSize(12)
          .text('Energy consumption breakdown chart could not be generated', {
            align: 'center'
          })
          .moveDown();
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
