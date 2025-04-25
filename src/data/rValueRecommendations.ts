export type ClimateZone = '1' | '2' | '3' | '4' | '5' | '6' | '7';
export type HomeType = 'singleFamily' | 'townhouse' | 'multifamily' | 'manufactured';

export interface RValueRecommendation {
  attic: string;
  walls: string;
  floors: string;
  crawlspace: string;
  basement: string;
}

// Typed configuration object for recommended R-Values by climate zone and home type
// Based on Department of Energy recommendations
const rValueRecommendations: Record<ClimateZone, Record<HomeType, RValueRecommendation>> = {
  '1': {
    singleFamily: { 
      attic: 'R-30 to R-49', 
      walls: 'R-13 to R-15', 
      floors: 'R-13', 
      crawlspace: 'R-13', 
      basement: 'R-0 to R-10' 
    },
    townhouse: { 
      attic: 'R-30 to R-49', 
      walls: 'R-13 to R-15', 
      floors: 'R-13', 
      crawlspace: 'R-13', 
      basement: 'R-0 to R-10' 
    },
    multifamily: { 
      attic: 'R-30 to R-49', 
      walls: 'R-13 to R-15', 
      floors: 'R-13', 
      crawlspace: 'R-13', 
      basement: 'R-0 to R-10' 
    },
    manufactured: { 
      attic: 'R-30 to R-49', 
      walls: 'R-13 to R-15', 
      floors: 'R-13', 
      crawlspace: 'R-13', 
      basement: 'R-0 to R-10' 
    }
  },
  '2': {
    singleFamily: { 
      attic: 'R-30 to R-60', 
      walls: 'R-13 to R-15', 
      floors: 'R-13', 
      crawlspace: 'R-13', 
      basement: 'R-0 to R-10' 
    },
    townhouse: { 
      attic: 'R-30 to R-60', 
      walls: 'R-13 to R-15', 
      floors: 'R-13', 
      crawlspace: 'R-13', 
      basement: 'R-0 to R-10' 
    },
    multifamily: { 
      attic: 'R-30 to R-60', 
      walls: 'R-13 to R-15', 
      floors: 'R-13', 
      crawlspace: 'R-13', 
      basement: 'R-0 to R-10' 
    },
    manufactured: { 
      attic: 'R-30 to R-38', 
      walls: 'R-13', 
      floors: 'R-13', 
      crawlspace: 'R-13', 
      basement: 'R-0' 
    }
  },
  '3': {
    singleFamily: { 
      attic: 'R-30 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-19 to R-25', 
      crawlspace: 'R-19', 
      basement: 'R-5 to R-10' 
    },
    townhouse: { 
      attic: 'R-30 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-19 to R-25', 
      crawlspace: 'R-19', 
      basement: 'R-5 to R-10' 
    },
    multifamily: { 
      attic: 'R-30 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-19 to R-25', 
      crawlspace: 'R-19', 
      basement: 'R-5 to R-10' 
    },
    manufactured: { 
      attic: 'R-30 to R-38', 
      walls: 'R-13 to R-19', 
      floors: 'R-19', 
      crawlspace: 'R-19', 
      basement: 'R-5' 
    }
  },
  '4': {
    singleFamily: { 
      attic: 'R-38 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-10 to R-15' 
    },
    townhouse: { 
      attic: 'R-38 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-10 to R-15' 
    },
    multifamily: { 
      attic: 'R-38 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-10 to R-15' 
    },
    manufactured: { 
      attic: 'R-38', 
      walls: 'R-13 to R-19', 
      floors: 'R-25', 
      crawlspace: 'R-25', 
      basement: 'R-10' 
    }
  },
  '5': {
    singleFamily: { 
      attic: 'R-49 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-10 to R-15' 
    },
    townhouse: { 
      attic: 'R-49 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-10 to R-15' 
    },
    multifamily: { 
      attic: 'R-49 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-10 to R-15' 
    },
    manufactured: { 
      attic: 'R-38 to R-49', 
      walls: 'R-13 to R-19', 
      floors: 'R-25', 
      crawlspace: 'R-25', 
      basement: 'R-10' 
    }
  },
  '6': {
    singleFamily: { 
      attic: 'R-49 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-15 to R-19' 
    },
    townhouse: { 
      attic: 'R-49 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-15 to R-19' 
    },
    multifamily: { 
      attic: 'R-49 to R-60', 
      walls: 'R-13 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-15 to R-19' 
    },
    manufactured: { 
      attic: 'R-49', 
      walls: 'R-19 to R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-15' 
    }
  },
  '7': {
    singleFamily: { 
      attic: 'R-49 to R-60', 
      walls: 'R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-15 to R-19' 
    },
    townhouse: { 
      attic: 'R-49 to R-60', 
      walls: 'R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-15 to R-19' 
    },
    multifamily: { 
      attic: 'R-49 to R-60', 
      walls: 'R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-15 to R-19' 
    },
    manufactured: { 
      attic: 'R-49 to R-60', 
      walls: 'R-21', 
      floors: 'R-25 to R-30', 
      crawlspace: 'R-25', 
      basement: 'R-15' 
    }
  }
};

export default rValueRecommendations;

/**
 * Get recommended R-values based on climate zone and home type
 */
export const getRecommendedRValues = (
  zone: ClimateZone, 
  homeType: HomeType
): RValueRecommendation => {
  return rValueRecommendations[zone]?.[homeType] || {
    attic: 'R-38 to R-60',
    walls: 'R-13 to R-21',
    floors: 'R-25 to R-30',
    crawlspace: 'R-19',
    basement: 'R-10 to R-15'
  };
};

/**
 * Calculate personalized savings range based on climate zone, home type, and construction year
 */
export const calculateSavings = (
  zone: ClimateZone,
  homeType: HomeType,
  year: number
): { minSavings: number; maxSavings: number } => {
  // Base savings percentage (10-20%)
  let baseSavingsMin = 10;
  let baseSavingsMax = 20;
  
  // Adjust based on home age (older homes have higher potential savings)
  const ageAdjustment = Math.max(0, Math.min(5, (2025 - year) / 20));
  
  // Adjust based on climate zone (more extreme zones have higher savings potential)
  const zoneAdjustment = Math.abs(parseInt(zone) - 4) * 0.5;
  
  // Calculate final adjusted ranges
  return {
    minSavings: Math.max(5, Math.min(25, Math.round(baseSavingsMin + ageAdjustment))),
    maxSavings: Math.max(10, Math.min(35, Math.round(baseSavingsMax + ageAdjustment + zoneAdjustment)))
  };
};
