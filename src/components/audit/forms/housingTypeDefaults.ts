// Housing type specific defaults based on research data
// See mobile-home-defaults.md, single-family-defaults.md, townhouse-defaults.md, 
// condominium-defaults.ts, apartmentDefaults.ts, and duplex-defaults.md for detailed documentation and sources

import { 
  getCondominiumDefaults,
  getCondominiumConstructionPeriod,
  getCondominiumSizeCategory
} from './condominiumDefaults.ts';

import {
  getApartmentDefaults,
  getApartmentConstructionPeriod,
  getApartmentSizeCategory
} from './apartmentDefaults.ts';

import {
  getDuplexDefaults,
  getDuplexConstructionPeriod,
  getDuplexSizeCategory,
  getDuplexUnitConfiguration
} from './duplexDefaults.ts';

// Import mobile home defaults from separate file to avoid circular dependencies
import { 
  getMobileHomeConstructionPeriod,
  getMobileHomeSizeCategory,
  getMobileHomeDefaults
} from './MobileHomeDefaults';

// Re-export for backward compatibility
export { getMobileHomeConstructionPeriod };

export const getSingleFamilyConstructionPeriod = (yearBuilt: number): string => {
  if (yearBuilt < 1980) return 'pre-1980';
  if (yearBuilt < 2000) return '1980-2000';
  return 'post-2000';
};

export const getTownhouseConstructionPeriod = (yearBuilt: number): string => {
  if (yearBuilt < 1980) return 'pre-1980';
  if (yearBuilt < 2000) return '1980-2000';
  return 'post-2000';
};

// Generic function that dispatches to specific construction period getters based on homeType
export const getConstructionPeriod = (yearBuilt: number, homeType?: string): string => {
  if (homeType === 'mobile-home') {
    return getMobileHomeConstructionPeriod(yearBuilt);
  } else if (homeType === 'single-family') {
    return getSingleFamilyConstructionPeriod(yearBuilt);
  } else if (homeType === 'townhouse') {
    return getTownhouseConstructionPeriod(yearBuilt);
  } else if (homeType === 'condominium') {
    return getCondominiumConstructionPeriod(yearBuilt);
  } else if (homeType === 'apartment') {
    return getApartmentConstructionPeriod(yearBuilt);
  } else if (homeType === 'duplex') {
    return getDuplexConstructionPeriod(yearBuilt);
  }
  
  // Default to mobile home periods for backwards compatibility
  return getMobileHomeConstructionPeriod(yearBuilt);
};

// Helper functions to determine size category based on home type
// getMobileHomeSizeCategory is imported from MobileHomeDefaults.ts

export const getSingleFamilySizeCategory = (squareFootage: number): 'small' | 'medium' | 'large' => {
  if (squareFootage < 1500) return 'small';
  if (squareFootage <= 2500) return 'medium';
  return 'large';
};

export const getTownhouseSizeCategory = (squareFootage: number): 'small' | 'medium' | 'large' => {
  if (squareFootage < 1500) return 'small';
  if (squareFootage <= 2500) return 'medium';
  return 'large';
};

// Generic function that dispatches to specific size category getters based on homeType
export const getSizeCategory = (squareFootage: number, homeType?: string): 'small' | 'medium' | 'large' => {
  if (homeType === 'mobile-home') {
    return getMobileHomeSizeCategory(squareFootage);
  } else if (homeType === 'single-family') {
    return getSingleFamilySizeCategory(squareFootage);
  } else if (homeType === 'townhouse') {
    return getTownhouseSizeCategory(squareFootage);
  } else if (homeType === 'condominium') {
    return getCondominiumSizeCategory(squareFootage);
  } else if (homeType === 'apartment') {
    return getApartmentSizeCategory(squareFootage);
  } else if (homeType === 'duplex') {
    return getDuplexSizeCategory(squareFootage);
  }
  
  // Default to mobile home categories for backwards compatibility
  return getMobileHomeSizeCategory(squareFootage);
};

// Helper function to determine townhouse unit position
export const getTownhouseUnitPosition = (position?: string): 'interior' | 'end' | 'corner' => {
  if (position === 'end') return 'end';
  if (position === 'corner') return 'corner';
  return 'interior'; // Default to interior unit
};

