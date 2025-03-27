// Duplex-specific defaults based on research data
// See duplex-defaults.md for detailed documentation and sources

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
export const getDuplexConstructionPeriod = (yearBuilt: number): string => {
  if (yearBuilt < 1980) return 'pre-1980';
  if (yearBuilt < 2000) return '1980-2000';
  return 'post-2000';
};

// Helper functions to determine size category based on square footage
export const getDuplexSizeCategory = (squareFootage: number): 'small' | 'medium' | 'large' => {
  if (squareFootage < 1500) return 'small';
  if (squareFootage <= 2500) return 'medium';
  return 'large';
};

// Helper function to determine duplex unit configuration type
export const getDuplexUnitConfiguration = (
  configuration?: string
): 'side-by-side' | 'stacked' | 'front-to-back' => {
  if (configuration === 'stacked') return 'stacked';
  if (configuration === 'front-to-back') return 'front-to-back';
  return 'side-by-side'; // Default to side-by-side unit
};

// Size adjustment factors for energy usage
export const duplexSizeAdjustments: Record<string, number> = {
  'small': 0.9,
  'medium': 1.0,
  'large': 1.2
};

// Unit configuration adjustment factors for energy usage
export const duplexConfigurationAdjustments: Record<string, number> = {
  'side-by-side': 1.0,    // Baseline
  'stacked': 0.95,        // 5% less energy due to less exterior wall exposure
  'front-to-back': 1.05   // 5% more energy due to more exterior wall exposure
};

// Climate zone adjustment multipliers for energy usage
export const duplexClimateZoneAdjustments: Record<string, number> = {
  'cold-very-cold': 1.2,
  'mixed-humid': 1.0,
  'hot-humid': 0.9, 
  'hot-dry-mixed-dry': 0.95
};

// Energy usage baseline by construction period and unit configuration (MMBtu/yr) - medium size baseline
export const duplexEnergyUsageBaseline: Record<string, Record<string, number>> = {
  'pre-1980': {
    'side-by-side': 75,
    'stacked': 70,
    'front-to-back': 78
  },
  '1980-2000': {
    'side-by-side': 55,
    'stacked': 52,
    'front-to-back': 58
  },
  'post-2000': {
    'side-by-side': 40,
    'stacked': 38,
    'front-to-back': 42
  }
};

