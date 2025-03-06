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

      // HVAC System Details
      try {
        appLogger.debug('Adding HVAC system details section');
        doc
          .fontSize(16)
          .text('HVAC System Details')
          .moveDown(0.5)
          .fontSize(12);

        // Heating System
        doc.text('Heating System:')
          .text(`  Type: ${auditData.heatingCooling.heatingSystem.type}`)
          .text(`  Efficiency: ${auditData.heatingCooling.heatingSystem.efficiency}`);
        
        // Add new heating system fields if they exist
        if (auditData.heatingCooling.heatingSystem.outputCapacity) {
          doc.text(`  Output Capacity: ${auditData.heatingCooling.heatingSystem.outputCapacity} BTU/hr`);
        }
        if (auditData.heatingCooling.heatingSystem.inputPower) {
          doc.text(`  Input Power: ${auditData.heatingCooling.heatingSystem.inputPower} kW`);
        }
        if (auditData.heatingCooling.heatingSystem.targetEfficiency) {
          doc.text(`  Target Efficiency: ${auditData.heatingCooling.heatingSystem.targetEfficiency}%`);
        }

        doc.moveDown(0.5);

        // Cooling System
        if (auditData.heatingCooling.coolingSystem.type !== 'none') {
          doc.text('Cooling System:')
            .text(`  Type: ${auditData.heatingCooling.coolingSystem.type}`)
            .text(`  Efficiency: ${auditData.heatingCooling.coolingSystem.efficiency}`);
          
          // Add new cooling system fields if they exist
          if (auditData.heatingCooling.coolingSystem.outputCapacity) {
            doc.text(`  Output Capacity: ${auditData.heatingCooling.coolingSystem.outputCapacity} BTU/hr`);
          }
          if (auditData.heatingCooling.coolingSystem.inputPower) {
            doc.text(`  Input Power: ${auditData.heatingCooling.coolingSystem.inputPower} kW`);
          }
          if (auditData.heatingCooling.coolingSystem.targetEfficiency) {
            doc.text(`  Target Efficiency: ${auditData.heatingCooling.coolingSystem.targetEfficiency} SEER`);
          }
        } else {
          doc.text('Cooling System: None');
        }

        // Temperature Difference
        if (auditData.heatingCooling.temperatureDifference) {
          doc.moveDown(0.5)
            .text(`Temperature Difference: ${auditData.heatingCooling.temperatureDifference}°F`);
        } else if (auditData.heatingCooling.temperatureDifferenceCategory) {
          const categoryMap: Record<string, string> = {
            'small': 'Small (less than 10°F)',
            'moderate': 'Moderate (10-20°F)',
            'large': 'Large (20-30°F)',
            'extreme': 'Extreme (more than 30°F)'
          };
          doc.moveDown(0.5)
            .text(`Temperature Difference: ${categoryMap[auditData.heatingCooling.temperatureDifferenceCategory] || auditData.heatingCooling.temperatureDifferenceCategory}`);
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
        
        if (auditData.energyConsumption.seasonalFactor !== undefined) {
          doc.text(`Seasonal Factor: ${auditData.energyConsumption.seasonalFactor.toFixed(2)}`);
        }
        
        if (auditData.energyConsumption.occupancyFactor !== undefined) {
          doc.text(`Occupancy Factor: ${auditData.energyConsumption.occupancyFactor.toFixed(2)}`);
        }
        
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
      
      // Lighting Assessment
      try {
        appLogger.debug('Adding lighting assessment section');
        if (auditData.currentConditions.primaryBulbType) {
          doc
            .fontSize(16)
            .text('Lighting Assessment')
            .moveDown(0.5)
            .fontSize(12);
            
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
          
          doc
            .text(`Primary Bulb Types: ${bulbTypeText[auditData.currentConditions.primaryBulbType as keyof typeof bulbTypeText] || 'Not specified'}`)
            .text(`Natural Light: ${naturalLightText[auditData.currentConditions.naturalLight as keyof typeof naturalLightText] || 'Not specified'}`)
            .text(`Lighting Controls: ${controlsText[auditData.currentConditions.lightingControls as keyof typeof controlsText] || 'Not specified'}`);
          
          // Add detailed bulb percentages if available
          if (auditData.currentConditions.bulbPercentages) {
            doc.moveDown(0.5).text('Bulb Type Distribution:');
            const { led, cfl, incandescent } = auditData.currentConditions.bulbPercentages;
            if (led !== undefined) doc.text(`  LED: ${led}%`);
            if (cfl !== undefined) doc.text(`  CFL: ${cfl}%`);
            if (incandescent !== undefined) doc.text(`  Incandescent: ${incandescent}%`);
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
            doc.moveDown(0.5).text('Lighting Usage Patterns:');
            const patternText = {
              'most': 'Most Lights',
              'some': 'Some Lights',
              'few': 'Few Lights',
              'none': 'No Lights'
            };
            
            const { morning, day, evening, night } = auditData.currentConditions.lightingPatterns;
            if (morning) doc.text(`  Morning (5am-9am): ${patternText[morning as keyof typeof patternText]}`);
            if (day) doc.text(`  Day (9am-5pm): ${patternText[day as keyof typeof patternText]}`);
            if (evening) doc.text(`  Evening (5pm-10pm): ${patternText[evening as keyof typeof patternText]}`);
            if (night) doc.text(`  Night (10pm-5am): ${patternText[night as keyof typeof patternText]}`);
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
