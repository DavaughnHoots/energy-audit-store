import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import { Chart, TooltipItem } from 'chart.js/auto';
import { EnergyAuditData, AuditRecommendation } from '../types/energyAudit.js';
import { dashboardService } from './dashboardService.js';
import { appLogger } from '../utils/logger.js';
import { productRecommendationService } from './productRecommendationService.js';
import { calculateOverallEfficiencyScore, interpretEfficiencyScore } from './efficiencyScoreService.js';

export class ReportGenerationService {
  /**
   * Generates a table in the PDF document
   * @param doc PDFKit document
   * @param headers Array of header strings (optional)
   * @param rows Array of row data arrays
   */
  private generateTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: any[][]
  ): void {
    appLogger.debug('Generating table', { 
      headerCount: headers.length,
      rowCount: rows.length
    });

    try {
      const tableTop = doc.y;
      const tableLeft = 50;
      const cellPadding = 5;
      const columnWidth = (doc.page.width - 100) / (headers.length || 2);
      
      // Draw headers if provided
      if (headers.length > 0) {
        doc.fillColor('#6b7280').rect(tableLeft, tableTop, doc.page.width - 100, 20).fill();
        doc.fillColor('white');
        
        headers.forEach((header, i) => {
          doc.text(
            header,
            tableLeft + (i * columnWidth) + cellPadding,
            tableTop + cellPadding,
            { width: columnWidth - (cellPadding * 2) }
          );
        });
        
        doc.fillColor('black');
      }
      
      // Draw rows
      let rowTop = headers.length > 0 ? tableTop + 20 : tableTop;
      
      rows.forEach((row, rowIndex) => {
        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.fillColor('#f3f4f6').rect(tableLeft, rowTop, doc.page.width - 100, 20).fill();
        }
        
        doc.fillColor('black');
        
        row.forEach((cell, i) => {
          doc.text(
            this.formatValue(cell, i === 1 ? 'auto' : 'text'),
            tableLeft + (i * columnWidth) + cellPadding,
            rowTop + cellPadding,
            { width: columnWidth - (cellPadding * 2) }
          );
        });
        
        rowTop += 20;
      });
      
      // Update document position
      doc.y = rowTop + 10;
    } catch (error) {
      appLogger.error('Error generating table', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Continue without the table
      doc.moveDown();
    }
  }

  /**
   * Adds a section header to the PDF document
   * @param doc PDFKit document
   * @param title Section title
   * @param align Optional alignment (default: left)
   */
  /**
   * Adds a section header to the PDF document
   * @param doc PDFKit document
   * @param title Section title
   * @param align Optional alignment (default: left)
   * @param startNewPage Whether to start a new page before adding the header
   */
  private addSectionHeader(
    doc: PDFKit.PDFDocument,
    title: string,
    align: 'left' | 'center' | 'right' = 'left',
    startNewPage: boolean = false
  ): void {
    try {
      if (startNewPage) {
        doc.addPage();
      }
      
      doc
        .fontSize(16)
        .fillColor('#000000')
        .text(title, { align, underline: false })
        .moveDown(0.5);
    } catch (error) {
      appLogger.error('Error adding section header', { 
        error: error instanceof Error ? error.message : String(error),
        title
      });
      // Continue without the header
      doc.moveDown();
    }
  }

  /**
   * Formats a value for display in the PDF
   * @param value Value to format
   * @param type Type of formatting to apply
   * @returns Formatted string
   */
  private formatValue(
    value: any,
    type: 'currency' | 'percentage' | 'number' | 'text' | 'auto' = 'text'
  ): string {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return 'N/A';
    }
    
    if (type === 'auto') {
      // Try to determine the type
      if (typeof value === 'string' && value.startsWith('$')) {
        type = 'currency';
      } else if (typeof value === 'number') {
        type = 'number';
      } else {
        type = 'text';
      }
    }
    
    switch (type) {
      case 'currency':
        return typeof value === 'number' ? `$${value.toFixed(2)}` : value.toString();
      case 'percentage':
        return typeof value === 'number' ? `${value.toFixed(1)}%` : value.toString();
      case 'number':
        return typeof value === 'number' ? value.toFixed(2) : value.toString();
      case 'text':
      default:
        return value.toString();
    }
  }

  /**
   * Calculates the total energy consumption from audit data
   * @param auditData Energy audit data
   * @returns Total energy consumption in kWh
   */
  private calculateTotalEnergy(auditData: EnergyAuditData): number {
    try {
      const electricKwhPerYear = auditData.energyConsumption.electricBill * 12;
      const gasKwhPerYear = auditData.energyConsumption.gasBill * 29.3 * 12; // Convert therms to kWh
      return electricKwhPerYear + gasKwhPerYear;
    } catch (error) {
      appLogger.error('Error calculating total energy', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
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
   * Calculates the potential annual savings from recommendations
   * @param recommendations Audit recommendations
   * @returns Total potential annual savings
   */
  private calculatePotentialSavings(recommendations: AuditRecommendation[]): number {
    try {
      return recommendations.reduce((sum, rec) => sum + (rec.estimatedSavings || 0), 0);
    } catch (error) {
      appLogger.error('Error calculating potential savings', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * Calculates the energy efficiency percentage
   * @param auditData Energy audit data
   * @returns Energy efficiency percentage
   */
  private calculateEnergyEfficiency(auditData: EnergyAuditData): number {
    try {
      // This is a simplified calculation - in a real implementation, this would use more complex logic
      const baseConsumption: number = 500; // Baseline consumption for comparison
      const actualConsumption = this.calculateTotalEnergy(auditData);
      
      if (baseConsumption <= 0 || actualConsumption <= 0) {
        return 0;
      }
      
      return (baseConsumption / actualConsumption) * 100;
    } catch (error) {
      appLogger.error('Error calculating energy efficiency', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * Calculates the HVAC efficiency gap
   * @param auditData Energy audit data
   * @returns HVAC efficiency gap percentage
   */
  private calculateHvacEfficiencyGap(auditData: EnergyAuditData): number {
    try {
      // This is a simplified calculation - in a real implementation, this would use more complex logic
      const currentEfficiency = auditData.heatingCooling.heatingSystem.efficiency || 0;
      const targetEfficiency = auditData.heatingCooling.heatingSystem.targetEfficiency || 95;
      
      return targetEfficiency - currentEfficiency;
    } catch (error) {
      appLogger.error('Error calculating HVAC efficiency gap', { 
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
      
      this.generateTable(doc, [], rows);
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
      
      this.addSectionHeader(doc, 'Executive Summary');
      
      const totalEnergy = this.calculateTotalEnergy(auditData);
      const efficiencyScore = this.calculateEfficiencyScore(auditData);
      const potentialSavings = this.calculatePotentialSavings(recommendations);
      
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Energy Consumption', `${totalEnergy.toFixed(2)} kWh`],
        ['Overall Efficiency Score', efficiencyScore.toFixed(1)],
        ['Potential Annual Savings', `$${potentialSavings.toFixed(2)}`]
      ];
      
      this.generateTable(doc, headers, rows);
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
      
      this.addSectionHeader(doc, 'Key Findings');
      
      // Extract key findings from audit data
      const energyEfficiency = this.calculateEnergyEfficiency(auditData);
      const hvacEfficiencyGap = this.calculateHvacEfficiencyGap(auditData);
      
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
   * Generates a savings chart for the recommendations
   * @param recommendations Audit recommendations
   * @param width Chart width
   * @param height Chart height
   * @returns Buffer containing the chart image
   */
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

  /**
   * Generates an energy consumption breakdown bar chart
   * @param auditData Energy audit data
   * @param width Chart width
   * @param height Chart height
   * @returns Buffer containing the chart image
   */
  private async generateEnergyConsumptionChart(
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

  /**
   * Generates an energy breakdown pie chart
   * @param auditData Energy audit data
   * @param width Chart width
   * @param height Chart height
   * @returns Buffer containing the chart image
   */
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
        this.addSectionHeader(doc, 'Property Information', 'left', true);
        
        const rows = [
          ['Address:', auditData.basicInfo.address],
          ['Property Type:', auditData.basicInfo.propertyType],
          ['Year Built:', auditData.basicInfo.yearBuilt],
          ['Square Footage:', `${auditData.homeDetails.squareFootage} sq ft`]
        ];
        
        this.generateTable(doc, [], rows);
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

      // Current Conditions Summary - start on new page
      try {
        appLogger.debug('Adding current conditions section');
        this.addSectionHeader(doc, 'Current Conditions', 'left', true);
        
        const rows = [
          ['Insulation:', `${auditData.currentConditions.insulation.attic} (Attic)`],
          ['Windows:', auditData.currentConditions.windowType],
          ['HVAC System Age:', `${auditData.heatingCooling.heatingSystem.age} years`]
        ];
        
        this.generateTable(doc, [], rows);
        doc.moveDown();
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

      // HVAC System Details - start on new page
      try {
        appLogger.debug('Adding HVAC system details section');
        this.addSectionHeader(doc, 'HVAC System Details', 'left', true);
        
        // Heating System
        const heatingRows = [
          ['Type:', auditData.heatingCooling.heatingSystem.type],
          ['Efficiency:', auditData.heatingCooling.heatingSystem.efficiency]
        ];
        
        // Add new heating system fields if they exist
        if (auditData.heatingCooling.heatingSystem.outputCapacity) {
          heatingRows.push(['Output Capacity:', `${auditData.heatingCooling.heatingSystem.outputCapacity} BTU/hr`]);
        }
        if (auditData.heatingCooling.heatingSystem.inputPower) {
          heatingRows.push(['Input Power:', `${auditData.heatingCooling.heatingSystem.inputPower} kW`]);
        }
        if (auditData.heatingCooling.heatingSystem.targetEfficiency) {
          heatingRows.push(['Target Efficiency:', `${auditData.heatingCooling.heatingSystem.targetEfficiency}%`]);
        }
        
        doc.fontSize(14).text('Heating System:').moveDown(0.3);
        this.generateTable(doc, [], heatingRows);
        doc.moveDown();
        
        // Cooling System
        if (auditData.heatingCooling.coolingSystem.type !== 'none') {
          const coolingRows = [
            ['Type:', auditData.heatingCooling.coolingSystem.type],
            ['Efficiency:', auditData.heatingCooling.coolingSystem.efficiency]
          ];
          
          // Add new cooling system fields if they exist
          if (auditData.heatingCooling.coolingSystem.outputCapacity) {
            coolingRows.push(['Output Capacity:', `${auditData.heatingCooling.coolingSystem.outputCapacity} BTU/hr`]);
          }
          if (auditData.heatingCooling.coolingSystem.inputPower) {
            coolingRows.push(['Input Power:', `${auditData.heatingCooling.coolingSystem.inputPower} kW`]);
          }
          if (auditData.heatingCooling.coolingSystem.targetEfficiency) {
            coolingRows.push(['Target Efficiency:', `${auditData.heatingCooling.coolingSystem.targetEfficiency} SEER`]);
          }
          
          doc.fontSize(14).text('Cooling System:').moveDown(0.3);
          this.generateTable(doc, [], coolingRows);
        } else {
          doc.fontSize(14).text('Cooling System: None').moveDown(0.3);
        }
        
        // Temperature Difference
        if (auditData.heatingCooling.temperatureDifference || auditData.heatingCooling.temperatureDifferenceCategory) {
          let tempDiffValue = '';
          
          if (auditData.heatingCooling.temperatureDifference) {
            tempDiffValue = `${auditData.heatingCooling.temperatureDifference}°F`;
          } else if (auditData.heatingCooling.temperatureDifferenceCategory) {
            const categoryMap: Record<string, string> = {
              'small': 'Small (less than 10°F)',
              'moderate': 'Moderate (10-20°F)',
              'large': 'Large (20-30°F)',
              'extreme': 'Extreme (more than 30°F)'
            };
            tempDiffValue = categoryMap[auditData.heatingCooling.temperatureDifferenceCategory] || 
                           auditData.heatingCooling.temperatureDifferenceCategory;
          }
          
          const tempDiffRows = [['Temperature Difference:', tempDiffValue]];
          this.generateTable(doc, [], tempDiffRows);
        }
        
        doc.moveDown();
      } catch (error) {
        appLogger.error('Error adding HVAC system details section', { 
          error,
          heatingCooling: {
            hasHeatingSystem: !!auditData.heatingCooling.heatingSystem,
            hasCoolingSystem: !!auditData.heatingCooling.coolingSystem,
            hasTemperatureDifference: !!auditData.heatingCooling.temperatureDifference,
            hasTemperatureDifferenceCategory: !!auditData.heatingCooling.temperatureDifferenceCategory
          }
        });
        // Continue without HVAC details
        doc.moveDown();
      }

      // Energy Usage - start on new page
      try {
        appLogger.debug('Adding energy consumption section');
        this.addSectionHeader(doc, 'Energy Consumption', 'left', true);
        
        const rows = [
          ['Average Monthly Electric:', `${auditData.energyConsumption.electricBill} kWh`],
          ['Average Monthly Gas:', `${auditData.energyConsumption.gasBill} therms`]
        ];
        
        // Add new fields if they exist
        if (auditData.energyConsumption.durationHours !== undefined) {
          rows.push(['Daily Usage Hours:', `${auditData.energyConsumption.durationHours} hours`]);
        }
        
        if (auditData.energyConsumption.powerFactor !== undefined) {
          rows.push(['Power Factor:', auditData.energyConsumption.powerFactor.toFixed(2)]);
        }
        
        if (auditData.energyConsumption.seasonalFactor !== undefined) {
          rows.push(['Seasonal Factor:', auditData.energyConsumption.seasonalFactor.toFixed(2)]);
        }
        
        if (auditData.energyConsumption.occupancyFactor !== undefined) {
          rows.push(['Occupancy Factor:', auditData.energyConsumption.occupancyFactor.toFixed(2)]);
        }
        
        this.generateTable(doc, [], rows);
        doc.moveDown();
      } catch (error) {
        appLogger.error('Error adding energy consumption section', { 
          error,
          energyConsumption: {
            hasElectricBill: !!auditData.energyConsumption.electricBill,
            hasGasBill: !!auditData.energyConsumption.gasBill,
            hasDurationHours: auditData.energyConsumption.durationHours !== undefined,
            hasPowerFactor: auditData.energyConsumption.powerFactor !== undefined,
            hasSeasonalFactor: auditData.energyConsumption.seasonalFactor !== undefined,
            hasOccupancyFactor: auditData.energyConsumption.occupancyFactor !== undefined
          }
        });
        throw error;
      }

      // Energy Breakdown Chart
      try {
        appLogger.debug('Generating and adding energy breakdown chart');
        const energyBreakdownChart = await this.generateEnergyBreakdownChart(auditData, 600, 300);
        
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
      
      // Energy Consumption Breakdown Chart
      try {
        appLogger.debug('Generating and adding energy consumption breakdown chart');
        const energyConsumptionChart = await this.generateEnergyConsumptionChart(auditData, 600, 300);
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
      
      // Lighting Assessment - start on new page
      try {
        appLogger.debug('Adding lighting assessment section');
        if (auditData.currentConditions.primaryBulbType) {
          this.addSectionHeader(doc, 'Lighting Assessment', 'left', true);
            
          // Primary lighting information
          const bulbTypeText = {
            'mostly-led': 'Mostly LED/Efficient Bulbs',
            'mixed': 'Mix of Bulb Types',
            'mostly-incandescent': 'Mostly Older Bulb Types'
          };
          
          const naturalLightText = {
            'good': 'Good Natural Light',
            'moderate': 'Moderate Natural Light',
            'limited': 'Limited Natural Light'
          };
          
          const controlsText = {
            'basic': 'Basic Switches Only',
            'some-advanced': 'Some Advanced Controls',
            'smart': 'Smart/Automated Lighting'
          };
          
          const rows = [
            ['Primary Bulb Types:', bulbTypeText[auditData.currentConditions.primaryBulbType as keyof typeof bulbTypeText] || 'Not specified'],
            ['Natural Light:', naturalLightText[auditData.currentConditions.naturalLight as keyof typeof naturalLightText] || 'Not specified'],
            ['Lighting Controls:', controlsText[auditData.currentConditions.lightingControls as keyof typeof controlsText] || 'Not specified']
          ];
          
          this.generateTable(doc, [], rows);
          
          // Add detailed bulb percentages if available
          if (auditData.currentConditions.bulbPercentages) {
            doc.moveDown(0.5).fontSize(14).text('Bulb Type Distribution:').moveDown(0.3);
            
            const { led, cfl, incandescent } = auditData.currentConditions.bulbPercentages;
            const bulbRows = [];
            
            if (led !== undefined) bulbRows.push(['LED:', `${led}%`]);
            if (cfl !== undefined) bulbRows.push(['CFL:', `${cfl}%`]);
            if (incandescent !== undefined) bulbRows.push(['Incandescent:', `${incandescent}%`]);
            
            this.generateTable(doc, [], bulbRows);
          }
          
          // Add lighting fixtures if available
          if (auditData.currentConditions.fixtures && auditData.currentConditions.fixtures.length > 0) {
            doc.moveDown(0.5).text('Lighting Fixtures:');
            
            // Calculate total energy usage and efficiency metrics
            let totalWattage = 0;
            let totalLumens = 0;
            let totalHours = 0;
            let totalEnergyUsage = 0;
            
            auditData.currentConditions.fixtures.forEach((fixture, index) => {
              const watts = fixture.watts || 0;
              const hours = fixture.hoursPerDay || 0;
              const lumens = fixture.lumens || 0;
              const efficiency = watts > 0 ? lumens / watts : 0;
              
              totalWattage += watts;
              totalLumens += lumens;
              totalHours += hours;
              totalEnergyUsage += (watts * hours * 365) / 1000; // kWh per year
              
              if (fixture.name) {
                doc.text(`  ${index + 1}. ${fixture.name}: ${watts}W, ${hours} hours/day, ${lumens} lumens`);
                doc.text(`     Efficiency: ${efficiency.toFixed(1)} lm/W, Annual Usage: ${((watts * hours * 365) / 1000).toFixed(1)} kWh`);
              }
            });
            
            // Add summary of lighting efficiency and energy usage
            const avgEfficiency = totalWattage > 0 ? totalLumens / totalWattage : 0;
            const annualCost = totalEnergyUsage * 0.12; // Assuming $0.12/kWh
            
            doc.moveDown(0.5)
              .text('Lighting Efficiency Summary:')
              .text(`  Average Efficiency: ${avgEfficiency.toFixed(1)} lm/W (LED Target: 100+ lm/W)`)
              .text(`  Total Annual Energy Usage: ${totalEnergyUsage.toFixed(1)} kWh`)
              .text(`  Estimated Annual Cost: $${annualCost.toFixed(2)}`);
            
            // Calculate potential savings with LED upgrade
            if (avgEfficiency < 80) { // Only show if efficiency is below LED standard
              const potentialSavings = totalEnergyUsage * 0.6 * 0.12; // 60% savings with LED at $0.12/kWh
              doc.text(`  Potential Annual Savings with LED Upgrade: $${potentialSavings.toFixed(2)}`);
            }
          }
          
          // Add lighting usage patterns if available
          if (auditData.currentConditions.lightingPatterns) {
            doc.moveDown(0.5).fontSize(14).text('Lighting Usage Patterns:').moveDown(0.3);
            
            const patternText = {
              'most': 'Most Lights',
              'some': 'Some Lights',
              'few': 'Few Lights',
              'none': 'No Lights'
            };
            
            const { morning, day, evening, night } = auditData.currentConditions.lightingPatterns;
            const patternRows = [];
            
            if (morning) patternRows.push(['Morning (5am-9am):', patternText[morning as keyof typeof patternText]]);
            if (day) patternRows.push(['Day (9am-5pm):', patternText[day as keyof typeof patternText]]);
            if (evening) patternRows.push(['Evening (5pm-10pm):', patternText[evening as keyof typeof patternText]]);
            if (night) patternRows.push(['Night (10pm-5am):', patternText[night as keyof typeof patternText]]);
            
            this.generateTable(doc, [], patternRows);
          }
          
          doc.moveDown();
        }
      } catch (error) {
        appLogger.error('Error adding lighting assessment section', { 
          error,
          lightingData: {
            hasPrimaryBulbType: !!auditData.currentConditions.primaryBulbType,
            hasNaturalLight: !!auditData.currentConditions.naturalLight,
            hasLightingControls: !!auditData.currentConditions.lightingControls
          }
        });
        // Continue without lighting section
      }

      // Recommendations - start on new page with left-aligned title and description
      try {
        appLogger.debug('Adding recommendations section');
        this.addSectionHeader(doc, 'Recommendations', 'left', true);

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
            .text(rec.title, { align: 'left' })
            .fillColor('black')
            .moveDown(0.3);
          
          // Add description - left aligned
          doc.fontSize(12).text(rec.description, { align: 'left' }).moveDown(0.5);
          
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
          
          this.generateTable(doc, [], recRows);
          doc.moveDown();
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

      // Product Recommendations
      try {
        appLogger.debug('Adding product recommendations section');
        
        if (auditData.productPreferences) {
          doc
            .addPage()
            .fontSize(16)
            .text('Product Recommendations', { align: 'center' })
            .moveDown();
          
          // Get product recommendations
          const recommendations = await productRecommendationService.recommendProducts(
            auditData.productPreferences
          );
          
          if (Object.keys(recommendations).length === 0) {
            doc
              .fontSize(12)
              .text('No specific product recommendations available at this time.')
              .moveDown();
          } else {
            // Calculate potential savings for each category
            const savingsByCategory: Record<string, number> = {};
            let totalSavings = 0;
            
            for (const [category, products] of Object.entries(recommendations)) {
              const savings = productRecommendationService.calculateProductSavings(products);
              savingsByCategory[category] = savings;
              totalSavings += savings;
              
              // Format category name
              const formattedCategory = category
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              doc
                .fontSize(14)
                .fillColor('#0284c7')
                .text(`${formattedCategory} Recommendations`)
                .fillColor('black')
                .fontSize(12)
                .moveDown(0.5);
              
              // List top products
              for (const product of products.slice(0, 3)) { // Show top 3 products
                doc
                  .fontSize(12)
                  .text(`• ${product.productName}`)
                  .fontSize(10)
                  .text(`  Efficiency: ${product.efficiencyRating || 'N/A'}`, { indent: 10 })
                  .text(`  Price: $${product.price ? product.price.toFixed(2) : 'N/A'}`, { indent: 10 });
                
                if (product.features) {
                  doc.text(`  Features: ${product.features}`, { indent: 10 });
                }
                
                doc.moveDown(0.5);
              }
              
              // Show estimated savings
              if (savings > 0) {
                doc
                  .fontSize(11)
                  .text(`Estimated Annual Savings: $${savings.toFixed(2)}`)
                  .moveDown();
              }
              
              doc.moveDown();
            }
            
            // Add total savings
            if (totalSavings > 0) {
              doc
                .fontSize(14)
                .text(`Total Estimated Annual Savings: $${totalSavings.toFixed(2)}`)
                .moveDown();
            }
          }
          
          appLogger.debug('Product recommendations section added successfully');
        }
      } catch (error) {
        appLogger.error('Error adding product recommendations section', { error });
        // Continue without product recommendations section
      }

      // Summary - start on new page
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
        
        this.addSectionHeader(doc, 'Summary', 'left', true);
        
        const rows = [
          ['Total Estimated Annual Savings:', `$${totalEstimatedSavings}`],
          ['Total Actual Annual Savings:', `$${totalActualSavings}`],
          ['Number of Implemented Recommendations:', implementedRecs.length.toString()],
          ['Overall Savings Accuracy:', implementedRecs.length > 0
              ? `${((totalActualSavings / totalEstimatedSavings) * 100).toFixed(1)}%`
              : 'N/A']
        ];
        
        this.generateTable(doc, [], rows);
        doc.moveDown();
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
