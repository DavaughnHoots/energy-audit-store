// Mobile home-specific defaults based on research data
// See mobile-home-defaults.md for detailed documentation and sources

// Helper functions to determine construction period from year built
export const getMobileHomeConstructionPeriod = (yearBuilt: number): string => {
  if (yearBuilt < 1976) return 'pre-1976';
  if (yearBuilt < 1994) return '1976-1994';
  if (yearBuilt < 2000) return '1994-2000';
  return 'post-2000';
};

// Helper functions to determine size category based on square footage
export const getMobileHomeSizeCategory = (squareFootage: number): 'small' | 'medium' | 'large' => {
  if (squareFootage < 1000) return 'small';
  if (squareFootage <= 1800) return 'medium';
  return 'large';
};

// Climate zone mappings by state (IECC climate zones)
export const climateZonesByState: Record<string, number> = {
  'AK': 7, 'AL': 3, 'AR': 3, 'AZ': 2, 'CA': 3, 'CO': 5, 'CT': 5, 'DC': 4,
  'DE': 4, 'FL': 2, 'GA': 3, 'HI': 1, 'IA': 5, 'ID': 5, 'IL': 5, 'IN': 5,
  'KS': 4, 'KY': 4, 'LA': 2, 'MA': 5, 'MD': 4, 'ME': 6, 'MI': 5, 'MN': 6,
  'MO': 4, 'MS': 3, 'MT': 6, 'NC': 3, 'ND': 6, 'NE': 5, 'NH': 6, 'NJ': 4,
  'NM': 4, 'NV': 3, 'NY': 5, 'OH': 5, 'OK': 3, 'OR': 4, 'PA': 5, 'RI': 5,
  'SC': 3, 'SD': 6, 'TN': 4, 'TX': 2, 'UT': 5, 'VA': 4, 'VT': 6, 'WA': 4,
  'WI': 6, 'WV': 5, 'WY': 6
};

// Helper function to get numeric climate zone
export const getClimateZone = (state: string): number => {
  return climateZonesByState[state.toUpperCase()] || 4; // Default to zone 4 if unknown
};

// Climate zone adjustment multipliers for energy usage (mobile homes)
export const mobileHomeClimateZoneAdjustments: Record<number, number> = {
  1: 0.85, // very hot
  2: 0.9,  // hot
  3: 0.95, // warm
  4: 1.0,  // mixed
  5: 1.05, // cool
  6: 1.15, // cold
  7: 1.25, // very cold
  8: 1.3   // subarctic
};

// Size adjustment factors for energy usage (mobile homes)
export const mobileHomeSizeAdjustments: Record<string, number> = {
  'small': 0.9,
  'medium': 1.0,
  'large': 1.1
};

// Energy usage baseline by construction period (MMBtu/yr) - mobile homes
export const mobileHomeEnergyUsageBaseline: Record<string, number> = {
  'pre-1976': 70,
  '1976-1994': 65,
  '1994-2000': 58,
  'post-2000': 52
};

