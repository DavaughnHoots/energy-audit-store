/**
 * Service for providing explanations and context for HVAC metrics
 */
export class HvacMetricsExplanationService {
  /**
   * Get tiered explanations for HVAC metrics
   */
  public getHvacExplanations(includeAdvanced: boolean = false): {
    simple: Record<string, string>;
    advanced?: Record<string, string>;
  } {
    const explanations = {
      simple: {
        cooling: "Cooling efficiency (SEER): Higher numbers mean more efficient cooling. Modern systems range from 13-25, with 15+ being energy efficient.",
        heating: "Heating efficiency: For heat pumps (HSPF): 8-10 is typical, higher is better. For furnaces (AFUE): 80-98%, with 90%+ being high efficiency.",
        tempDifference: "Temperature difference: How much your system cools or heats the air as it passes through. Proper values indicate a well-functioning system."
      },
      advanced: {
        cooling: "SEER (Seasonal Energy Efficiency Ratio): Measures cooling output during a typical cooling season divided by energy used in watt-hours. Federal minimum is 13 SEER (14 in southern regions), with ENERGY STAR certification at 15+. Each 1-point SEER increase typically reduces energy use by 7-8%.",
        heating: "Heat pumps use HSPF (Heating Seasonal Performance Factor), with federal minimum of 8.2 and ENERGY STAR at 8.5+. Gas furnaces use AFUE (Annual Fuel Utilization Efficiency), which represents the percentage of fuel converted to heat. Federal minimum is 80% AFUE, with high-efficiency units at 90-98% AFUE.",
        tempDifference: "Delta-T (temperature differential): For cooling, ideal range is 14-22°F between return and supply air. For heating, ideal range is 25-30°F. Values outside these ranges may indicate improper refrigerant charge, airflow issues, or sizing problems.",
        technicalDetails: "EER (Energy Efficiency Ratio) measures efficiency at a specific temperature, while SEER measures performance over a season. COP (Coefficient of Performance) measures heat energy transferred per unit of input energy. For electric resistance heating, COP=1; heat pumps typically have COP of 2-4 depending on outdoor temperatures."
      }
    };
    
    // If advanced explanations not requested, remove them
    if (!includeAdvanced) {
      return {
        simple: explanations.simple
      };
    }
    
    return explanations;
  }
  
  /**
   * Get regional HVAC standards based on location
   */
  public getRegionalStandards(state: string): {
    cooling: { minSeer: number, energyStar: number };
    heating: { minHspf: number, minAfue: number, energyStar: { hspf: number, afue: number } };
  } {
    // Get region based on state
    const region = this.getRegionForState(state);
    
    // Return standards for the region
    return this.getStandardsByRegion(region);
  }
  
  /**
   * Get efficiency rating and description for cooling system
   */
  public getCoolingEfficiencyRating(
    systemType: string,
    seerValue: number
  ): {
    classification: string;
    color: string;
    description: string;
  } {
    // Ensure valid value
    if (!seerValue || isNaN(seerValue) || seerValue <= 0) {
      return {
        classification: 'Unknown',
        color: '#999999',
        description: 'Efficiency data not available'
      };
    }
    
    // Rating thresholds - adjust by system type
    let ratings: {[key: string]: number} = {
      'Excellent': 18,  // 18+ SEER
      'Good': 15,       // 15-17.9 SEER
      'Average': 13,    // 13-14.9 SEER
      'Poor': 10,       // 10-12.9 SEER
      'Very Poor': 0    // Below 10 SEER
    };
    
    // Adjust thresholds for different system types
    if (systemType.toLowerCase().includes('mini-split')) {
      // Mini-splits generally have higher efficiency
      ratings = {
        'Excellent': 20, // 20+ SEER
        'Good': 17,      // 17-19.9 SEER
        'Average': 15,   // 15-16.9 SEER
        'Poor': 13,      // 13-14.9 SEER
        'Very Poor': 0   // Below 13 SEER
      };
    }
    
    // Determine classification based on value
    let classification: string = 'Unknown';
    for (const [rating, threshold] of Object.entries(ratings)) {
      if (seerValue >= threshold) {
        classification = rating;
        break;
      }
    }
    
    // Get color and description based on classification
    const colors: {[key: string]: string} = {
      'Excellent': '#008800',
      'Good': '#669900',
      'Average': '#CC9900',
      'Poor': '#CC4400',
      'Very Poor': '#CC0000',
      'Unknown': '#999999'
    };
    
    const descriptions: {[key: string]: string} = {
      'Excellent': `High-efficiency system (${seerValue} SEER). Exceeds ENERGY STAR requirements.`,
      'Good': `Good efficiency system (${seerValue} SEER). Meets ENERGY STAR requirements.`,
      'Average': `Standard efficiency system (${seerValue} SEER). Meets minimum federal standards.`,
      'Poor': `Low efficiency system (${seerValue} SEER). Below current federal standards.`,
      'Very Poor': `Very inefficient system (${seerValue} SEER). Significantly below standards.`,
      'Unknown': 'Efficiency rating unknown'
    };
    
    // Return complete rating data
    return {
      classification,
      color: colors[classification] || colors.Unknown,
      description: descriptions[classification] || descriptions.Unknown
    };
  }
  
