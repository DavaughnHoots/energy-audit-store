import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { appLogger } from '../utils/logger.js';

/**
 * Service for handling visualization data
 */
export class VisualizationService {
  /**
   * Save visualization data to the database
   * @param auditId - The ID of the energy audit
   * @param visualizationType - The type of visualization (energy, hvac, lighting, humidity, savings)
   * @param data - The visualization data as a JSON object
   * @returns The ID of the saved visualization data
   */
  async saveVisualizationData(auditId: string, visualizationType: string, data: any): Promise<string> {
    try {
      appLogger.info(`Saving ${visualizationType} visualization data for audit ${auditId}`);
      
      const id = uuidv4();
      const query = `
        INSERT INTO visualization_data (id, audit_id, visualization_type, data)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const values = [id, auditId, visualizationType, JSON.stringify(data)];
      const result = await pool.query(query, values);
      
      appLogger.info(`Visualization data saved with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } catch (error) {
      appLogger.error('Error saving visualization data', { error });
      throw error;
    }
  }
  
  /**
   * Get visualization data by audit ID and type
   * @param auditId - The ID of the energy audit
   * @param visualizationType - The type of visualization (optional)
   * @returns The visualization data
   */
  async getVisualizationData(auditId: string, visualizationType?: string): Promise<any[]> {
    try {
      appLogger.info(`Getting visualization data for audit ${auditId}${visualizationType ? ` of type ${visualizationType}` : ''}`);
      
      let query = `
        SELECT id, audit_id, visualization_type, data, created_at
        FROM visualization_data
        WHERE audit_id = $1
      `;
      
      const values: any[] = [auditId];
      
      if (visualizationType) {
        query += ' AND visualization_type = $2';
        values.push(visualizationType);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await pool.query(query, values);
      
      appLogger.info(`Found ${result.rows.length} visualization data records`);
      return result.rows;
    } catch (error) {
      appLogger.error('Error getting visualization data', { error });
      throw error;
    }
  }
  
  /**
   * Delete visualization data by ID
   * @param id - The ID of the visualization data
   * @returns True if the data was deleted, false otherwise
   */
  async deleteVisualizationData(id: string): Promise<boolean> {
    try {
      appLogger.info(`Deleting visualization data with ID: ${id}`);
      
      const query = `
        DELETE FROM visualization_data
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await pool.query(query, [id]);
      
      const deleted = result.rows.length > 0;
      appLogger.info(`Visualization data ${deleted ? 'deleted' : 'not found'}`);
      
      return deleted;
    } catch (error) {
      appLogger.error('Error deleting visualization data', { error });
      throw error;
    }
  }
  
  /**
   * Generate visualization data from energy audit results
   * @param auditId - The ID of the energy audit
   * @param auditResults - The results of the energy audit analysis
   * @returns Object containing the IDs of the saved visualization data
   */
  async generateVisualizations(auditId: string, auditResults: any): Promise<Record<string, string>> {
    try {
      appLogger.info(`Generating visualizations for audit ${auditId}`);
      
      const visualizationIds: Record<string, string> = {};
      
      // Generate energy visualization if data is available
      if (auditResults.energy) {
        const energyVisualization = this._generateEnergyVisualization(auditResults.energy);
        const energyId = await this.saveVisualizationData(auditId, 'energy', energyVisualization);
        visualizationIds.energy = energyId;
      }
      
      // Generate HVAC visualization if data is available
      if (auditResults.hvac) {
        const hvacVisualization = this._generateHvacVisualization(auditResults.hvac);
        const hvacId = await this.saveVisualizationData(auditId, 'hvac', hvacVisualization);
        visualizationIds.hvac = hvacId;
      }
      
      // Generate lighting visualization if data is available
      if (auditResults.lighting) {
        const lightingVisualization = this._generateLightingVisualization(auditResults.lighting);
        const lightingId = await this.saveVisualizationData(auditId, 'lighting', lightingVisualization);
        visualizationIds.lighting = lightingId;
      }
      
      // Generate humidity visualization if data is available
      if (auditResults.humidity) {
        const humidityVisualization = this._generateHumidityVisualization(auditResults.humidity);
        const humidityId = await this.saveVisualizationData(auditId, 'humidity', humidityVisualization);
        visualizationIds.humidity = humidityId;
      }
      
      // Generate savings visualization if data is available
      if (auditResults.recommendations && auditResults.recommendations.estimated_savings) {
        const savingsVisualization = this._generateSavingsVisualization(auditResults.recommendations.estimated_savings);
        const savingsId = await this.saveVisualizationData(auditId, 'savings', savingsVisualization);
        visualizationIds.savings = savingsId;
      }
      
      appLogger.info(`Generated ${Object.keys(visualizationIds).length} visualizations`);
      return visualizationIds;
    } catch (error) {
      appLogger.error('Error generating visualizations', { error });
      throw error;
    }
  }
  
  /**
   * Generate energy visualization data
   * @param energyResults - The energy analysis results
   * @returns The energy visualization data
   */
  _generateEnergyVisualization(energyResults: any): any {
    // Create a visualization object for energy data
    return {
      chartType: 'bar',
      title: 'Energy Consumption Analysis',
      data: {
        labels: ['Base Energy', 'Seasonal Adjusted', 'Occupancy Adjusted', 'Real Energy'],
        datasets: [
          {
            label: 'Energy Consumption (kWh)',
            data: [
              energyResults.Ebase || 0,
              energyResults.Eseasonal || 0,
              energyResults.Eoccupied || 0,
              energyResults.Ereal || 0
            ],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)'
            ]
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Energy (kWh)'
            }
          }
        }
      },
      metrics: energyResults.efficiency_metrics || {},
      timestamp: energyResults.timestamp || new Date()
    };
  }
  
  /**
   * Generate HVAC visualization data
   * @param hvacResults - The HVAC analysis results
   * @returns The HVAC visualization data
   */
  _generateHvacVisualization(hvacResults: any): any {
    // Create a visualization object for HVAC data
    return {
      chartType: 'gauge',
      title: 'HVAC System Efficiency',
      data: {
        labels: ['Current Efficiency', 'Target Efficiency'],
        datasets: [
          {
            label: 'Efficiency (%)',
            data: [
              hvacResults.system_efficiency?.current_efficiency || 0,
              hvacResults.system_efficiency?.target_efficiency || 0
            ],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(75, 192, 192, 0.6)'
            ]
          }
        ]
      },
      options: {
        circumference: 180,
        rotation: -90,
        cutout: '50%'
      },
      metrics: {
        efficiency_gap: hvacResults.system_efficiency?.efficiency_gap || 0,
        energy_consumption: hvacResults.energy_consumption || 0
      },
      timestamp: hvacResults.timestamp || new Date()
    };
  }
  
  /**
   * Generate lighting visualization data
   * @param lightingResults - The lighting analysis results
   * @returns The lighting visualization data
   */
  _generateLightingVisualization(lightingResults: any): any {
    // Extract fixture data
    const fixtures = lightingResults.fixtures || {};
    const fixtureNames = Object.keys(fixtures);
    const consumptionData = fixtureNames.map(name => fixtures[name].consumption || 0);
    const efficiencyData = fixtureNames.map(name => fixtures[name].efficiency || 0);
    
    // Create a visualization object for lighting data
    return {
      chartType: 'bar',
      title: 'Lighting Analysis',
      data: {
        labels: fixtureNames,
        datasets: [
          {
            label: 'Consumption (kWh)',
            data: consumptionData,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            yAxisID: 'y'
          },
          {
            label: 'Efficiency (lm/W)',
            data: efficiencyData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Consumption (kWh)'
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Efficiency (lm/W)'
            }
          }
        }
      },
      metrics: lightingResults.efficiency_metrics || {},
      timestamp: lightingResults.timestamp || new Date()
    };
  }
  
  /**
   * Generate humidity visualization data
   * @param humidityResults - The humidity analysis results
   * @returns The humidity visualization data
   */
  _generateHumidityVisualization(humidityResults: any): any {
    const currentHumidity = humidityResults.current_status?.current_humidity || 0;
    const targetHumidity = humidityResults.requirements?.target_humidity || 0;
    
    // Create a visualization object for humidity data
    return {
      chartType: 'gauge',
      title: 'Humidity Analysis',
      data: {
        labels: ['Current Humidity', 'Target Humidity'],
        datasets: [
          {
            label: 'Humidity (%)',
            data: [currentHumidity, targetHumidity],
            backgroundColor: [
              currentHumidity > targetHumidity ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)',
              'rgba(54, 162, 235, 0.6)'
            ]
          }
        ]
      },
      options: {
        circumference: 180,
        rotation: -90,
        cutout: '50%'
      },
      metrics: {
        humidity_gap: humidityResults.requirements?.humidity_gap || 0,
        dew_point: humidityResults.current_status?.dew_point || 0,
        control_priority: humidityResults.requirements?.control_priority || 'low'
      },
      timestamp: new Date()
    };
  }
  
  /**
   * Generate savings visualization data
   * @param savingsResults - The estimated savings results
   * @returns The savings visualization data
   */
  _generateSavingsVisualization(savingsResults: any): any {
    // Extract savings data
    const categories = Object.keys(savingsResults);
    const savingsData = categories.map(category => savingsResults[category] || 0);
    
    // Create a visualization object for savings data
    return {
      chartType: 'pie',
      title: 'Estimated Savings by Category',
      data: {
        labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
        datasets: [
          {
            label: 'Savings ($)',
            data: savingsData,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)'
            ]
          }
        ]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: $${value.toFixed(2)}`;
              }
            }
          }
        }
      },
      metrics: {
        total_savings: savingsData.reduce((sum, val) => sum + val, 0)
      },
      timestamp: new Date()
    };
  }
}

// Export a singleton instance
export const visualizationService = new VisualizationService();
