import PDFDocument from 'pdfkit';
import { EnergyAuditData, AuditRecommendation } from '../../types/energyAudit.js';
import { ReportData } from '../../types/report.js';
import { appLogger } from '../../utils/logger.js';
import { IFormatters, ICalculators, IChartGenerators } from './types/index.js';
import { 
  generateEfficiencyRadarChart,
  generateHvacPerformanceChart,
  generateLightingEfficiencyChart,
  generateHumidityLevelsChart 
} from '../../utils/chartHelpers.js';
import { ProductRecommendationService } from '../productRecommendationService.js';
import { calculateOverallEfficiencyScore } from '../efficiencyScoreService.js';
import { ReportValidationHelper } from '../../utils/reportValidationHelper.js';

/**
 * Service for generating PDF reports for energy audits
 * This class orchestrates the various components to produce a complete PDF report
 */
export class ReportGenerationService {
  // Injected dependencies
  private formatters: IFormatters;
  private calculators: ICalculators;
  private chartGenerators: IChartGenerators;
  private productRecommendationService: ProductRecommendationService;

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
    this.productRecommendationService = new ProductRecommendationService();
  }

  /**
   * Extract estimated savings from recommendation title and description
   * @param title Recommendation title
   * @param description Recommendation description
   * @returns Estimated annual savings
   */
  private extractSavingsFromTitle(title: string, description: string): number {
    try {
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
      
      return 200; // Default value
    } catch (error) {
      appLogger.error('Error extracting savings from title', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 200;
    }
  }
  
  /**
   * Extract estimated cost from recommendation title and description
   * @param title Recommendation title
   * @param description Recommendation description
   * @returns Estimated implementation cost
   */
  private extractCostFromTitle(title: string, description: string): number {
    try {
      const titleLower = (title || '').toLowerCase();
      const descLower = (description || '').toLowerCase();
      
      // Default costs by category
      if (titleLower.includes('insulation') || descLower.includes('insulation')) {
        return 1200;
      } else if (titleLower.includes('hvac') || descLower.includes('hvac')) {
        return 3500;
      } else if (titleLower.includes('light') || descLower.includes('light') ||
                titleLower.includes('bulb') || descLower.includes('bulb')) {
        return 120;
      } else if (titleLower.includes('window') || descLower.includes('window')) {
        return 3000;
      } else if (titleLower.includes('air seal') || descLower.includes('air seal')) {
        return 350;
      } else if (titleLower.includes('thermostat') || descLower.includes('thermostat')) {
        return 250;
      }
      
      return 500; // Default value
    } catch (error) {
      appLogger.error('Error extracting cost from title', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 500;
    }
  }
  
  /**
   * Get default payback period based on recommendation type
   * @param title Recommendation title
   * @param description Recommendation description
   * @returns Default payback period in years
   */
  private getDefaultPaybackPeriod(title: string, description: string): number {
    try {
      const titleLower = (title || '').toLowerCase();
      const descLower = (description || '').toLowerCase();
      
      // Default payback by category (approximate years)
      if (titleLower.includes('insulation') || descLower.includes('insulation')) {
        return 3.5;
      } else if (titleLower.includes('hvac') || descLower.includes('hvac')) {
        return 8.0;
      } else if (titleLower.includes('light') || descLower.includes('light') ||
                titleLower.includes('bulb') || descLower.includes('bulb')) {
        return 0.6;
      } else if (titleLower.includes('window') || descLower.includes('window')) {
        return 10.0;
      } else if (titleLower.includes('air seal') || descLower.includes('air seal')) {
        return 2.0;
      } else if (titleLower.includes('thermostat') || descLower.includes('thermostat')) {
        return 2.1;
      }
      
      return 2.5; // Default value
    } catch (error) {
      appLogger.error('Error getting default payback period', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 2.5;
    }
  }

  /**
   * Calculates the efficiency score from audit data
   * @param auditData Energy audit data
   * @returns Efficiency score (40-100)
   */
  private calculateEfficiencyScore(auditData: EnergyAuditData): number {
    try {
      // Calculate efficiency using multiple factors
      const scores = calculateOverallEfficiencyScore(auditData);
      
      // Ensure score is within realistic range (40-100)
      const sanitizedScore = Math.min(100, Math.max(40, scores.overallScore));
      
      appLogger.debug('Efficiency score calculation', {
        rawScore: scores.overallScore,
        sanitizedScore
      });
      
      return sanitizedScore;
    } catch (error) {
      appLogger.error('Error calculating efficiency score', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Return reasonable default on error rather than 0
      return 70;
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
      const energyEfficiency = this.calculators.energyCalculator.calculateEnergyEfficiency(auditData);
      const potentialSavings = this.calculators.savingsCalculator.calculatePotentialSavings(recommendations);
      
      // Determine efficiency rating text
      let efficiencyRating = 'Average';
      if (efficiencyScore >= 80) efficiencyRating = 'Excellent';
      else if (efficiencyScore >= 70) efficiencyRating = 'Good';
      else if (efficiencyScore < 60) efficiencyRating = 'Poor';
      
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Energy Consumption', this.formatters.valueFormatter.formatValue(totalEnergy, 'number', 'energy') + ' kWh'],
        ['Overall Efficiency Score', this.formatters.valueFormatter.formatValue(efficiencyScore, 'number', 'score') + ` (${efficiencyRating})`],
        ['Energy Efficiency', this.formatters.valueFormatter.formatValue(energyEfficiency, 'percentage', 'efficiency')],
        ['Potential Annual Savings', this.formatters.valueFormatter.formatValue(potentialSavings, 'currency', 'savings') + '/year']
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
      
      // Get HVAC efficiency gap and ensure it's always a non-negative value
      let hvacEfficiencyGap = this.calculators.hvacCalculator.calculateHvacEfficiencyGap(auditData);
      
      // Provide context for the HVAC efficiency gap
      let hvacEfficiencyContext = '';
      if (hvacEfficiencyGap <= 0) {
        hvacEfficiencyGap = 0;
        hvacEfficiencyContext = ' (system meets or exceeds targets)';
      } else if (hvacEfficiencyGap < 5) {
        hvacEfficiencyContext = ' (minor improvements needed)';
      } else if (hvacEfficiencyGap < 15) {
        hvacEfficiencyContext = ' (moderate improvements needed)';
      } else {
        hvacEfficiencyContext = ' (significant improvements needed)';
      }
      
      appLogger.debug('HVAC efficiency gap calculated', {
        rawGap: this.calculators.hvacCalculator.calculateHvacEfficiencyGap(auditData),
        displayGap: hvacEfficiencyGap,
        context: hvacEfficiencyContext
      });
      
      doc.fontSize(12)
         .text(`• Energy: Overall energy efficiency is ${energyEfficiency.toFixed(1)}%`)
         .text(`• HVAC: System efficiency gap is ${hvacEfficiencyGap.toFixed(1)}%${hvacEfficiencyContext}`)
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
   * Prepares report data for frontend rendering without generating PDF
   */
  async prepareReportData(
    auditData: EnergyAuditData,
    recommendations: AuditRecommendation[]
  ): Promise<ReportData> {
    // Validate and normalize recommendations
    const validatedRecommendations = ReportValidationHelper.validateRecommendations(recommendations);
    
    // Calculate key metrics (reuse existing calculations)
    const totalEnergy = this.calculators.energyCalculator.calculateTotalEnergy(auditData);
    const efficiencyScore = this.calculateEfficiencyScore(auditData);
    const energyEfficiency = this.calculators.energyCalculator.calculateEnergyEfficiency(auditData);
    const potentialSavings = this.calculators.savingsCalculator.calculatePotentialSavings(validatedRecommendations);
    
    // Calculate summary metrics with our new SummaryCalculator
    const totalEstimatedSavings = this.calculators.summaryCalculator.calculateTotalEstimatedSavings(validatedRecommendations);
    const totalActualSavings = this.calculators.summaryCalculator.calculateTotalActualSavings(validatedRecommendations);
    const implementedCount = this.calculators.summaryCalculator.countImplementedRecommendations(validatedRecommendations);
    const savingsAccuracy = this.calculators.summaryCalculator.calculateSavingsAccuracy(totalEstimatedSavings, totalActualSavings);
    
    // Get chart data without generating images
    const energyBreakdownData = this.prepareEnergyBreakdownData(auditData);
    const savingsAnalysisData = this.prepareSavingsAnalysisData(validatedRecommendations);
    const consumptionData = this.prepareConsumptionData(auditData);
    
    // Return structured data for frontend rendering
    return {
      metadata: {
        reportId: `EAT-${Date.now()}`,
        reportDate: new Date().toISOString(),
        analysisType: 'comprehensive',
        version: '1.0'
      },
      executiveSummary: {
        totalEnergy,
        efficiencyScore,
        energyEfficiency,
        potentialSavings
      },
      propertyInfo: {
        address: auditData.basicInfo.address,
        propertyType: auditData.basicInfo.propertyType,
        yearBuilt: auditData.basicInfo.yearBuilt,
        squareFootage: auditData.homeDetails.squareFootage
      },
      currentConditions: {
        insulation: auditData.currentConditions?.insulation || 'Not assessed',
        windows: auditData.currentConditions?.windows || 'Not assessed',
        hvacSystemAge: auditData.currentConditions?.hvacSystemAge || 0
      },
      energyConsumption: {
        electricityUsage: auditData.energyConsumption?.electricityUsage || 0,
        gasUsage: auditData.energyConsumption?.gasUsage || 0,
        usageHours: auditData.energyConsumption?.usageHours || 0,
        powerFactor: auditData.energyConsumption?.powerFactor || 0,
        seasonalFactor: auditData.energyConsumption?.seasonalFactor || 0,
        occupancyFactor: auditData.energyConsumption?.occupancyFactor || 0
      },
      lighting: {
        bulbTypes: {
          led: auditData.lighting?.bulbTypes?.led || 0,
          cfl: auditData.lighting?.bulbTypes?.cfl || 0,
          incandescent: auditData.lighting?.bulbTypes?.incandescent || 0
        },
        naturalLight: auditData.lighting?.naturalLight || 'Not assessed',
        controls: auditData.lighting?.controls || 'Not assessed'
      },
      recommendations: validatedRecommendations,
      charts: {
        energyBreakdown: energyBreakdownData,
        savingsAnalysis: savingsAnalysisData,
        consumption: consumptionData
      },
      summary: {
        totalEstimatedSavings,
        totalActualSavings,
        implementedCount,
        savingsAccuracy
      }
    };
  }

  /**
   * Prepare energy breakdown chart data
   */
  private prepareEnergyBreakdownData(auditData: EnergyAuditData): any[] {
    // Extract data for energy breakdown chart
    const electricityUsage = auditData.energyConsumption?.electricityUsage || 0;
    const gasUsage = auditData.energyConsumption?.gasUsage || 0;
    
    return [
      { name: 'Electricity', value: electricityUsage },
      { name: 'Natural Gas', value: gasUsage }
    ];
  }

  /**
   * Prepare savings analysis chart data
   */
  private prepareSavingsAnalysisData(recommendations: AuditRecommendation[]): any[] {
    // Map recommendations to chart format
    return recommendations.map(rec => ({
      name: rec.type.split(' ').slice(0, 2).join(' '), // Shorten name for display
      estimatedSavings: rec.estimatedSavings || 0,
      actualSavings: rec.actualSavings || 0
    }));
  }

  /**
   * Prepare consumption chart data
   */
  private prepareConsumptionData(auditData: EnergyAuditData): any[] {
    // Get factors
    const baseFactor = 1;
    const seasonalFactor = auditData.energyConsumption?.seasonalFactor || 0.9;
    const occupancyFactor = auditData.energyConsumption?.occupancyFactor || 0.8;
    const efficiencyFactor = auditData.energyConsumption?.powerFactor || 0.7;
    
    // Base consumption (estimated)
    const baseConsumption = this.calculators.energyCalculator.getBaselineConsumption(
      auditData.basicInfo.propertyType,
      auditData.homeDetails.squareFootage
    );
    
    return [
      { name: 'Base', value: baseConsumption },
      { name: 'Seasonal', value: baseConsumption * seasonalFactor },
      { name: 'Occupied', value: baseConsumption * seasonalFactor * occupancyFactor },
      { name: 'Real', value: baseConsumption * seasonalFactor * occupancyFactor * efficiencyFactor }
    ];
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

      // Validate and normalize recommendations to ensure they have valid values
      const validatedRecommendations = ReportValidationHelper.validateRecommendations(recommendations);
      appLogger.debug('Validated recommendations for report', {
        originalCount: recommendations?.length || 0,
        validatedCount: validatedRecommendations.length
      });

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
        const sortedRecommendations = [...validatedRecommendations].sort(
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

          // Apply validation and intelligent defaults to recommendation data
          const validatedRec = ReportValidationHelper.validateSingleRecommendation(rec);
          
          // Create a table for the recommendation details with proper formatting
          const recRows = [
            ['Estimated Savings:', this.formatters.valueFormatter.formatValue(validatedRec.estimatedSavings, 'currency', 'savings') + '/year'],
            ['Implementation Cost:', this.formatters.valueFormatter.formatValue(validatedRec.estimatedCost, 'currency', 'cost')],
            ['Payback Period:', this.formatters.valueFormatter.formatValue(validatedRec.paybackPeriod, 'number', 'payback') + ' years']
          ];
              
          // Add actual savings if available
          if (rec.actualSavings !== null && rec.actualSavings !== undefined) {
            recRows.push(['Actual Savings:', this.formatters.valueFormatter.formatValue(rec.actualSavings, 'currency', 'savings') + '/year']);
            
            // Only calculate accuracy if both values are valid numbers
            if (typeof rec.actualSavings === 'number' && 
                typeof rec.estimatedSavings === 'number' && 
                rec.estimatedSavings !== 0) {
              const accuracy = (rec.actualSavings / rec.estimatedSavings) * 100;
              recRows.push(['Savings Accuracy:', this.formatters.valueFormatter.formatValue(accuracy, 'percentage', 'accuracy')]);
            }
          }
          
          this.formatters.tableFormatter.generateTable(doc, [], recRows);
          doc.moveDown(1);
          
          // Add product recommendations if available
          try {
            // Check if recommendation has products attached
            if (!rec.products || rec.products.length === 0) {
              // If not, try to fetch recommended products by category
              if (!rec.type) {
                appLogger.debug('Skipping product recommendations - no type defined for recommendation');
              } else {
                // Use recommendation type to fetch products
                const enrichedRec = await this.productRecommendationService.enrichRecommendationWithProducts(rec);
                if (enrichedRec.products && enrichedRec.products.length > 0) {
                  // Use the enriched recommendation with products
                  this.formatters.recommendationFormatter.addProductRecommendations(doc, enrichedRec);
                }
              }
            } else {
              // Recommendation already has products, render them
              this.formatters.recommendationFormatter.addProductRecommendations(doc, rec);
            }
          } catch (error) {
            appLogger.error('Error adding product recommendations', { error });
            // Continue with the next recommendation without products
          }
          
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
        const savingsChart = await this.chartGenerators.savingsChartGenerator.generate(validatedRecommendations, 600, 300);
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

      // Summary Section
      try {
        appLogger.debug('Adding recommendation summary section');
        doc
          .addPage()
          .fontSize(16)
          .text('Summary', { align: 'left' })
          .moveDown();

        // Calculate summary metrics using the SummaryCalculator
        const totalEstimatedSavings = this.calculators.summaryCalculator.calculateTotalEstimatedSavings(validatedRecommendations);
        const totalActualSavings = this.calculators.summaryCalculator.calculateTotalActualSavings(validatedRecommendations);
        const implementedCount = this.calculators.summaryCalculator.countImplementedRecommendations(validatedRecommendations);
        const savingsAccuracy = this.calculators.summaryCalculator.calculateSavingsAccuracy(totalEstimatedSavings, totalActualSavings);

        // Create summary table rows
        const summaryRows = [
          ['Total Estimated Annual Savings:', this.formatters.valueFormatter.formatValue(totalEstimatedSavings, 'currency', 'savings') + '/year'],
          ['Total Actual Annual Savings:', this.formatters.valueFormatter.formatValue(totalActualSavings, 'currency', 'savings') + '/year'],
          ['Number of Implemented Recommendations:', String(implementedCount)]
        ];

        // Add accuracy if available
        if (savingsAccuracy !== null) {
          summaryRows.push(['Recommendation Accuracy:', this.formatters.valueFormatter.formatValue(savingsAccuracy, 'percentage', 'accuracy')]);
        } else {
          summaryRows.push(['Recommendation Accuracy:', 'N/A']);
        }

        // Generate the summary table
        this.formatters.tableFormatter.generateTable(doc, [], summaryRows);
        doc.moveDown(2);
        
        appLogger.debug('Summary section added successfully');
      } catch (error) {
        appLogger.error('Error adding summary section', { error });
        // Continue without the summary section
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