// Generic helper function to determine unit position for multi-family dwellings
export const getUnitPosition = (position?: string, homeType?: string): string => {
  if (homeType === 'townhouse') {
    return getTownhouseUnitPosition(position);
  } else if (homeType === 'condominium' || homeType === 'apartment') {
    // For condos and apartments, positions are: interior, corner, or top-floor
    if (position === 'corner') return 'corner';
    if (position === 'top-floor') return 'top-floor';
    return 'interior';
  } else if (homeType === 'duplex') {
    // For duplexes, unit configurations are: side-by-side, stacked, or front-to-back
    return getDuplexUnitConfiguration(position);
  }
  
  // Default to interior unit for all types
  return 'interior';
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

// Main function to get defaults for any housing type
export const getHousingDefaults = (
  housingType: string, 
  yearBuilt: number, 
  squareFootage: number, 
  state?: string, 
  unitPosition?: string
) => {
  switch(housingType) {
    case 'mobile-home':
      return getMobileHomeDefaults(yearBuilt, squareFootage, state);
    case 'single-family':
      return getSingleFamilyDefaults(yearBuilt, squareFootage, state);
    case 'townhouse':
      return getTownhouseDefaults(yearBuilt, squareFootage, state, unitPosition);
    case 'condominium':
      return getCondominiumDefaults(yearBuilt, squareFootage, state, unitPosition);
    case 'apartment':
      return getApartmentDefaults(yearBuilt, squareFootage, state, unitPosition);
    case 'duplex':
      return getDuplexDefaults(yearBuilt, squareFootage, state, unitPosition);
    default:
      // Default to single-family if unknown type
      return getSingleFamilyDefaults(yearBuilt, squareFootage, state);
  }
};

// Re-export functions from other default modules
export {
  getCondominiumDefaults,
  getApartmentDefaults,
  getDuplexDefaults
};

// Helper function to get numeric climate zone
export const getClimateZone = (state: string): number => {
  return climateZonesByState[state.toUpperCase()] || 4; // Default to zone 4 if unknown
};

// Map numeric IECC climate zones to descriptive zones for single-family homes
export const getDescriptiveClimateZone = (numericZone: number): 'cold-very-cold' | 'mixed-humid' | 'hot-humid' | 'hot-dry-mixed-dry' => {
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

// Helper function to get state from zone (placeholder - in a real implementation you would have a mechanism to know current state)
const getStateFromZone = (zone: number): string => {
  // This is a simplified approach - in reality, you'd want to use the actual state
  return 'TX'; // Default to something reasonable
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

// Climate zone adjustment multipliers for energy usage (single-family homes)
export const singleFamilyClimateZoneAdjustments: Record<string, number> = {
  'cold-very-cold': 1.2,
  'mixed-humid': 1.0,
  'hot-humid': 0.9, 
  'hot-dry-mixed-dry': 0.95
};

// Climate zone adjustment multipliers for energy usage (townhouses)
export const townhouseClimateZoneAdjustments: Record<string, number> = {
  'cold-very-cold': 1.2,
  'mixed-humid': 1.0,
  'hot-humid': 0.9, 
  'hot-dry-mixed-dry': 0.95
};

// Size adjustment factors for energy usage (mobile homes)
export const mobileHomeSizeAdjustments: Record<string, number> = {
  'small': 0.9,
  'medium': 1.0,
  'large': 1.1
};

// Size adjustment factors for energy usage (single-family homes)
export const singleFamilySizeAdjustments: Record<string, number> = {
  'small': 0.8,
  'medium': 1.0,
  'large': 1.3
};

// Size adjustment factors for energy usage (townhouses)
export const townhouseSizeAdjustments: Record<string, number> = {
  'small': 0.8,
  'medium': 1.0,
  'large': 1.2
};

// Unit position adjustment factors for energy usage (townhouses)
export const townhousePositionAdjustments: Record<string, number> = {
  'interior': 1.0,    // Baseline
  'end': 1.12,        // ~12% higher energy usage than interior units
  'corner': 1.15      // ~15% higher energy usage than interior units
};

// Energy usage baseline by construction period (MMBtu/yr) - mobile homes
export const mobileHomeEnergyUsageBaseline: Record<string, number> = {
  'pre-1976': 70,
  '1976-1994': 65,
  '1994-2000': 58,
  'post-2000': 52
};

// Energy usage baseline by construction period (MMBtu/yr) - single-family homes
export const singleFamilyEnergyUsageBaseline: Record<string, number> = {
  'pre-1980': 90,     // Higher due to larger size and older efficiency standards
  '1980-2000': 70,    // Better insulation and more efficient systems
  'post-2000': 50     // Modern code requirements and high-efficiency systems
};

// Energy usage baseline by construction period (MMBtu/yr) - townhouses
export const townhouseEnergyUsageBaseline: Record<string, number> = {
  'pre-1980': 70,     // 15-20% less than comparable single-family due to shared walls
  '1980-2000': 55,    // Better insulation and more efficient systems
  'post-2000': 40     // Modern code requirements and high-efficiency systems
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

// getMobileHomeDefaults is imported from MobileHomeDefaults.ts

// Create the single-family defaults structure based on the research data
export const singleFamilyDefaults = {
  'pre-1980': {
    'small': {
      homeDetails: {
        squareFootage: 1200,
        stories: 1,
        bedrooms: 3,
        bathrooms: 1,
        ceilingHeight: 8,
        numRooms: 6,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'poor',
          floor: 'poor',
          basement: 'none'
        },
        windowType: 'single-with-storm',
        windowCondition: 'fair',
        numWindows: 10,
        windowCount: 'average',
        airLeaks: ['major-drafts', 'visible-gaps', 'chimney-leakage'],
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
          type: 'window-units',
          efficiency: 8,
          age: 10
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        estimatedAnnualUsage: 90,
        energyIntensity: 75,
        heatingPct: 60,
        coolingPct: 5
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1800,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        ceilingHeight: 8,
        numRooms: 7,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'poor',
          floor: 'poor',
          basement: 'none'
        },
        windowType: 'single-with-storm',
        windowCondition: 'fair',
        numWindows: 12,
        windowCount: 'average',
        airLeaks: ['major-drafts', 'visible-gaps'],
        weatherStripping: 'minimal',
        estimatedACH: 12,
        temperatureConsistency: 'large-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'gas-furnace',
          fuel: 'natural-gas',
          efficiency: 70,
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
        estimatedAnnualUsage: 110,
        energyIntensity: 61,
        heatingPct: 55,
        coolingPct: 10
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 3000,
        stories: 2,
        bedrooms: 4,
        bathrooms: 2.5,
        ceilingHeight: 8,
        numRooms: 10,
        numFloors: 2
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'poor',
          floor: 'poor',
          basement: 'none'
        },
        windowType: 'single-with-storm',
        windowCondition: 'fair',
        numWindows: 18,
        windowCount: 'many',
        airLeaks: ['major-drafts', 'visible-gaps', 'chimney-leakage'],
        weatherStripping: 'minimal',
        estimatedACH: 14,
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
          type: 'central-ac',
          efficiency: 8,
          age: 15
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'needs-attention'
      },
      energyConsumption: {
        estimatedAnnualUsage: 140,
        energyIntensity: 47,
        heatingPct: 60,
        coolingPct: 15
      }
    }
  },
  '1980-2000': {
    'small': {
      homeDetails: {
        squareFootage: 1200,
        stories: 1,
        bedrooms: 2,
        bathrooms: 1,
        ceilingHeight: 8,
        numRooms: 6,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'average',
          basement: 'none'
        },
        windowType: 'double-clear',
        windowCondition: 'good',
        numWindows: 8,
        windowCount: 'average',
        airLeaks: ['minor-drafts'],
        weatherStripping: 'basic',
        estimatedACH: 7,
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
        estimatedAnnualUsage: 70,
        energyIntensity: 58,
        heatingPct: 50,
        coolingPct: 10
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1800,
        stories: 2,
        bedrooms: 3,
        bathrooms: 2,
        ceilingHeight: 8,
        numRooms: 8,
        numFloors: 2
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'below-average',
          basement: 'none'
        },
        windowType: 'double-clear',
        windowCondition: 'good',
        numWindows: 15,
        windowCount: 'average',
        airLeaks: ['minor-drafts', 'duct-leakage'],
        weatherStripping: 'basic',
        estimatedACH: 7,
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
        estimatedAnnualUsage: 90,
        energyIntensity: 50,
        heatingPct: 45,
        coolingPct: 20
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 3000,
        stories: 2,
        bedrooms: 4,
        bathrooms: 2.5,
        ceilingHeight: 9,
        numRooms: 10,
        numFloors: 2
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'average',
          basement: 'none'
        },
        windowType: 'double-clear',
        windowCondition: 'good',
        numWindows: 20,
        windowCount: 'many',
        airLeaks: ['minor-drafts', 'duct-leakage'],
        weatherStripping: 'basic',
        estimatedACH: 6,
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
        estimatedAnnualUsage: 120,
        energyIntensity: 40,
        heatingPct: 50,
        coolingPct: 25
      }
    }
  },
  'post-2000': {
    'small': {
      homeDetails: {
        squareFootage: 1200,
        stories: 1,
        bedrooms: 3,
        bathrooms: 1,
        ceilingHeight: 9,
        numRooms: 6,
        numFloors: 1
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'none'
        },
        windowType: 'double-low-e',
        windowCondition: 'excellent',
        numWindows: 8,
        windowCount: 'average',
        airLeaks: ['none'],
        weatherStripping: 'foam',
        estimatedACH: 4,
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
        estimatedAnnualUsage: 50,
        energyIntensity: 42,
        heatingPct: 40,
        coolingPct: 15
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 2000,
        stories: 2,
        bedrooms: 3,
        bathrooms: 2.5,
        ceilingHeight: 9,
        numRooms: 8,
        numFloors: 2
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'average'
        },
        windowType: 'double-low-e',
        windowCondition: 'excellent',
        numWindows: 15,
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
        estimatedAnnualUsage: 70,
        energyIntensity: 35,
        heatingPct: 40,
        coolingPct: 25
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 3500,
        stories: 2,
        bedrooms: 4,
        bathrooms: 3,
        ceilingHeight: 10,
        numRooms: 12,
        numFloors: 2
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'average'
        },
        windowType: 'double-low-e',
        windowCondition: 'excellent',
        numWindows: 24,
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
        estimatedAnnualUsage: 95,
        energyIntensity: 27,
        heatingPct: 40,
        coolingPct: 30
      }
    }
  }
};