// Define the duplex defaults structure
export const duplexDefaults = {
  'pre-1980': {
    'small': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 1200,
          stories: 2,
          bedrooms: 2,
          bathrooms: 1.5,
          ceilingHeight: 8,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'poor',
            floor: 'poor',
            basement: 'none',
            sharedWall: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 8,
          windowCount: 'few',
          airLeaks: ['major-drafts', 'attic-bypasses', 'rim-joist-leakage'],
          weatherStripping: 'minimal',
          estimatedACH: 12,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 25
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
          estimatedAnnualUsage: 60,
          energyIntensity: 50,
          heatingPct: 55,
          coolingPct: 10
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 1200,
          stories: 1,
          bedrooms: 2,
          bathrooms: 1,
          ceilingHeight: 8,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'poor',
            floor: 'poor',
            basement: 'none',
            sharedFloor: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 6,
          windowCount: 'few',
          airLeaks: ['major-drafts', 'visible-gaps'],
          weatherStripping: 'minimal',
          estimatedACH: 12,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 25
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
          energyIntensity: 46,
          heatingPct: 50,
          coolingPct: 10
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 1200,
          stories: 1,
          bedrooms: 2,
          bathrooms: 1,
          ceilingHeight: 8,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'poor',
            floor: 'poor',
            basement: 'none',
            sharedWall: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 7,
          windowCount: 'few',
          airLeaks: ['major-drafts', 'visible-gaps'],
          weatherStripping: 'minimal',
          estimatedACH: 12,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 25
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
          estimatedAnnualUsage: 63,
          energyIntensity: 53,
          heatingPct: 55,
          coolingPct: 10
        }
      }
    },
    'medium': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 1800,
          stories: 2,
          bedrooms: 3,
          bathrooms: 2,
          ceilingHeight: 8,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'below-average',
            floor: 'below-average',
            basement: 'none',
            sharedWall: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 12,
          windowCount: 'average',
          airLeaks: ['major-drafts', 'attic-bypasses'],
          weatherStripping: 'minimal',
          estimatedACH: 10,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 20
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
          estimatedAnnualUsage: 75,
          energyIntensity: 42,
          heatingPct: 55,
          coolingPct: 10
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 1800,
          stories: 1,
          bedrooms: 3,
          bathrooms: 2,
          ceilingHeight: 8,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'below-average',
            floor: 'below-average',
            basement: 'none',
            sharedFloor: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 10,
          windowCount: 'average',
          airLeaks: ['major-drafts', 'visible-gaps'],
          weatherStripping: 'minimal',
          estimatedACH: 10,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 20
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
          estimatedAnnualUsage: 70,
          energyIntensity: 39,
          heatingPct: 55,
          coolingPct: 10
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 1800,
          stories: 2,
          bedrooms: 3,
          bathrooms: 2,
          ceilingHeight: 8,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'below-average',
            floor: 'below-average',
            basement: 'none',
            sharedWall: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 12,
          windowCount: 'average',
          airLeaks: ['major-drafts', 'visible-gaps'],
          weatherStripping: 'minimal',
          estimatedACH: 10,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 20
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
          estimatedAnnualUsage: 78,
          energyIntensity: 43,
          heatingPct: 55,
          coolingPct: 10
        }
      }
    },
    'large': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 2800,
          stories: 3,
          bedrooms: 4,
          bathrooms: 2.5,
          ceilingHeight: 8,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'below-average',
            floor: 'below-average',
            basement: 'none',
            sharedWall: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 16,
          windowCount: 'many',
          airLeaks: ['major-drafts', 'visible-gaps'],
          weatherStripping: 'minimal',
          estimatedACH: 12,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 20
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 8,
            age: 15
          },
          thermostatType: 'manual',
          zoneCount: 1,
          systemPerformance: 'needs-attention'
        },
        energyConsumption: {
          estimatedAnnualUsage: 110,
          energyIntensity: 39,
          heatingPct: 55,
          coolingPct: 15
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 2800,
          stories: 2,
          bedrooms: 4,
          bathrooms: 2.5,
          ceilingHeight: 8,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'below-average',
            floor: 'below-average',
            basement: 'none',
            sharedFloor: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 14,
          windowCount: 'many',
          airLeaks: ['major-drafts', 'visible-gaps'],
          weatherStripping: 'minimal',
          estimatedACH: 12,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 20
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 8,
            age: 15
          },
          thermostatType: 'manual',
          zoneCount: 1,
          systemPerformance: 'needs-attention'
        },
        energyConsumption: {
          estimatedAnnualUsage: 105,
          energyIntensity: 38,
          heatingPct: 55,
          coolingPct: 15
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 2800,
          stories: 3,
          bedrooms: 4,
          bathrooms: 2.5,
          ceilingHeight: 8,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'below-average',
            walls: 'below-average',
            floor: 'below-average',
            basement: 'none',
            sharedWall: 'minimal'
          },
          windowType: 'single-with-storm',
          windowCondition: 'fair',
          numWindows: 16,
          windowCount: 'many',
          airLeaks: ['major-drafts', 'visible-gaps'],
          weatherStripping: 'minimal',
          estimatedACH: 12,
          temperatureConsistency: 'large-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 65,
            age: 20
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 8,
            age: 15
          },
          thermostatType: 'manual',
          zoneCount: 1,
          systemPerformance: 'needs-attention'
        },
        energyConsumption: {
          estimatedAnnualUsage: 115,
          energyIntensity: 41,
          heatingPct: 55,
          coolingPct: 15
        }
      }
    }
  },
  '1980-2000': {
    'small': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 1200,
          stories: 2,
          bedrooms: 2,
          bathrooms: 1.5,
          ceilingHeight: 8,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedWall: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 8,
          windowCount: 'average',
          airLeaks: ['minor-drafts'],
          weatherStripping: 'basic',
          estimatedACH: 6,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 80,
            age: 15
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 10,
            age: 15
          },
          thermostatType: 'programmable',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 45,
          energyIntensity: 38,
          heatingPct: 45,
          coolingPct: 15
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 1200,
          stories: 1,
          bedrooms: 2,
          bathrooms: 1.5,
          ceilingHeight: 8,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedFloor: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 6,
          windowCount: 'few',
          airLeaks: ['minor-drafts'],
          weatherStripping: 'basic',
          estimatedACH: 6,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 80,
            age: 15
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 10,
            age: 15
          },
          thermostatType: 'programmable',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 42,
          energyIntensity: 35,
          heatingPct: 45,
          coolingPct: 15
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 1200,
          stories: 2,
          bedrooms: 2,
          bathrooms: 1.5,
          ceilingHeight: 8,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedWall: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 7,
          windowCount: 'few',
          airLeaks: ['minor-drafts'],
          weatherStripping: 'basic',
          estimatedACH: 6,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 80,
            age: 15
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 10,
            age: 15
          },
          thermostatType: 'programmable',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 47,
          energyIntensity: 39,
          heatingPct: 45,
          coolingPct: 15
        }
      }
    },
    'medium': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 1800,
          stories: 2,
          bedrooms: 3,
          bathrooms: 2.5,
          ceilingHeight: 8,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedWall: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 12,
          windowCount: 'average',
          airLeaks: ['minor-drafts', 'duct-leakage'],
          weatherStripping: 'basic',
          estimatedACH: 6,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 80,
            age: 15
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 10,
            age: 15
          },
          thermostatType: 'programmable',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 55,
          energyIntensity: 31,
          heatingPct: 45,
          coolingPct: 20
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 1800,
          stories: 1,
          bedrooms: 3,
          bathrooms: 2,
          ceilingHeight: 8,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedFloor: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 10,
          windowCount: 'average',
          airLeaks: ['minor-drafts'],
          weatherStripping: 'basic',
          estimatedACH: 6,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 80,
            age: 15
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 10,
            age: 15
          },
          thermostatType: 'programmable',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 52,
          energyIntensity: 29,
          heatingPct: 45,
          coolingPct: 20
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 1800,
          stories: 2,
          bedrooms: 3,
          bathrooms: 2,
          ceilingHeight: 8,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedWall: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 12,
          windowCount: 'average',
          airLeaks: ['minor-drafts', 'duct-leakage'],
          weatherStripping: 'basic',
          estimatedACH: 6,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 80,
            age: 15
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 10,
            age: 15
          },
          thermostatType: 'programmable',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 58,
          energyIntensity: 32,
          heatingPct: 45,
          coolingPct: 20
        }
      }
    },
    'large': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 2800,
          stories: 3,
          bedrooms: 4,
          bathrooms: 2.5,
          ceilingHeight: 9,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedWall: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 16,
          windowCount: 'many',
          airLeaks: ['minor-drafts', 'duct-leakage'],
          weatherStripping: 'basic',
          estimatedACH: 5,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 82,
            age: 12
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 11,
            age: 12
          },
          thermostatType: 'programmable',
          zoneCount: 2,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 75,
          energyIntensity: 27,
          heatingPct: 45,
          coolingPct: 25
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 2800,
          stories: 2,
          bedrooms: 4,
          bathrooms: 2.5,
          ceilingHeight: 9,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedFloor: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 14,
          windowCount: 'many',
          airLeaks: ['minor-drafts'],
          weatherStripping: 'basic',
          estimatedACH: 5,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 82,
            age: 12
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 11,
            age: 12
          },
          thermostatType: 'programmable',
          zoneCount: 2,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 70,
          energyIntensity: 25,
          heatingPct: 45,
          coolingPct: 25
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 2800,
          stories: 3,
          bedrooms: 4,
          bathrooms: 2.5,
          ceilingHeight: 9,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'average',
            walls: 'average',
            floor: 'average',
            basement: 'none',
            sharedWall: 'average'
          },
          windowType: 'double-clear',
          windowCondition: 'good',
          numWindows: 16,
          windowCount: 'many',
          airLeaks: ['minor-drafts', 'duct-leakage'],
          weatherStripping: 'basic',
          estimatedACH: 5,
          temperatureConsistency: 'some-variations'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace',
            fuel: 'natural-gas',
            efficiency: 82,
            age: 12
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 11,
            age: 12
          },
          thermostatType: 'programmable',
          zoneCount: 2,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 78,
          energyIntensity: 28,
          heatingPct: 45,
          coolingPct: 25
        }
      }
    }
  },
  'post-2000': {
    'small': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 1200,
          stories: 2,
          bedrooms: 2,
          bathrooms: 1.5,
          ceilingHeight: 9,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'none',
            sharedWall: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 8,
          windowCount: 'average',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 95,
            age: 5
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 15,
            age: 5
          },
          thermostatType: 'smart',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 35,
          energyIntensity: 29,
          heatingPct: 40,
          coolingPct: 15
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 1200,
          stories: 1,
          bedrooms: 2,
          bathrooms: 1.5,
          ceilingHeight: 9,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'none',
            sharedFloor: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 6,
          windowCount: 'few',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 95,
            age: 5
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 15,
            age: 5
          },
          thermostatType: 'smart',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 32,
          energyIntensity: 27,
          heatingPct: 40,
          coolingPct: 15
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 1200,
          stories: 2,
          bedrooms: 2,
          bathrooms: 1.5,
          ceilingHeight: 9,
          numRooms: 5,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'none',
            sharedWall: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 7,
          windowCount: 'few',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 95,
            age: 5
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 15,
            age: 5
          },
          thermostatType: 'smart',
          zoneCount: 1,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 37,
          energyIntensity: 31,
          heatingPct: 40,
          coolingPct: 15
        }
      }
    },
    'medium': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 1800,
          stories: 2,
          bedrooms: 3,
          bathrooms: 2.5,
          ceilingHeight: 9,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'none',
            sharedWall: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 12,
          windowCount: 'average',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 95,
            age: 5
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 16,
            age: 5
          },
          thermostatType: 'smart',
          zoneCount: 2,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 45,
          energyIntensity: 25,
          heatingPct: 40,
          coolingPct: 25
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 1800,
          stories: 1,
          bedrooms: 3,
          bathrooms: 2,
          ceilingHeight: 9,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'none',
            sharedFloor: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 10,
          windowCount: 'average',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 95,
            age: 5
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 16,
            age: 5
          },
          thermostatType: 'smart',
          zoneCount: 2,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 42,
          energyIntensity: 23,
          heatingPct: 40,
          coolingPct: 25
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 1800,
          stories: 2,
          bedrooms: 3,
          bathrooms: 2,
          ceilingHeight: 9,
          numRooms: 7,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'none',
            sharedWall: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 12,
          windowCount: 'average',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 95,
            age: 5
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 16,
            age: 5
          },
          thermostatType: 'smart',
          zoneCount: 2,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 47,
          energyIntensity: 26,
          heatingPct: 40,
          coolingPct: 25
        }
      }
    },
    'large': {
      'side-by-side': {
        homeDetails: {
          squareFootage: 2800,
          stories: 3,
          bedrooms: 4,
          bathrooms: 3,
          ceilingHeight: 9,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'side-by-side'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'average',
            sharedWall: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 16,
          windowCount: 'many',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 96,
            age: 3
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 18,
            age: 3
          },
          thermostatType: 'smart',
          zoneCount: 3,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 65,
          energyIntensity: 23,
          heatingPct: 40,
          coolingPct: 30
        }
      },
      'stacked': {
        homeDetails: {
          squareFootage: 2800,
          stories: 2,
          bedrooms: 4,
          bathrooms: 3,
          ceilingHeight: 9,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'stacked'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'average',
            sharedFloor: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 14,
          windowCount: 'many',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 96,
            age: 3
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 18,
            age: 3
          },
          thermostatType: 'smart',
          zoneCount: 3,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 60,
          energyIntensity: 21,
          heatingPct: 40,
          coolingPct: 30
        }
      },
      'front-to-back': {
        homeDetails: {
          squareFootage: 2800,
          stories: 3,
          bedrooms: 4,
          bathrooms: 3,
          ceilingHeight: 9,
          numRooms: 9,
          homeType: 'duplex',
          unitConfiguration: 'front-to-back'
        },
        currentConditions: {
          insulation: {
            attic: 'good',
            walls: 'good',
            floor: 'good',
            basement: 'average',
            sharedWall: 'good'
          },
          windowType: 'double-low-e',
          windowCondition: 'excellent',
          numWindows: 16,
          windowCount: 'many',
          airLeaks: ['none'],
          weatherStripping: 'foam',
          estimatedACH: 3,
          temperatureConsistency: 'very-consistent'
        },
        heatingCooling: {
          heatingSystem: {
            type: 'gas-furnace-high-efficiency',
            fuel: 'natural-gas',
            efficiency: 96,
            age: 3
          },
          coolingSystem: {
            type: 'central-ac',
            efficiency: 18,
            age: 3
          },
          thermostatType: 'smart',
          zoneCount: 3,
          systemPerformance: 'works-well'
        },
        energyConsumption: {
          estimatedAnnualUsage: 68,
          energyIntensity: 24,
          heatingPct: 40,
          coolingPct: 30
        }
      }
    }
  }
};