// Mobile home defaults - the comprehensive set of defaults based on research
export const mobileHomeDefaults = {
  'pre-1976': {
    'small': {
      homeDetails: {
        squareFootage: 840,
        stories: 1,
        bedrooms: 2,
        bathrooms: 1,
        wallLength: 60,
        wallWidth: 14,
        ceilingHeight: 7,
        numRooms: 4,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'poor',
          walls: 'poor',
          floor: 'poor',
          basement: 'not-applicable'
        },
        windowType: 'single',
        windowCondition: 'poor',
        numWindows: 6,
        windowCount: 'few',
        airLeaks: ['major-drafts', 'visible-gaps', 'whistling'],
        weatherStripping: 'none',
        estimatedACH: 18,
        temperatureConsistency: 'large-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'electric-baseboard',
          fuel: 'electricity',
          efficiency: 100,
          age: 25
        },
        coolingSystem: {
          type: 'window-units',
          efficiency: 8,
          age: 12
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'needs-attention'
      },
      energyConsumption: {
        estimatedAnnualUsage: 70,
        energyIntensity: 85
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1050,
        stories: 1,
        bedrooms: 2,
        bathrooms: 1,
        wallLength: 70,
        wallWidth: 15,
        ceilingHeight: 7,
        numRooms: 5,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'poor',
          walls: 'poor',
          floor: 'poor',
          basement: 'not-applicable'
        },
        windowType: 'single',
        windowCondition: 'fair',
        numWindows: 8,
        windowCount: 'few',
        airLeaks: ['major-drafts', 'visible-gaps'],
        weatherStripping: 'none',
        estimatedACH: 16,
        temperatureConsistency: 'large-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'furnace',
          fuel: 'electricity',
          efficiency: 100,
          age: 22
        },
        coolingSystem: {
          type: 'window-units',
          efficiency: 8,
          age: 10
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'needs-attention'
      },
      energyConsumption: {
        estimatedAnnualUsage: 75,
        energyIntensity: 80
      }
    },
    'large': {
      // Unlikely to have large pre-1976 mobile homes, but included for completeness
      homeDetails: {
        squareFootage: 1400,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        wallLength: 70,
        wallWidth: 20,
        ceilingHeight: 7,
        numRooms: 6,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'poor',
          walls: 'poor',
          floor: 'poor',
          basement: 'not-applicable'
        },
        windowType: 'single',
        windowCondition: 'fair',
        numWindows: 10,
        windowCount: 'average',
        airLeaks: ['major-drafts', 'visible-gaps'],
        weatherStripping: 'none',
        estimatedACH: 15,
        temperatureConsistency: 'large-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'furnace',
          fuel: 'propane',
          efficiency: 65,
          age: 20
        },
        coolingSystem: {
          type: 'window-units',
          efficiency: 9,
          age: 10
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'needs-attention'
      },
      energyConsumption: {
        estimatedAnnualUsage: 80,
        energyIntensity: 75
      }
    }
  },
  '1976-1994': {
    'small': {
      homeDetails: {
        squareFootage: 980,
        stories: 1,
        bedrooms: 2,
        bathrooms: 1,
        wallLength: 70,
        wallWidth: 14,
        ceilingHeight: 7.5,
        numRooms: 5,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'below-average',
          floor: 'below-average',
          basement: 'not-applicable'
        },
        windowType: 'single',
        windowCondition: 'fair',
        numWindows: 8,
        windowCount: 'few',
        airLeaks: ['minor-drafts', 'visible-gaps'],
        weatherStripping: 'basic',
        estimatedACH: 12,
        temperatureConsistency: 'large-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'furnace',
          fuel: 'electricity',
          efficiency: 100,
          age: 18
        },
        coolingSystem: {
          type: 'window-units',
          efficiency: 9,
          age: 12
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        estimatedAnnualUsage: 65,
        energyIntensity: 78
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1200,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        wallLength: 80,
        wallWidth: 16,
        ceilingHeight: 7.5,
        numRooms: 6,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'below-average',
          floor: 'below-average',
          basement: 'not-applicable'
        },
        windowType: 'single',
        windowCondition: 'fair',
        numWindows: 10,
        windowCount: 'average',
        airLeaks: ['minor-drafts', 'visible-gaps'],
        weatherStripping: 'basic',
        estimatedACH: 12,
        temperatureConsistency: 'some-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'furnace',
          fuel: 'propane',
          efficiency: 72,
          age: 18
        },
        coolingSystem: {
          type: 'central-ac',
          efficiency: 9,
          age: 15
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        estimatedAnnualUsage: 65,
        energyIntensity: 78
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 1800,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        wallLength: 60,
        wallWidth: 30,
        ceilingHeight: 8,
        numRooms: 7,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'below-average',
          floor: 'below-average',
          basement: 'not-applicable'
        },
        windowType: 'single',
        windowCondition: 'fair',
        numWindows: 12,
        windowCount: 'average',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'foam',
        estimatedACH: 10,
        temperatureConsistency: 'some-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'furnace',
          fuel: 'propane',
          efficiency: 75,
          age: 15
        },
        coolingSystem: {
          type: 'central-ac',
          efficiency: 10,
          age: 15
        },
        thermostatType: 'programmable',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        estimatedAnnualUsage: 70,
        energyIntensity: 72
      }
    }
  },
  '1994-2000': {
    'small': {
      homeDetails: {
        squareFootage: 980,
        stories: 1,
        bedrooms: 2,
        bathrooms: 1,
        wallLength: 70,
        wallWidth: 14,
        ceilingHeight: 7.5,
        numRooms: 5,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'average',
          basement: 'not-applicable'
        },
        windowType: 'double',
        windowCondition: 'good',
        numWindows: 8,
        windowCount: 'few',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'foam',
        estimatedACH: 8,
        temperatureConsistency: 'some-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'furnace',
          fuel: 'electricity',
          efficiency: 100,
          age: 12
        },
        coolingSystem: {
          type: 'central-ac',
          efficiency: 11,
          age: 12
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        estimatedAnnualUsage: 56,
        energyIntensity: 70
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1280,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        wallLength: 80,
        wallWidth: 16,
        ceilingHeight: 8,
        numRooms: 6,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'average',
          basement: 'not-applicable'
        },
        windowType: 'double',
        windowCondition: 'good',
        numWindows: 10,
        windowCount: 'average',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'foam',
        estimatedACH: 8,
        temperatureConsistency: 'some-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 8,
          age: 12
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 12,
          age: 12
        },
        thermostatType: 'programmable',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 58,
        energyIntensity: 65
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 1920,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        wallLength: 64,
        wallWidth: 30,
        ceilingHeight: 8,
        numRooms: 8,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'average',
          basement: 'not-applicable'
        },
        windowType: 'double',
        windowCondition: 'good',
        numWindows: 12,
        windowCount: 'average',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'foam',
        estimatedACH: 7,
        temperatureConsistency: 'some-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 8,
          age: 12
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 12,
          age: 12
        },
        thermostatType: 'programmable',
        zoneCount: 2,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 60,
        energyIntensity: 65
      }
    }
  },
  'post-2000': {
    'small': {
      homeDetails: {
        squareFootage: 980,
        stories: 1,
        bedrooms: 2,
        bathrooms: 1,
        wallLength: 70,
        wallWidth: 14,
        ceilingHeight: 8,
        numRooms: 5,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'not-applicable'
        },
        windowType: 'double',
        windowCondition: 'good',
        numWindows: 8,
        windowCount: 'few',
        airLeaks: ['none'],
        weatherStripping: 'foam',
        estimatedACH: 5,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 9,
          age: 7
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 14,
          age: 7
        },
        thermostatType: 'programmable',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 48,
        energyIntensity: 60
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1280,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        wallLength: 80,
        wallWidth: 16,
        ceilingHeight: 8,
        numRooms: 6,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'not-applicable'
        },
        windowType: 'double',
        windowCondition: 'excellent',
        numWindows: 10,
        windowCount: 'average',
        airLeaks: ['none'],
        weatherStripping: 'foam',
        estimatedACH: 5,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 9,
          age: 7
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 14,
          age: 7
        },
        thermostatType: 'programmable',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 52,
        energyIntensity: 55
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 2000,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        wallLength: 70,
        wallWidth: 28,
        ceilingHeight: 8,
        numRooms: 8,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'not-applicable'
        },
        windowType: 'double',
        windowCondition: 'good',
        numWindows: 14,
        windowCount: 'average',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'foam',
        estimatedACH: 6,
        temperatureConsistency: 'very-consistent'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat-pump',
          fuel: 'electricity',
          efficiency: 9,
          age: 7
        },
        coolingSystem: {
          type: 'heat-pump',
          efficiency: 14,
          age: 7
        },
        thermostatType: 'programmable',
        zoneCount: 2,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        estimatedAnnualUsage: 52,
        energyIntensity: 50
      }
    }
  }
};

// Main function to get mobile home defaults based on year built and square footage
export const getMobileHomeDefaults = (yearBuilt: number, squareFootage: number, state?: string) => {
  const constructionPeriod = getMobileHomeConstructionPeriod(yearBuilt);
  const sizeCategory = getMobileHomeSizeCategory(squareFootage);
  
  // Get base defaults
  const defaults = mobileHomeDefaults[constructionPeriod as keyof typeof mobileHomeDefaults][sizeCategory];
  
  // Calculate climate-adjusted energy usage if state is provided
  if (state) {
    const climateZone = getClimateZone(state);
    const climateAdjustment = mobileHomeClimateZoneAdjustments[climateZone] || 1.0;
    const sizeAdjustment = mobileHomeSizeAdjustments[sizeCategory] || 1.0;
    const baseEnergyUsage = mobileHomeEnergyUsageBaseline[constructionPeriod] || 58; // Default to average if not found
    
    // Calculate adjusted energy usage
    const adjustedEnergyUsage = Math.round(baseEnergyUsage * climateAdjustment * sizeAdjustment);
    
    // Update energy consumption values
    defaults.energyConsumption.estimatedAnnualUsage = adjustedEnergyUsage;
  }
  
  return defaults;
};