// Main function to get single-family home defaults based on year built and square footage
export const getSingleFamilyDefaults = (yearBuilt: number, squareFootage: number, state?: string) => {
  const constructionPeriod = getSingleFamilyConstructionPeriod(yearBuilt);
  const sizeCategory = getSingleFamilySizeCategory(squareFootage);
  
  // Get base defaults
  const defaults = singleFamilyDefaults[constructionPeriod as keyof typeof singleFamilyDefaults][sizeCategory];
  
  // Calculate climate-adjusted energy usage if state is provided
  if (state) {
    const numericZone = getClimateZone(state);
    const descriptiveZone = getDescriptiveClimateZone(numericZone);
    const climateAdjustment = singleFamilyClimateZoneAdjustments[descriptiveZone] || 1.0;
    const sizeAdjustment = singleFamilySizeAdjustments[sizeCategory] || 1.0;
    const baseEnergyUsage = singleFamilyEnergyUsageBaseline[constructionPeriod] || 70; // Default to average if not found
    
    // Calculate adjusted energy usage
    const adjustedEnergyUsage = Math.round(baseEnergyUsage * climateAdjustment * sizeAdjustment);
    
    // Update energy consumption values
    defaults.energyConsumption.estimatedAnnualUsage = adjustedEnergyUsage;
  }
  
  return defaults;
};