// Main function to get duplex defaults based on year built, square footage, and unit configuration
export const getDuplexDefaults = (
  yearBuilt: number, 
  squareFootage: number, 
  state?: string, 
  unitConfiguration: string = 'side-by-side'
) => {
  const constructionPeriod = getDuplexConstructionPeriod(yearBuilt);
  const sizeCategory = getDuplexSizeCategory(squareFootage);
  const configuration = getDuplexUnitConfiguration(unitConfiguration);
  
  // Get base defaults
  const defaults = JSON.parse(JSON.stringify(
    duplexDefaults[constructionPeriod as keyof typeof duplexDefaults]
                  [sizeCategory]
                  [configuration]
  ));
  
  // Calculate climate-adjusted energy usage if state is provided
  if (state) {
    const numericZone = getClimateZone(state);
    const descriptiveZone = getDescriptiveClimateZone(numericZone);
    const climateAdjustment = duplexClimateZoneAdjustments[descriptiveZone] || 1.0;
    const sizeAdjustment = duplexSizeAdjustments[sizeCategory] || 1.0;
    const configAdjustment = duplexConfigurationAdjustments[configuration] || 1.0;
    const baseEnergyUsage = duplexEnergyUsageBaseline[constructionPeriod]?.[configuration] || 55; // Default to average if not found
    
    // Calculate adjusted energy usage with all factors
    const adjustedEnergyUsage = Math.round(baseEnergyUsage * climateAdjustment * sizeAdjustment * configAdjustment);
    
    // Update energy consumption values
    defaults.energyConsumption.estimatedAnnualUsage = adjustedEnergyUsage;
  }
  
  return defaults;
};