  /**
   * Get efficiency rating and description for heating system
   */
  public getHeatingEfficiencyRating(
    systemType: string,
    efficiencyValue: number
  ): {
    classification: string;
    color: string;
    description: string;
  } {
    // Ensure valid value
    if (!efficiencyValue || isNaN(efficiencyValue) || efficiencyValue <= 0) {
      return {
        classification: 'Unknown',
        color: '#999999',
        description: 'Efficiency data not available'
      };
    }
    
    // Check if this is a heat pump (using HSPF) or furnace (using AFUE)
    const isHeatPump = systemType.toLowerCase().includes('heat pump');
    
    let classification: string = 'Unknown';
    
    // Rating for heat pumps (HSPF)
    if (isHeatPump) {
      // HSPF ratings typically range from 7-10+
      if (efficiencyValue >= 10) {
        classification = 'Excellent';
      } else if (efficiencyValue >= 9) {
        classification = 'Good';
      } else if (efficiencyValue >= 8.2) {
        classification = 'Average';
      } else if (efficiencyValue >= 7) {
        classification = 'Poor';
      } else {
        classification = 'Very Poor';
      }
    } 
    // Rating for furnaces (AFUE)
    else {
      // AFUE is usually expressed as a percentage (80-98%)
      // If the value is very high (like 250), it might be using different units
      if (efficiencyValue > 100) {
        // Normalize the value if it's likely in different units
        const normalizedValue = 
          efficiencyValue > 1000 ? (efficiencyValue / 1000) : 
          efficiencyValue > 100 ? (efficiencyValue / 100) : 
          efficiencyValue;
        
        // Recurse with normalized value
        return this.getHeatingEfficiencyRating(systemType, normalizedValue);
      }
      
      // Standard AFUE classification
      if (efficiencyValue >= 95) {
        classification = 'Excellent';
      } else if (efficiencyValue >= 90) {
        classification = 'Good';
      } else if (efficiencyValue >= 80) {
        classification = 'Average';
      } else if (efficiencyValue >= 70) {
        classification = 'Poor';
      } else {
        classification = 'Very Poor';
      }
    }
    
    // Get color and description based on classification
    const colors: {[key: string]: string} = {
      'Excellent': '#008800',
      'Good': '#669900',
      'Average': '#CC9900',
      'Poor': '#CC4400',
      'Very Poor': '#CC0000',
      'Unknown': '#999999'
    };
    
    // Create appropriate description based on system type
    let description: string;
    if (isHeatPump) {
      const descriptions: {[key: string]: string} = {
        'Excellent': `High-efficiency heat pump (${efficiencyValue} HSPF). Exceeds ENERGY STAR requirements.`,
        'Good': `Good efficiency heat pump (${efficiencyValue} HSPF). Meets ENERGY STAR requirements.`,
        'Average': `Standard efficiency heat pump (${efficiencyValue} HSPF). Meets federal standards.`,
        'Poor': `Low efficiency heat pump (${efficiencyValue} HSPF). Below current standards.`,
        'Very Poor': `Very inefficient heat pump (${efficiencyValue} HSPF). Replacement recommended.`,
        'Unknown': 'Efficiency rating unknown'
      };
      description = descriptions[classification] || descriptions.Unknown;
    } else {
      const descriptions: {[key: string]: string} = {
        'Excellent': `High-efficiency furnace (${efficiencyValue}% AFUE). Qualifies for rebates.`,
        'Good': `Good efficiency furnace (${efficiencyValue}% AFUE). Meets ENERGY STAR requirements.`,
        'Average': `Standard efficiency furnace (${efficiencyValue}% AFUE). Meets minimum standards.`,
        'Poor': `Low efficiency furnace (${efficiencyValue}% AFUE). Below current standards.`,
        'Very Poor': `Very inefficient furnace (${efficiencyValue}% AFUE). Replacement recommended.`,
        'Unknown': 'Efficiency rating unknown'
      };
      description = descriptions[classification] || descriptions.Unknown;
    }
    
    // Return complete rating data
    return {
      classification,
      color: colors[classification] || colors.Unknown,
      description
    };
  }
  