// Define the townhouse defaults structure
export const townhouseDefaults = {
  'pre-1980': {
    'small': {
      homeDetails: {
        squareFootage: 1200,
        stories: 2,
        bedrooms: 2,
        bathrooms: 1.5,
        ceilingHeight: 8,
        numRooms: 5,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'poor',
          floor: 'poor',
          basement: 'none'
        },
        windowType: 'single-with-storm',
        windowCondition: 'fair',
        numWindows: 8,
        windowCount: 'few',
        airLeaks: ['major-drafts', 'attic-bypasses'],
        weatherStripping: 'minimal',
        estimatedACH: 10,
        temperatureConsistency: 'large-variations'
      },
      heatingCooling: {
        heatingSystem: {
          type: 'gas-furnace',
          fuel: 'natural-gas',
          efficiency: 70,
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
        estimatedAnnualUsage: 70,
        energyIntensity: 70,
        heatingPct: 55,
        coolingPct: 10
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1800,
        stories: 2,
        bedrooms: 3,
        bathrooms: 2.5,
        ceilingHeight: 8,
        numRooms: 7,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'below-average',
          floor: 'below-average',
          basement: 'none'
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
        estimatedAnnualUsage: 85,
        energyIntensity: 47,
        heatingPct: 55,
        coolingPct: 10
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 2800,
        stories: 3,
        bedrooms: 4,
        bathrooms: 2.5,
        ceilingHeight: 8,
        numRooms: 9,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'below-average',
          walls: 'below-average',
          floor: 'below-average',
          basement: 'none'
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
    }
  },
  '1980-2000': {
    'small': {
      homeDetails: {
        squareFootage: 1200,
        stories: 2,
        bedrooms: 2,
        bathrooms: 1.5,
        ceilingHeight: 8,
        numRooms: 5,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'average',
          basement: 'none'
        },
        windowType: 'double-clear',
        windowCondition: 'good',
        numWindows: 8,
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
        estimatedAnnualUsage: 55,
        energyIntensity: 46,
        heatingPct: 50,
        coolingPct: 15
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1800,
        stories: 2,
        bedrooms: 3,
        bathrooms: 2.5,
        ceilingHeight: 8,
        numRooms: 7,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'average',
          basement: 'none'
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
        estimatedAnnualUsage: 70,
        energyIntensity: 39,
        heatingPct: 45,
        coolingPct: 20
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 2800,
        stories: 3,
        bedrooms: 4,
        bathrooms: 2.5,
        ceilingHeight: 9,
        numRooms: 9,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          floor: 'average',
          basement: 'none'
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
        estimatedAnnualUsage: 95,
        energyIntensity: 34,
        heatingPct: 45,
        coolingPct: 25
      }
    }
  },
  'post-2000': {
    'small': {
      homeDetails: {
        squareFootage: 1200,
        stories: 2,
        bedrooms: 2,
        bathrooms: 1.5,
        ceilingHeight: 9,
        numRooms: 5,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'none'
        },
        windowType: 'double-low-e',
        windowCondition: 'excellent',
        numWindows: 8,
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
        estimatedAnnualUsage: 40,
        energyIntensity: 33,
        heatingPct: 40,
        coolingPct: 15
      }
    },
    'medium': {
      homeDetails: {
        squareFootage: 1800,
        stories: 2,
        bedrooms: 3,
        bathrooms: 2.5,
        ceilingHeight: 9,
        numRooms: 7,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'none'
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
        estimatedAnnualUsage: 55,
        energyIntensity: 30,
        heatingPct: 40,
        coolingPct: 25
      }
    },
    'large': {
      homeDetails: {
        squareFootage: 2800,
        stories: 3,
        bedrooms: 4,
        bathrooms: 3,
        ceilingHeight: 9,
        numRooms: 9,
        homeType: 'townhouse'
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'good',
          floor: 'good',
          basement: 'average'
        },
        windowType: 'double-low-e',
        windowCondition: 'excellent',
        numWindows: 18,
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
        estimatedAnnualUsage: 75,
        energyIntensity: 27,
        heatingPct: 40,
        coolingPct: 30
      }
    }
  }
};

