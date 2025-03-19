import { createCanvas } from 'canvas';
import { Chart } from 'chart.js/auto';
import { EnergyAuditData } from '../types/energyAudit.js';
import { appLogger } from './logger.js';

/**
 * Generates an efficiency metrics radar chart
 * @param auditData Energy audit data
 * @param width Chart width
 * @param height Chart height
 * @returns Buffer containing the chart image
 */
export async function generateEfficiencyRadarChart(
  auditData: EnergyAuditData,
  width: number,
  height: number
): Promise<Buffer> {
  appLogger.debug('Generating efficiency metrics radar chart', { 
    chartDimensions: { width, height }
  });

  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Calculate metrics (normalized to 0-100 scale)
    const calculateMetric = (value: number, max: number, invert = false) => {
      if (value === undefined || value === null || Number.isNaN(value)) return 0;
      const normalized = Math.min(100, Math.max(0, (value / max) * 100));
      return invert ? 100 - normalized : normalized;
    };
    
    // Calculate efficiency metrics
    const hvacEfficiency = calculateMetric(
      auditData.heatingCooling.heatingSystem.efficiency || 0, 
      100
    );
    
    const insulationScore = (() => {
      const insulationValues: Record<string, number> = {
        'poor': 20,
        'fair': 40,
        'good': 60,
        'excellent': 80,
        'optimal': 100
      };
      const insulationType = auditData.currentConditions.insulation.attic || 'fair';
      return insulationValues[insulationType.toLowerCase()] || 50;
    })();
    
    const windowScore = (() => {
      const windowValues: Record<string, number> = {
        'single-pane': 20,
        'double-pane': 60,
        'triple-pane': 90,
        'energy-efficient': 100
      };
      const windowType = auditData.currentConditions.windowType || 'double-pane';
      return windowValues[windowType.toLowerCase()] || 60;
    })();
    
    const lightingScore = (() => {
      const lightingValues: Record<string, number> = {
        'mostly-incandescent': 30,
        'mixed': 60,
        'mostly-led': 90
      };
      const lightingType = auditData.currentConditions.primaryBulbType || 'mixed';
      return lightingValues[lightingType.toLowerCase()] || 60;
    })();
    
    const energyUsageScore = calculateMetric(
      (auditData.energyConsumption.electricBill || 0) + 
      (auditData.energyConsumption.gasBill || 0) * 10, // Convert gas to equivalent electric scale
      1000, // Assuming baseline
      true // Invert (lower usage is better)
    );
    
    appLogger.debug('Efficiency radar chart metrics', {
      hvacEfficiency,
      insulationScore,
      windowScore,
      lightingScore,
      energyUsageScore
    });
    
    // Cast context to any to avoid Chart.js type issues
    const chart = new Chart(ctx as any, {
      type: 'radar',
      data: {
        labels: ['HVAC Efficiency', 'Insulation', 'Windows', 'Lighting', 'Energy Usage'],
        datasets: [{
          label: 'Current Efficiency',
          data: [hvacEfficiency, insulationScore, windowScore, lightingScore, energyUsageScore],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        }, {
          label: 'Target Efficiency',
          data: [90, 80, 80, 90, 80],
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgb(34, 197, 94)',
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(34, 197, 94)'
        }]
      },
      options: {
        responsive: false,
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              stepSize: 20
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Efficiency Metrics'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    appLogger.error('Error generating efficiency radar chart', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Generates an HVAC performance comparison chart
 * @param auditData Energy audit data
 * @param width Chart width
 * @param height Chart height
 * @returns Buffer containing the chart image
 */
export async function generateHvacPerformanceChart(
  auditData: EnergyAuditData,
  width: number,
  height: number
): Promise<Buffer> {
  appLogger.debug('Generating HVAC performance chart', { 
    chartDimensions: { width, height }
  });

  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Get current efficiency values
    const currentHeatingEfficiency = auditData.heatingCooling.heatingSystem.efficiency || 80;
    const currentCoolingEfficiency = auditData.heatingCooling.coolingSystem.efficiency || 14;
    
    // Get target efficiency values (or use industry standards if not available)
    const targetHeatingEfficiency = auditData.heatingCooling.heatingSystem.targetEfficiency || 95;
    const targetCoolingEfficiency = auditData.heatingCooling.coolingSystem.targetEfficiency || 18;
    
    // Calculate efficiency gaps
    const heatingGap = Math.max(0, targetHeatingEfficiency - currentHeatingEfficiency);
    const coolingGap = Math.max(0, targetCoolingEfficiency - currentCoolingEfficiency);
    
    appLogger.debug('HVAC performance metrics', {
      currentHeatingEfficiency,
      currentCoolingEfficiency,
      targetHeatingEfficiency,
      targetCoolingEfficiency,
      heatingGap,
      coolingGap
    });
    
    // Cast context to any to avoid Chart.js type issues
    const chart = new Chart(ctx as any, {
      type: 'bar',
      data: {
        labels: ['Heating System', 'Cooling System'],
        datasets: [
          {
            label: 'Current Efficiency',
            data: [currentHeatingEfficiency, currentCoolingEfficiency],
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          },
          {
            label: 'Target Efficiency',
            data: [targetHeatingEfficiency, targetCoolingEfficiency],
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: false,
        indexAxis: 'y',
        scales: {
          x: {
            title: {
              display: true,
              text: 'Efficiency Rating'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'HVAC System Performance'
          },
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                return tooltipItems[0].label === 'Heating System' 
                  ? 'Heating Efficiency (AFUE %)' 
                  : 'Cooling Efficiency (SEER)';
              }
            }
          }
        }
      }
    });
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    appLogger.error('Error generating HVAC performance chart', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Generates a lighting efficiency comparison chart
 * @param auditData Energy audit data
 * @param width Chart width
 * @param height Chart height
 * @returns Buffer containing the chart image
 */
export async function generateLightingEfficiencyChart(
  auditData: EnergyAuditData,
  width: number,
  height: number
): Promise<Buffer> {
  appLogger.debug('Generating lighting efficiency chart', { 
    chartDimensions: { width, height }
  });

  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Extract bulb percentages or use defaults
    const bulbPercentages = auditData.currentConditions.bulbPercentages || { 
      led: 30, 
      cfl: 30, 
      incandescent: 40 
    };
    
    // Efficiency values (lumens per watt)
    const efficiencyValues = {
      led: 100,
      cfl: 60,
      incandescent: 15
    };
    
    // Calculate the weighted average efficiency
    const totalPercentage = Object.values(bulbPercentages).reduce((sum, val) => sum + val, 0);
    const weightedEfficiency = totalPercentage > 0 
      ? Object.entries(bulbPercentages).reduce(
          (sum, [type, percentage]) => sum + (percentage * (efficiencyValues[type as keyof typeof efficiencyValues] || 0)),
          0
        ) / totalPercentage
      : 0;
    
    appLogger.debug('Lighting efficiency metrics', {
      bulbPercentages,
      weightedEfficiency
    });
    
    // Cast context to any to avoid Chart.js type issues
    const chart = new Chart(ctx as any, {
      type: 'bar',
      data: {
        labels: ['LED', 'CFL', 'Incandescent', 'Current Mix', 'Target (All LED)'],
        datasets: [
          {
            label: 'Efficiency (lumens/watt)',
            data: [
              efficiencyValues.led,
              efficiencyValues.cfl,
              efficiencyValues.incandescent,
              weightedEfficiency,
              efficiencyValues.led
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(16, 185, 129, 0.7)'
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(59, 130, 246)',
              'rgb(239, 68, 68)',
              'rgb(245, 158, 11)',
              'rgb(16, 185, 129)'
            ],
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
              text: 'Efficiency (lumens/watt)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Lighting Efficiency Comparison'
          },
          legend: {
            display: false
          }
        }
      }
    });
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    appLogger.error('Error generating lighting efficiency chart', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Generates a humidity levels comparison chart
 * @param auditData Energy audit data
 * @param width Chart width
 * @param height Chart height
 * @returns Buffer containing the chart image
 */
export async function generateHumidityLevelsChart(
  auditData: EnergyAuditData,
  width: number,
  height: number
): Promise<Buffer> {
  appLogger.debug('Generating humidity levels chart', { 
    chartDimensions: { width, height }
  });

  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Extract humidity data or use defaults
    const humidityData = {
      current: auditData.currentConditions.currentHumidity || 50,
      min: 30, // Recommended minimum
      max: 60, // Recommended maximum
      ideal: auditData.currentConditions.targetHumidity || 45  // Ideal humidity
    };
    
    // Determine if current humidity is outside the recommended range
    const isOutOfRange = humidityData.current < humidityData.min || humidityData.current > humidityData.max;
    
    appLogger.debug('Humidity level metrics', {
      humidityData,
      isOutOfRange
    });
    
    // Cast context to any to avoid Chart.js type issues
    const chart = new Chart(ctx as any, {
      type: 'bar',
      data: {
        labels: ['Current Humidity', 'Minimum Recommended', 'Maximum Recommended', 'Ideal'],
        datasets: [
          {
            label: 'Humidity Level (%)',
            data: [
              humidityData.current,
              humidityData.min,
              humidityData.max,
              humidityData.ideal
            ],
            backgroundColor: [
              isOutOfRange ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(34, 197, 94, 0.7)'
            ],
            borderColor: [
              isOutOfRange ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)',
              'rgb(59, 130, 246)',
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)'
            ],
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
              text: 'Humidity Level (%)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Indoor Humidity Levels'
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              afterLabel: (tooltipItem) => {
                if (tooltipItem.dataIndex === 0) {
                  return isOutOfRange 
                    ? 'Outside recommended range' 
                    : 'Within recommended range';
                }
                return '';
              }
            }
          }
        }
      }
    });
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    appLogger.error('Error generating humidity levels chart', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