  /**
   * Format efficiency value based on system type
   */
  public formatEfficiencyValue(systemType: string | undefined, value: number | undefined): string {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    
    const type = (systemType || '').toLowerCase();
    
    // Format based on system type
    if (type.includes('heat pump')) {
      return `${value.toFixed(1)} HSPF`;
    } else if (type.includes('furnace') || type.includes('boiler')) {
      // Check if value is already in percentage format
      if (value <= 1) {
        return `${(value * 100).toFixed(0)}% AFUE`;
      } else if (value <= 100) {
        return `${value.toFixed(0)}% AFUE`;
      } else {
        // Value may be in unusual units - try to normalize
        const normalizedValue = value > 1000 ? value / 1000 : value / 100;
        return `${normalizedValue.toFixed(0)}% AFUE (normalized)`;
      }
    } else if (type.includes('central-ac') || type.includes('mini-split') || type.includes('air conditioner')) {
      return `${value.toFixed(1)} SEER`;
    }
    
    // Generic format for unknown types
    return value.toString();
  }
  
  /**
   * Get target efficiency rating for comparison
   */
  public getTargetEfficiency(systemType: 'heating' | 'cooling', equipmentType?: string): number {
    // Energy Star levels make good targets
    if (systemType === 'heating') {
      const type = (equipmentType || '').toLowerCase();
      if (type.includes('heat pump')) {
        return 9.0; // HSPF target for heat pumps
      } else if (type.includes('furnace')) {
        return 90; // AFUE target for furnaces
      } else {
        return 90; // Default heating target
      }
    } else {
      const type = (equipmentType || '').toLowerCase();
      if (type.includes('mini-split')) {
        return 18; // SEER target for mini-splits
      } else {
        return 16; // SEER target for central AC
      }
    }
  }
  
  /**
   * Get climate region for a state
   */
  private getRegionForState(state: string): 'north' | 'south' | 'southwest' | 'default' {
    const northStates = ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'OH', 'IN', 'IL', 
                      'MI', 'WI', 'MN', 'IA', 'ND', 'SD', 'MT', 'WY', 'ID', 'WA', 'OR', 'AK'];
    
    const southStates = ['DE', 'MD', 'DC', 'VA', 'WV', 'KY', 'TN', 'NC', 'SC', 'GA', 'AL', 'MS', 
                       'FL', 'LA', 'AR', 'MO', 'KS', 'OK', 'TX'];
    
    const southwestStates = ['NM', 'AZ', 'NV', 'CA', 'CO', 'UT', 'HI'];
    
    const stateCode = state.toUpperCase();
    
    if (northStates.includes(stateCode)) {
      return 'north';
    } else if (southStates.includes(stateCode)) {
      return 'south';
    } else if (southwestStates.includes(stateCode)) {
      return 'southwest';
    } else {
      return 'default';
    }
  }
  
  /**
   * Get HVAC standards for a specific region
   */
  private getStandardsByRegion(region: 'north' | 'south' | 'southwest' | 'default'): {
    cooling: { minSeer: number, energyStar: number };
    heating: { minHspf: number, minAfue: number, energyStar: { hspf: number, afue: number } };
  } {
    switch (region) {
      case 'north':
        return {
          cooling: {
            minSeer: 13,
            energyStar: 15
          },
          heating: {
            minHspf: 8.2,
            minAfue: 80,
            energyStar: {
              hspf: 8.5,
              afue: 90
            }
          }
        };
      
      case 'south':
      case 'southwest':
        return {
          cooling: {
            minSeer: 14,
            energyStar: 15
          },
          heating: {
            minHspf: 8.2,
            minAfue: 80,
            energyStar: {
              hspf: 8.5,
              afue: 90
            }
          }
        };
      
      default:
        return {
          cooling: {
            minSeer: 13,
            energyStar: 15
          },
          heating: {
            minHspf: 8.2,
            minAfue: 80,
            energyStar: {
              hspf: 8.5,
              afue: 90
            }
          }
        };
    }
  }
}

export default HvacMetricsExplanationService;