// Main function to get townhouse defaults based on year built, square footage, and unit position
export const getTownhouseDefaults = (yearBuilt: number, squareFootage: number, state?: string, unitPosition: string = 'interior') => {
  const constructionPeriod = getTownhouseConstructionPeriod(yearBuilt);
  const sizeCategory = getTownhouseSizeCategory(squareFootage);
  const position = getTownhouseUnitPosition(unitPosition);
  
  // Get base defaults
  const defaults = JSON.parse(JSON.stringify(townhouseDefaults[constructionPeriod as keyof typeof townhouseDefaults][sizeCategory]));
  
  // Add unit position to home details
  defaults.homeDetails.unitPosition = position;
  
  // Calculate climate-adjusted energy usage if state is provided
  if (state) {
    const numericZone = getClimateZone(state);
    const descriptiveZone = getDescriptiveClimateZone(numericZone);
    const climateAdjustment = townhouseClimateZoneAdjustments[descriptiveZone] || 1.0;
    const sizeAdjustment = townhouseSizeAdjustments[sizeCategory] || 1.0;
    const positionAdjustment = townhousePositionAdjustments[position] || 1.0;
    const baseEnergyUsage = townhouseEnergyUsageBaseline[constructionPeriod] || 55; // Default to average if not found
    
    // Calculate adjusted energy usage with all factors
    const adjustedEnergyUsage = Math.round(baseEnergyUsage * climateAdjustment * sizeAdjustment * positionAdjustment);
    
    // Update energy consumption values
    defaults.energyConsumption.estimatedAnnualUsage = adjustedEnergyUsage;
  }
  
  return defaults;
};
