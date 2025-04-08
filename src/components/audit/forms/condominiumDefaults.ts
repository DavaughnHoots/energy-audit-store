// Condominium-specific defaults based on research data
// See the research documentation for details and sources

// Import climate zone types from a new types file to avoid circular dependencies
// Previously imported from housingTypeDefaults.ts which created a circular reference

// Define climate zone mappings here to avoid circular imports
const climateZonesByState: Record<string, number> = {
  'AK': 7, 'AL': 3, 'AR': 3, 'AZ': 2, 'CA': 3, 'CO': 5, 'CT': 5, 'DC': 4,
  'DE': 4, 'FL': 2, 'GA': 3, 'HI': 1, 'IA': 5, 'ID': 5, 'IL': 5, 'IN': 5,
  'KS': 4, 'KY': 4, 'LA': 2, 'MA': 5, 'MD': 4, 'ME': 6, 'MI': 5, 'MN': 6,
  'MO': 4, 'MS': 3, 'MT': 6, 'NC': 3, 'ND': 6, 'NE': 5, 'NH': 6, 'NJ': 4,
  'NM': 4, 'NV': 3, 'NY': 5, 'OH': 5, 'OK': 3, 'OR': 4, 'PA': 5, 'RI': 5,
  'SC': 3, 'SD': 6, 'TN': 4, 'TX': 2, 'UT': 5, 'VA': 4, 'VT': 6, 'WA': 4,
  'WI': 6, 'WV': 5, 'WY': 6
};

// Helper function to get numeric climate zone
const getClimateZone = (state: string): number => {
  return climateZonesByState[state.toUpperCase()] || 4; // Default to zone 4 if unknown
};

// Helper function to get state from zone (placeholder)
const getStateFromZone = (zone: number): string => {
  return 'TX'; // Default to something reasonable
};

// Map numeric IECC climate zones to descriptive zones
const getDescriptiveClimateZone = (numericZone: number): 'cold-very-cold' | 'mixed-humid' | 'hot-humid' | 'hot-dry-mixed-dry' => {
  if (numericZone >= 5) return 'cold-very-cold';      // Zones 5-8
  if (numericZone === 4 || 
     (numericZone === 3 && ['AL', 'AR', 'GA', 'KY', 'LA', 'MS', 'NC', 'OK', 'SC', 'TN', 'TX', 'VA'].includes(getStateFromZone(numericZone)))) {
    return 'mixed-humid';                           // Zone 4A and parts of 3A (Eastern states)
  }
  if (numericZone <= 2 && ['FL', 'HI', 'LA', 'TX'].includes(getStateFromZone(numericZone))) {
    return 'hot-humid';                             // Zones 1A & 2A
  }
  return 'hot-dry-mixed-dry';                       // Zones 2B, 3B, 4B
};

// Helper functions to determine construction period from year built
export const getCondominiumConstructionPeriod = (yearBuilt: number): string => {
  if (yearBuilt < 1980) return 'pre-1980';
  if (yearBuilt < 2000) return '1980-2000';
  return 'post-2000';
};

// Helper functions to determine size category based on square footage
export const getCondominiumSizeCategory = (squareFootage: number): 'small' | 'medium' | 'large' => {
  if (squareFootage < 900) return 'small';
  if (squareFootage <= 1500) return 'medium';
  return 'large';
};

// Helper function to determine unit position
export const getCondominiumUnitPosition = (position?: string): 'interior' | 'corner' | 'top-floor' => {
  if (position === 'corner') return 'corner';
  if (position === 'top-floor') return 'top-floor';
  return 'interior'; // Default to interior unit
};

// Size adjustment factors for energy usage
export const condominiumSizeAdjustments: Record<string, number> = {
  'small': 0.8,
  'medium': 1.0,
  'large': 1.2
};

// Unit position adjustment factors for energy usage
export const condominiumPositionAdjustments: Record<string, number> = {
  'interior': 1.0,    // Baseline
  'corner': 1.15,     // ~15% higher energy usage than interior units due to more exterior walls
  'top-floor': 1.12   // ~12% higher energy usage than interior units due to roof exposure
};

