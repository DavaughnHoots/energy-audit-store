import pkg from 'pg';
const { Pool } = pkg;
import { appLogger } from '../utils/logger.js';
import { EnergyAuditData } from '../types/energyAudit.js';
import { createCanvas } from 'canvas';
import { Chart } from 'chart.js/auto';

/**
 * Types of visualizations supported by the service
 */
export enum VisualizationType {
  ENERGY_BREAKDOWN = 'energy_breakdown',
  SAVINGS_CHART = 'savings_chart',
  LIGHTING_EFFICIENCY = 'lighting_efficiency',
  HVAC_PERFORMANCE = 'hvac_performance',
  INSULATION_QUALITY = 'insulation_quality',
  CARBON_FOOTPRINT = 'carbon_footprint'
}

/**
 * Interface for visualization data
 */
export interface VisualizationData {
  id?: string;
  auditId: string;
  visualizationType: VisualizationType;
  data: any;
  createdAt?: Date;
}

/**
 * Service for generating and storing visualization data
 */
export class VisualizationService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Generate and store visualization data for an energy audit
   * @param auditId The ID of the energy audit
   * @param auditData The energy audit data
   * @param visualizationType The type of visualization to generate
   * @returns The generated visualization data
   */
  async generateVisualization(
    auditId: string,
    auditData: EnergyAuditData,
    visualizationType: VisualizationType
  ): Promise<VisualizationData> {
    appLogger.info('Generating visualization', { auditId, visualizationType });

    try {
      // Generate the visualization data based on the type
      let visualizationData: any;
      switch (visualizationType) {
        case VisualizationType.ENERGY_BREAKDOWN:
          visualizationData = this.generateEnergyBreakdown(auditData);
          break;
        case VisualizationType.LIGHTING_EFFICIENCY:
          visualizationData = this.generateLightingEfficiency(auditData);
          break;
        case VisualizationType.HVAC_PERFORMANCE:
          visualizationData = this.generateHvacPerformance(auditData);
          break;
        case VisualizationType.INSULATION_QUALITY:
          visualizationData = this.generateInsulationQuality(auditData);
          break;
        case VisualizationType.CARBON_FOOTPRINT:
          visualizationData = this.generateCarbonFootprint(auditData);
          break;
        default:
          throw new Error(`Unsupported visualization type: ${visualizationType}`);
      }

      // Store the visualization data in the database
      const result = await this.pool.query(
        `INSERT INTO visualization_data (audit_id, visualization_type, data)
         VALUES ($1, $2, $3)
         RETURNING id, created_at`,
        [auditId, visualizationType, JSON.stringify(visualizationData)]
      );

      const { id, created_at } = result.rows[0];

      appLogger.info('Visualization generated and stored', { id, auditId, visualizationType });

      return {
        id,
        auditId,
        visualizationType,
        data: visualizationData,
        createdAt: created_at
      };
    } catch (error) {
      appLogger.error('Error generating visualization', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        auditId,
        visualizationType
      });
      throw error;
    }
  }

  /**
   * Get visualization data by ID
   * @param id The ID of the visualization data
   * @returns The visualization data
   */
  async getVisualizationById(id: string): Promise<VisualizationData | null> {
    try {
      const result = await this.pool.query(
        `SELECT id, audit_id, visualization_type, data, created_at
         FROM visualization_data
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const { audit_id, visualization_type, data, created_at } = result.rows[0];

      return {
        id,
        auditId: audit_id,
        visualizationType: visualization_type as VisualizationType,
        data: JSON.parse(data),
        createdAt: created_at
      };
    } catch (error) {
      appLogger.error('Error getting visualization by ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id
      });
      throw error;
    }
  }

  /**
   * Get all visualizations for an audit
   * @param auditId The ID of the energy audit
   * @returns An array of visualization data
   */
  async getVisualizationsByAuditId(auditId: string): Promise<VisualizationData[]> {
    try {
      const result = await this.pool.query(
        `SELECT id, audit_id, visualization_type, data, created_at
         FROM visualization_data
         WHERE audit_id = $1
         ORDER BY created_at DESC`,
        [auditId]
      );

      return result.rows.map(row => ({
        id: row.id,
        auditId: row.audit_id,
        visualizationType: row.visualization_type as VisualizationType,
        data: JSON.parse(row.data),
        createdAt: row.created_at
      }));
    } catch (error) {
      appLogger.error('Error getting visualizations by audit ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        auditId
      });
      throw error;
    }
  }

  /**
   * Generate energy breakdown visualization data
   * @param auditData The energy audit data
   * @returns The energy breakdown visualization data
   */
  private generateEnergyBreakdown(auditData: EnergyAuditData): any {
    // Calculate energy usage breakdown
    const electricKwhPerYear = auditData.energyConsumption.electricBill * 12;
    const gasKwhPerYear = auditData.energyConsumption.gasBill * 29.3 * 12; // Convert therms to kWh
    const totalKwh = electricKwhPerYear + gasKwhPerYear;

    // Calculate percentages
    const electricPercentage = (electricKwhPerYear / totalKwh) * 100;
    const gasPercentage = (gasKwhPerYear / totalKwh) * 100;

    // Create chart data
    const chartData = {
      labels: ['Electricity', 'Natural Gas'],
      datasets: [{
        data: [electricPercentage, gasPercentage],
        backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(234, 88, 12, 0.5)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(234, 88, 12)'],
        borderWidth: 1
      }]
    };

    // Return visualization data
    return {
      chartType: 'pie',
      chartData,
      metrics: {
        electricKwhPerYear,
        gasKwhPerYear,
        totalKwh,
        electricPercentage,
        gasPercentage
      }
    };
  }

  /**
   * Generate lighting efficiency visualization data
   * @param auditData The energy audit data
   * @returns The lighting efficiency visualization data
   */
  private generateLightingEfficiency(auditData: EnergyAuditData): any {
    // Default values if no fixtures are available
    let totalWattage = 0;
    let totalLumens = 0;
    let totalHours = 0;
    let totalEnergyUsage = 0;
    let fixtureData: any[] = [];
    let avgEfficiency = 0;
    let annualCost = 0;
    let potentialSavings = 0;

    // Calculate lighting efficiency metrics if fixtures are available
    if (auditData.currentConditions.fixtures && auditData.currentConditions.fixtures.length > 0) {
      // Process each fixture
      fixtureData = auditData.currentConditions.fixtures.map(fixture => {
        const watts = fixture.watts || 0;
        const hours = fixture.hoursPerDay || 0;
        const lumens = fixture.lumens || 0;
        const efficiency = watts > 0 ? lumens / watts : 0;
        const annualUsage = (watts * hours * 365) / 1000; // kWh per year
        const annualCost = annualUsage * 0.12; // Assuming $0.12/kWh

        totalWattage += watts;
        totalLumens += lumens;
        totalHours += hours;
        totalEnergyUsage += annualUsage;

        return {
          name: fixture.name || 'Unknown',
          watts,
          hours,
          lumens,
          efficiency,
          annualUsage,
          annualCost
        };
      });

      // Calculate average efficiency
      avgEfficiency = totalWattage > 0 ? totalLumens / totalWattage : 0;
      annualCost = totalEnergyUsage * 0.12; // Assuming $0.12/kWh

      // Calculate potential savings with LED upgrade
      if (avgEfficiency < 80) { // Only if efficiency is below LED standard
        potentialSavings = totalEnergyUsage * 0.6 * 0.12; // 60% savings with LED at $0.12/kWh
      }
    }

    // Create chart data for fixture efficiency
    const chartData = {
      labels: fixtureData.map(fixture => fixture.name),
      datasets: [
        {
          label: 'Efficiency (lm/W)',
          data: fixtureData.map(fixture => fixture.efficiency),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Annual Usage (kWh)',
          data: fixtureData.map(fixture => fixture.annualUsage),
          backgroundColor: 'rgba(234, 88, 12, 0.5)',
          borderColor: 'rgb(234, 88, 12)',
          borderWidth: 1
        }
      ]
    };

    // Return visualization data
    return {
      chartType: 'bar',
      chartData,
      metrics: {
        totalWattage,
        totalLumens,
        totalHours,
        totalEnergyUsage,
        avgEfficiency,
        annualCost,
        potentialSavings,
        fixtureCount: fixtureData.length,
        primaryBulbType: auditData.currentConditions.primaryBulbType || 'unknown'
      },
      fixtures: fixtureData
    };
  }

  /**
   * Generate HVAC performance visualization data
   * @param auditData The energy audit data
   * @returns The HVAC performance visualization data
   */
  private generateHvacPerformance(auditData: EnergyAuditData): any {
    // Extract HVAC data
    const { heatingSystem, coolingSystem } = auditData.heatingCooling;

    // Calculate heating efficiency
    const heatingEfficiency = heatingSystem.efficiency || 0;
    const heatingTargetEfficiency = heatingSystem.targetEfficiency || 95;
    const heatingEfficiencyGap = Math.max(0, heatingTargetEfficiency - heatingEfficiency);

    // Calculate cooling efficiency
    const coolingEfficiency = coolingSystem.efficiency || 0;
    const coolingTargetEfficiency = coolingSystem.targetEfficiency || 16;
    const coolingEfficiencyGap = Math.max(0, coolingTargetEfficiency - coolingEfficiency);

    // Create chart data
    const chartData = {
      labels: ['Heating System', 'Cooling System'],
      datasets: [
        {
          label: 'Current Efficiency',
          data: [heatingEfficiency, coolingEfficiency],
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Target Efficiency',
          data: [heatingTargetEfficiency, coolingTargetEfficiency],
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        }
      ]
    };

    // Return visualization data
    return {
      chartType: 'bar',
      chartData,
      metrics: {
        heatingSystem: {
          type: heatingSystem.type,
          age: heatingSystem.age,
          efficiency: heatingEfficiency,
          targetEfficiency: heatingTargetEfficiency,
          efficiencyGap: heatingEfficiencyGap
        },
        coolingSystem: {
          type: coolingSystem.type,
          age: coolingSystem.age,
          efficiency: coolingEfficiency,
          targetEfficiency: coolingTargetEfficiency,
          efficiencyGap: coolingEfficiencyGap
        }
      }
    };
  }

  /**
   * Generate insulation quality visualization data
   * @param auditData The energy audit data
   * @returns The insulation quality visualization data
   */
  private generateInsulationQuality(auditData: EnergyAuditData): any {
    // Map insulation quality to numeric values
    const qualityMap: Record<string, number> = {
      'poor': 0,
      'average': 1,
      'good': 2,
      'excellent': 3,
      'not-sure': 1
    };

    // Extract insulation data
    const { attic, walls, basement, floor } = auditData.currentConditions.insulation;

    // Convert to numeric values
    const atticValue = qualityMap[attic] || 1;
    const wallsValue = qualityMap[walls] || 1;
    const basementValue = qualityMap[basement] || 1;
    const floorValue = qualityMap[floor] || 1;

    // Calculate average insulation score
    const avgInsulationScore = (atticValue + wallsValue + basementValue + floorValue) / 4;

    // Create chart data
    const chartData = {
      labels: ['Attic', 'Walls', 'Basement', 'Floor'],
      datasets: [{
        label: 'Insulation Quality',
        data: [atticValue, wallsValue, basementValue, floorValue],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    };

    // Return visualization data
    return {
      chartType: 'radar',
      chartData,
      metrics: {
        atticValue,
        wallsValue,
        basementValue,
        floorValue,
        avgInsulationScore
      }
    };
  }

  /**
   * Generate carbon footprint visualization data
   * @param auditData The energy audit data
   * @returns The carbon footprint visualization data
   */
  private generateCarbonFootprint(auditData: EnergyAuditData): any {
    // Calculate energy usage
    const electricKwhPerYear = auditData.energyConsumption.electricBill * 12;
    const gasKwhPerYear = auditData.energyConsumption.gasBill * 29.3 * 12; // Convert therms to kWh
    const totalKwh = electricKwhPerYear + gasKwhPerYear;

    // Calculate carbon emissions (kg CO2)
    // Using average emission factors: 0.4 kg CO2/kWh for electricity, 0.2 kg CO2/kWh for natural gas
    const electricEmissions = electricKwhPerYear * 0.4;
    const gasEmissions = gasKwhPerYear * 0.2;
    const totalEmissions = electricEmissions + gasEmissions;

    // Calculate potential reductions based on recommendations
    const potentialReduction = totalEmissions * 0.3; // Assume 30% reduction potential

    // Create chart data
    const chartData = {
      labels: ['Electricity', 'Natural Gas'],
      datasets: [{
        label: 'Carbon Emissions (kg CO2)',
        data: [electricEmissions, gasEmissions],
        backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(234, 88, 12, 0.5)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(234, 88, 12)'],
        borderWidth: 1
      }]
    };

    // Return visualization data
    return {
      chartType: 'pie',
      chartData,
      metrics: {
        electricKwhPerYear,
        gasKwhPerYear,
        totalKwh,
        electricEmissions,
        gasEmissions,
        totalEmissions,
        potentialReduction,
        emissionsPerSqFt: totalEmissions / auditData.homeDetails.squareFootage
      }
    };
  }

  /**
   * Generate a chart image from visualization data
   * @param visualizationData The visualization data
   * @param width The width of the chart image
   * @param height The height of the chart image
   * @returns A Buffer containing the chart image
   */
  async generateChartImage(
    visualizationData: VisualizationData,
    width: number = 600,
    height: number = 400
  ): Promise<Buffer> {
    try {
      const { data } = visualizationData;
      const { chartType, chartData } = data;

      // Create canvas
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Create chart
      new Chart(ctx as any, {
        type: chartType,
        data: chartData,
        options: {
          responsive: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      // Convert canvas to buffer
      return canvas.toBuffer('image/png');
    } catch (error) {
      appLogger.error('Error generating chart image', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        visualizationType: visualizationData.visualizationType
      });
      throw error;
    }
  }
}

// Create and export the visualization service instance
export const visualizationService = new VisualizationService(
  new Pool(process.env.NODE_ENV === 'test' ? { connectionString: 'postgres://localhost:5432/energy_audit_test' } : undefined)
);
