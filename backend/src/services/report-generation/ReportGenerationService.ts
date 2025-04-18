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
import { productRecommendationService } from '../productRecommendationService.js';
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
   * Generate financial data for a recommendation
   * Uses the enhanced SavingsCalculator to provide more accurate financial estimates
   * @param title Recommendation title
   * @param description Recommendation description
   * @param scope Optional scope of the recommendation
   * @param auditData Optional audit data for context-aware calculations
   * @returns Object with financial estimates
   */
  private generateFinancialEstimates(
    title: string, 
    description: string, 
    scope: string = '',
    auditData?: EnergyAuditData
  ): { 
    estimatedSavings: number; 
    estimatedCost: number; 
    paybackPeriod: number; 
  } {
    try {
      // Set audit data for better context-aware calculations if available
      if (auditData) {
        this.calculators.savingsCalculator.setAuditData(auditData);
      }
      
      // Use SavingsCalculator to generate financial data
      const squareFootage = auditData?.homeDetails?.squareFootage || 1500; // Default if unknown
      
      // Get financial estimates
      const estimatedSavings = this.calculators.savingsCalculator.estimateSavingsByType?.(title, scope, squareFootage) || 200;
      const estimatedCost = this.calculators.savingsCalculator.generateImplementationCostEstimate?.(title, scope, squareFootage) || 1000;
      const paybackPeriod = this.calculators.savingsCalculator.calculatePaybackPeriod?.(estimatedCost, estimatedSavings) || 5;
      
      appLogger.debug('Generated financial estimates for recommendation', {
        title,
        scope,
        squareFootage,
        estimatedSavings,
        estimatedCost,
        paybackPeriod
      });
      
      return {
        estimatedSavings,
        estimatedCost,
        paybackPeriod
      };
    } catch (error) {
      appLogger.error('Error generating financial estimates', {
        error: error instanceof Error ? error.message : String(error),
        title
      });
      
      // Return default values
      return {
        estimatedSavings: 200,
        estimatedCost: 1000,
        paybackPeriod: 5
      };
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
   * Enhanced to ensure values are properly prepared for chart display
   */
  private prepareSavingsAnalysisData(recommendations: AuditRecommendation[]): any[] {
    // Deep debug logging to trace financial data
    const estimatedSavings = recommendations.map(r => r.estimatedSavings);
    const actualSavings = recommendations.map(r => r.actualSavings);
    const titles = recommendations.map(r => r.title);
    
    appLogger.debug('Detailed recommendation financial data for chart preparation', {
      recommendations: recommendations.map(r => ({
        id: r.id?.substring(0, 8),
        title: r.title,
        estimatedSavings: r.estimatedSavings,
        actualSavings: r.actualSavings,
        type: r.type
      }))
    });
    
    appLogger.debug('Preparing savings analysis data from recommendations', {
      recommendationsCount: recommendations.length,
      hasEstimatedSavings: recommendations.some(r => r.estimatedSavings && r.estimatedSavings > 0),
      totalEstimatedSavings: recommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0),
      estimatedSavingsValues: estimatedSavings,
      actualSavingsValues: actualSavings,
      titles: titles
    });
    
    // Ensure numeric conversion for any string financial values 
    const processedRecommendations = recommendations.map(rec => ({
      ...rec,
      estimatedSavings: typeof rec.estimatedSavings === 'string' 
        ? parseFloat(rec.estimatedSavings) 
        : (rec.estimatedSavings || 0),
      actualSavings: typeof rec.actualSavings === 'string' 
        ? parseFloat(rec.actualSavings) 
        : (rec.actualSavings || 0),
    }));
    
    // Filter out recommendations with missing or zero financial data
    const validRecommendations = processedRecommendations.filter(rec => 
      rec.estimatedSavings !== undefined && 
      rec.estimatedSavings !== null && 
      rec.estimatedSavings > 0);
    
    // If we have no valid recommendations, generate some basic placeholder data
    // to avoid empty chart display
    if (validRecommendations.length === 0) {
      appLogger.warn('No valid recommendations with financial data for savings chart', {
        originalRecommendationsCount: recommendations.length,
        estimatedSavingsValues: estimatedSavings,
        typesAvailable: [...new Set(recommendations.map(r => r.type))]
      });
      
      // Return placeholder data based on recommendation types
      const recommendationTypes = [...new Set(recommendations.map(r => r.type))];
      return recommendationTypes.map(type => ({
        name: type,
        estimatedSavings: 100, // Placeholder value
        actualSavings: 0
      }));
    }
    
    appLogger.debug('After validation, using these recommendations for chart data', {
      validCount: validRecommendations.length,
      validRecommendations: validRecommendations.map(r => ({
        title: r.title,
        estimatedSavings: r.estimatedSavings,
        actualSavings: r.actualSavings
      }))
    });
    
    // Map recommendations to chart format with improved name handling
    const chartData = validRecommendations.map(rec => {
      // Create more readable chart labels from recommendation titles
      let displayName = rec.title || rec.type;
      
      // Shorten very long names for chart display
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 18) + '...';
      }
      
      return {
        name: displayName,
        estimatedSavings: rec.estimatedSavings,
        actualSavings: rec.actualSavings || 0
      };
    });
    
    appLogger.debug('Final chart data generated', {
      chartDataCount: chartData.length,
      chartDataSummary: chartData.map(d => ({
        name: d.name,
        estimatedSavings: d.estimatedSavings,
        actualSavings: d.actualSavings
      }))
    });
    
    return chartData;
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

      // Apply validation and generate intelligent defaults for recommendation data
      let validatedRec = ReportValidationHelper.validateSingleRecommendation(rec);
      
      // Generate financial estimates if they're missing
      if (!validatedRec.estimatedSavings || !validatedRec.estimatedCost || !validatedRec.paybackPeriod) {
        const financialData = this.generateFinancialEstimates(
          validatedRec.title,
          validatedRec.description,
          validatedRec.scope || '',
          auditData
        );
        
        // Apply financial estimates where missing
        if (!validatedRec.estimatedSavings) {
          validatedRec.estimatedSavings = financialData.estimatedSavings;
          validatedRec.isEstimated = true;
        }
        
        if (!validatedRec.estimatedCost) {
          validatedRec.estimatedCost = financialData.estimatedCost;
          validatedRec.isEstimated = true;
        }
        
        if (!validatedRec.paybackPeriod) {
          validatedRec.paybackPeriod = financialData.paybackPeriod;
          validatedRec.isEstimated = true;
        }
      }
      
      // Create a table for the recommendation details with proper formatting
      const recRows = [
        ['Estimated Savings:', this.formatters.valueFormatter.formatValue(validatedRec.estimatedSavings, 'currency', 'savings') + '/year'],
        ['Implementation Cost:', this.formatters.valueFormatter.formatValue(validatedRec.estimatedCost, 'currency', 'cost')],
        ['Payback Period:', this.formatters.valueFormatter.formatValue(validatedRec.paybackPeriod, 'number', 'payback') + ' years']
      ];
      
      // Add an estimated flag if values are calculated estimates
      if (validatedRec.isEstimated) {
        recRows.push(['Note:', 'Financial figures are estimates based on typical values']);
      }
          
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