// Climate zone adjustment multipliers for energy usage
export const condominiumClimateZoneAdjustments: Record<string, number> = {
  'cold-very-cold': 1.2,
  'mixed-humid': 1.0,
  'hot-humid': 0.9, 
  'hot-dry-mixed-dry': 0.95
};

// Energy usage baseline by construction period (MMBtu/yr)
export const condominiumEnergyUsageBaseline: Record<string, number> = {
  'pre-1980': 48,     // Lower than townhouses/single-family due to shared walls/floors/ceilings
  '1980-2000': 40,    // Better insulation and more efficient systems
  'post-2000': 36     // Modern code requirements and high-efficiency systems
};

// Define the condominium defaults structure
export const condominiumDefaults = {
  'pre-1980': {
    'small': {
      homeDetails: {
        squareFootage: 750,
        stories: 1,
        bedrooms: 1,
        bathrooms: 1,
        ceilingHeight: 8,
        numRooms: 3,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'below-average',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'single-with-storm',
        windowCondition: 'fair',
        numWindows: 5,
        windowCount: 'few',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'minimal',
        estimatedACH: 8,
        temperatureConsistency: 'some-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'electric-baseboard',
          fuel: 'electricity',
          efficiency: 100,
          age: 20
        },
        coolingSystem: {
          type: 'window-units',
          efficiency: 8,
          age: 10
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        estimatedAnnualUsage: 48,
        energyIntensity: 64,
        heatingPct: 45,
        coolingPct: 15
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1100,
        stories: 1,
        bedrooms: 2,
        bathrooms: 1.5,
        ceilingHeight: 8,
        numRooms: 5,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'below-average',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'single-with-storm',
        windowCondition: 'fair',
        numWindows: 7,
        windowCount: 'few',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'minimal',
        estimatedACH: 8,
        temperatureConsistency: 'some-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'wall-unit',
          fuel: 'natural-gas',
          efficiency: 70,
          age: 15
        },
        coolingSystem: {
          type: 'window-units',
          efficiency: 8,
          age: 10
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        estimatedAnnualUsage: 55,
        energyIntensity: 50,
        heatingPct: 45,
        coolingPct: 15
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 1800,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        ceilingHeight: 8,
        numRooms: 7,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'average',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'single-with-storm',
        windowCondition: 'fair',
        numWindows: 10,
        windowCount: 'average',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'minimal',
        estimatedACH: 7,
        temperatureConsistency: 'some-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'boiler-radiator',
          fuel: 'natural-gas',
          efficiency: 70,
          age: 15
        },
        coolingSystem: {
          type: 'window-units',
          efficiency: 9,
          age: 10
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        estimatedAnnualUsage: 65,
        energyIntensity: 36,
        heatingPct: 40,
        coolingPct: 20
      }
    }
  },
  '1980-2000': {
    'small': {
      homeDetails: {
        squareFootage: 750,
        stories: 1,
        bedrooms: 1,
        bathrooms: 1,
        ceilingHeight: 8,
        numRooms: 3,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'average',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'double-clear',
        windowCondition: 'good',
        numWindows: 5,
        windowCount: 'few',
        airLeaks: ['none'],
        weatherStripping: 'basic',
        estimatedACH: 5,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 8,
          age: 10
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 11,
          age: 10
        },
        thermostatType: 'programmable',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 36,
        energyIntensity: 48,
        heatingPct: 35,
        coolingPct: 25
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1200,
        stories: 1,
        bedrooms: 2,
        bathrooms: 2,
        ceilingHeight: 9,
        numRooms: 5,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'average',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'double-clear',
        windowCondition: 'good',
        numWindows: 8,
        windowCount: 'average',
        airLeaks: ['none'],
        weatherStripping: 'foam',
        estimatedACH: 4,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 8.5,
          age: 8
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 12,
          age: 8
        },
        thermostatType: 'programmable',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 42,
        energyIntensity: 35,
        heatingPct: 35,
        coolingPct: 25
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 1800,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        ceilingHeight: 9,
        numRooms: 7,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'good',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'double-clear',
        windowCondition: 'good',
        numWindows: 10,
        windowCount: 'average',
        airLeaks: ['none'],
        weatherStripping: 'foam',
        estimatedACH: 4,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 9,
          age: 8
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 13,
          age: 8
        },
        thermostatType: 'programmable',
        zoneCount: 2,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 48,
        energyIntensity: 27,
        heatingPct: 35,
        coolingPct: 30
      }
    }
  },
  'post-2000': {
    'small': {
      homeDetails: {
        squareFootage: 800,
        stories: 1,
        bedrooms: 1,
        bathrooms: 1,
        ceilingHeight: 9,
        numRooms: 3,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'good',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'double-low-e',
        windowCondition: 'excellent',
        numWindows: 5,
        windowCount: 'few',
        airLeaks: ['none'],
        weatherStripping: 'foam',
        estimatedACH: 2,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 10,
          age: 5
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 16,
          age: 5
        },
        thermostatType: 'smart',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 32,
        energyIntensity: 40,
        heatingPct: 30,
        coolingPct: 30
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1200,
        stories: 1,
        bedrooms: 2,
        bathrooms: 2,
        ceilingHeight: 9,
        numRooms: 5,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'good',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'double-low-e',
        windowCondition: 'excellent',
        numWindows: 8,
        windowCount: 'average',
        airLeaks: ['none'],
        weatherStripping: 'foam',
        estimatedACH: 2,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 10,
          age: 5
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 17,
          age: 5
        },
        thermostatType: 'smart',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 36,
        energyIntensity: 30,
        heatingPct: 30,
        coolingPct: 35
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 1800,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2.5,
        ceilingHeight: 10,
        numRooms: 7,
        homeType: 'condominium'
      },
      currentConditions: {
        insulation: {
          attic: 'not-applicable',
          walls: 'good',
          floor: 'not-applicable',
          basement: 'not-applicable'
        },
        windowType: 'double-low-e',
        windowCondition: 'excellent',
        numWindows: 12,
        windowCount: 'average',
        airLeaks: ['none'],
        weatherStripping: 'foam',
        estimatedACH: 2,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 11,
          age: 3
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 18,
          age: 3
        },
        thermostatType: 'smart',
        zoneCount: 2,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 40,
        energyIntensity: 22,
        heatingPct: 30,
        coolingPct: 35
      }
    }
  }
};

// Main function to get condominium defaults based on year built, square footage, and unit position
export const getCondominiumDefaults = (yearBuilt: number, squareFootage: number, state?: string, unitPosition: string = 'interior') => {
  const constructionPeriod = getCondominiumConstructionPeriod(yearBuilt);
  const sizeCategory = getCondominiumSizeCategory(squareFootage);
  const position = getCondominiumUnitPosition(unitPosition);
  
  // Get base defaults
  const defaults = JSON.parse(JSON.stringify(condominiumDefaults[constructionPeriod as keyof typeof condominiumDefaults][sizeCategory]));
  
  // Add unit position to home details
  defaults.homeDetails.unitPosition = position;
  
  // Calculate climate-adjusted energy usage if state is provided
  if (state) {
    const numericZone = getClimateZone(state);
    const descriptiveZone = getDescriptiveClimateZone(numericZone);
    const climateAdjustment = condominiumClimateZoneAdjustments[descriptiveZone] || 1.0;
    const sizeAdjustment = condominiumSizeAdjustments[sizeCategory] || 1.0;
    const positionAdjustment = condominiumPositionAdjustments[position] || 1.0;
    const baseEnergyUsage = condominiumEnergyUsageBaseline[constructionPeriod] || 40; // Default to average if not found
    
    // Calculate adjusted energy usage with all factors
    const adjustedEnergyUsage = Math.round(baseEnergyUsage * climateAdjustment * sizeAdjustment * positionAdjustment);
    
    // Update energy consumption values
    defaults.energyConsumption.estimatedAnnualUsage = adjustedEnergyUsage;
  }
  
  return defaults;
};
