/**
 * Utility for calculating detailed energy breakdown data
 * for the dashboard charts based on audit data
 */

interface ChartDataPoint {
  name: string;
  value: number;
}

/**
 * Room-based energy consumption interface
 */
export interface RoomEnergyConsumption {
  livingRoom: number;
  kitchen: number;
  bedrooms: number;
  bathroom: number;
  outdoor: number;
  [key: string]: number; // For custom room types in future
}

/**
 * Default energy breakdown distribution by category 
 * based on industry standard averages
 */
export const defaultEnergyBreakdown: ChartDataPoint[] = [
  { name: 'HVAC', value: 42 },
  { name: 'Lighting', value: 18 },
  { name: 'Appliances', value: 15 },
  { name: 'Electronics', value: 14 },
  { name: 'Other', value: 11 }
];

/**
 * Default room-based energy distribution percentages by property type
 */
export const defaultRoomEnergyDistribution: Record<string, Record<string, number>> = {
  'single-family': {
    livingRoom: 28,  // Entertainment devices, main lighting, shared HVAC usage
    kitchen: 24,     // Refrigerator, oven, dishwasher, small appliances
    bedrooms: 18,    // Lighting, electronics, personal devices, heating/cooling
    bathroom: 10,    // Water heating, ventilation, lighting
    outdoor: 20      // Exterior lighting, garage, lawn equipment, pools
  },
  'apartment': {
    livingRoom: 32,  // Higher proportion due to limited overall space
    kitchen: 26,     // Higher proportion due to limited overall space
    bedrooms: 24,    // Higher proportion due to limited overall space
    bathroom: 12,    // Higher proportion due to limited overall space
    outdoor: 6       // Limited to balcony/patio areas only
  },
  'condominium': {
    livingRoom: 32,  // Same as apartment
    kitchen: 26,
    bedrooms: 24,
    bathroom: 12,
    outdoor: 6
  },
  'townhouse': {
    livingRoom: 30,  // Intermediate between single-family and apartment
    kitchen: 25,
    bedrooms: 20,
    bathroom: 11,
    outdoor: 14
  },
  'mobile-home': {
    livingRoom: 30,  // Combined living spaces often take larger proportion
    kitchen: 26,     // Often integrated with living area in open plan
    bedrooms: 22,    // Usually smaller but still significant energy usage
    bathroom: 12,    // Comparable to apartments
    outdoor: 10      // Limited exterior space but still some outdoor usage
  }
};

/**
 * Age-based adjustment factors for room energy distribution
 */
export const ageAdjustmentFactors: Record<string, Record<string, number>> = {
  'pre-1950': {
    livingRoom: 0.95,
    kitchen: 1.10,
    bedrooms: 0.95,
    bathroom: 1.15,
    outdoor: 0.90
  },
  '1950-1979': {
    livingRoom: 0.98,
    kitchen: 1.05,
    bedrooms: 0.98,
    bathroom: 1.10,
    outdoor: 0.95
  },
  '1980-1999': {
    livingRoom: 1.00,
    kitchen: 1.00,
    bedrooms: 1.00,
    bathroom: 1.00,
    outdoor: 1.00
  },
  '2000-2009': {
    livingRoom: 1.02,
    kitchen: 0.95,
    bedrooms: 1.02,
    bathroom: 0.95,
    outdoor: 1.05
  },
  '2010-present': {
    livingRoom: 1.05,
    kitchen: 0.90,
    bedrooms: 1.05,
    bathroom: 0.90,
    outdoor: 1.10
  }
};

/**
 * Occupancy pattern adjustment factors for room energy distribution
 */
export const occupancyPatternAdjustments: Record<string, Record<string, number>> = {
  'home-all-day': {
    livingRoom: 1.15,
    kitchen: 1.10,
    bedrooms: 0.95,
    bathroom: 1.05,
    outdoor: 0.75
  },
  'work-hours': {
    livingRoom: 0.90,
    kitchen: 0.95,
    bedrooms: 0.95,
    bathroom: 0.95,
    outdoor: 1.25
  },
  'evenings-weekends': {
    livingRoom: 1.05,
    kitchen: 1.05,
    bedrooms: 1.10,
    bathroom: 1.00,
    outdoor: 0.80
  },
  'variable': {
    livingRoom: 1.00,
    kitchen: 1.00,
    bedrooms: 1.00,
    bathroom: 1.00,
    outdoor: 1.00
  }
};

/**
 * Seasonal variation adjustment factors for room energy distribution
 */
export const seasonalVariationAdjustments: Record<string, Record<string, number>> = {
  'highest-summer': {
    livingRoom: 0.95,
    kitchen: 0.90,
    bedrooms: 1.05,
    bathroom: 0.95,
    outdoor: 1.15
  },
  'highest-winter': {
    livingRoom: 1.10,
    kitchen: 1.05,
    bedrooms: 1.05,
    bathroom: 1.10,
    outdoor: 0.70
  },
  'consistent': {
    livingRoom: 1.00,
    kitchen: 1.00,
    bedrooms: 1.00,
    bathroom: 1.00,
    outdoor: 1.00
  }
};

/**
 * Calculates a detailed energy breakdown using audit data
 * or falls back to default distribution if data is insufficient
 */
export function calculateDetailedEnergyBreakdown(auditData: any): ChartDataPoint[] {
  // If we don't have enough data, return the default distribution
  if (!auditData || !auditData.basicQuestions) {
    return defaultEnergyBreakdown;
  }
  
  // Extract relevant data from the audit
  const { 
    systemPerformance, 
    lightingTypes, 
    temperatureConsistency,
    heatingSystemType,
    coolingSystemType,
    monthlyEnergyBill
  } = auditData.basicQuestions || {};

  // HVAC calculation based on System Performance
  let hvacValue = 42; // Default value
  if (systemPerformance) {
    switch(systemPerformance) {
      case 'works-well': hvacValue = 35; break;
      case 'some-problems': hvacValue = 42; break;
      case 'needs-attention': hvacValue = 50; break;
    }
  }
  
  // Lighting calculation based on bulb types
  let lightingValue = 18; // Default value
  if (lightingTypes) {
    switch(lightingTypes) {
      case 'mostly-efficient': lightingValue = 12; break;
      case 'mixed': lightingValue = 18; break;
      case 'mostly-older': lightingValue = 25; break;
    }
  }
  
  // Other calculation based on temperature consistency
  let otherValue = 11; // Default value
  if (temperatureConsistency) {
    switch(temperatureConsistency) {
      case 'very-consistent': otherValue = 8; break;
      case 'some-variations': otherValue = 11; break;
      case 'large-variations': otherValue = 15; break;
    }
  }
  
  // Appliances calculation based on heating and cooling system types
  let appliancesValue = 15; // Default value
  if (heatingSystemType && coolingSystemType) {
    // Simplistic approach - more efficient systems use less energy
    const isEfficientHeating = 
      heatingSystemType.includes('efficient') || 
      heatingSystemType.includes('new');
    
    const isEfficientCooling = 
      coolingSystemType.includes('efficient') || 
      coolingSystemType.includes('new');
    
    if (isEfficientHeating && isEfficientCooling) {
      appliancesValue = 12;
    } else if (!isEfficientHeating && !isEfficientCooling) {
      appliancesValue = 20;
    }
  }
  
  // Electronics calculation based on monthly energy bill
  let electronicsValue = 14; // Default value
  if (monthlyEnergyBill) {
    switch(monthlyEnergyBill) {
      case 'low': electronicsValue = 10; break;
      case 'medium': electronicsValue = 14; break;
      case 'high': electronicsValue = 18; break;
    }
  }
  
  // Calculate total for normalization
  const total = hvacValue + lightingValue + appliancesValue + electronicsValue + otherValue;
  
  // Return normalized data
  return [
    { name: 'HVAC', value: hvacValue },
    { name: 'Lighting', value: lightingValue },
    { name: 'Appliances', value: appliancesValue },
    { name: 'Electronics', value: electronicsValue },
    { name: 'Other', value: otherValue }
  ];
}

/**
 * Evaluates if energy breakdown data needs enhancement
 * and applies the default distribution if needed
 */
export function enhanceEnergyBreakdown(
  energyBreakdown: ChartDataPoint[],
  auditData?: any
): ChartDataPoint[] {
  // If we have at least 3 categories, assume it's already detailed enough
  if (energyBreakdown && energyBreakdown.length >= 3) {
    return energyBreakdown;
  }
  
  // If we have audit data, try to calculate a detailed breakdown
  if (auditData) {
    return calculateDetailedEnergyBreakdown(auditData);
  }
  
  // Otherwise, use the default distribution
  return defaultEnergyBreakdown;
}

/**
 * Helper function to get the construction period based on year built
 */
function getConstructionPeriod(yearBuilt: number): string {
  if (yearBuilt < 1950) return 'pre-1950';
  if (yearBuilt < 1980) return '1950-1979';
  if (yearBuilt < 2000) return '1980-1999';
  if (yearBuilt < 2010) return '2000-2009';
  return '2010-present';
}

/**
 * Calculate room-based energy consumption based on audit data and total consumption
 */
export function calculateRoomEnergyConsumption(
  auditData: any,
  totalConsumption: number
): ChartDataPoint[] {
  // Initialize with default values for safety
  const defaultRooms = {
    livingRoom: 28,
    kitchen: 24,
    bedrooms: 18,
    bathroom: 10,
    outdoor: 20
  };
  
  // Default to single-family home if no property type specified
  const propertyType = auditData?.basicInfo?.propertyType || 'single-family';
  
  // Get base distribution for property type with safe fallback
  const baseDistribution = defaultRoomEnergyDistribution[propertyType] || 
                          defaultRoomEnergyDistribution['single-family'] ||
                          defaultRooms;
  
  // Create a working copy of the distribution with type safety
  const distribution = {
    livingRoom: baseDistribution.livingRoom || defaultRooms.livingRoom,
    kitchen: baseDistribution.kitchen || defaultRooms.kitchen,
    bedrooms: baseDistribution.bedrooms || defaultRooms.bedrooms,
    bathroom: baseDistribution.bathroom || defaultRooms.bathroom,
    outdoor: baseDistribution.outdoor || defaultRooms.outdoor
  };
  
  // 1. Apply age-based adjustments if year built is available
  if (auditData?.basicInfo?.yearBuilt) {
    const yearBuilt = auditData.basicInfo.yearBuilt;
    const period = getConstructionPeriod(yearBuilt);
    const ageFactors = ageAdjustmentFactors[period];
    
    if (ageFactors) {
      distribution.livingRoom *= (ageFactors.livingRoom || 1.0);
      distribution.kitchen *= (ageFactors.kitchen || 1.0);
      distribution.bedrooms *= (ageFactors.bedrooms || 1.0);
      distribution.bathroom *= (ageFactors.bathroom || 1.0);
      distribution.outdoor *= (ageFactors.outdoor || 1.0);
    }
  }
  
  // 2. Apply occupancy pattern adjustments
  if (auditData?.energyConsumption?.occupancyPattern) {
    const pattern = auditData.energyConsumption.occupancyPattern;
    const occupancyFactors = occupancyPatternAdjustments[pattern];
    
    if (occupancyFactors) {
      distribution.livingRoom *= (occupancyFactors.livingRoom || 1.0);
      distribution.kitchen *= (occupancyFactors.kitchen || 1.0);
      distribution.bedrooms *= (occupancyFactors.bedrooms || 1.0);
      distribution.bathroom *= (occupancyFactors.bathroom || 1.0);
      distribution.outdoor *= (occupancyFactors.outdoor || 1.0);
    }
  }
  
  // 3. Apply seasonal variation adjustments
  if (auditData?.energyConsumption?.seasonalVariation) {
    const variation = auditData.energyConsumption.seasonalVariation;
    const seasonalFactors = seasonalVariationAdjustments[variation];
    
    if (seasonalFactors) {
      distribution.livingRoom *= (seasonalFactors.livingRoom || 1.0);
      distribution.kitchen *= (seasonalFactors.kitchen || 1.0);
      distribution.bedrooms *= (seasonalFactors.bedrooms || 1.0);
      distribution.bathroom *= (seasonalFactors.bathroom || 1.0);
      distribution.outdoor *= (seasonalFactors.outdoor || 1.0);
    }
  }
  
  // 4. Apply lighting adjustments if available
  if (auditData?.currentConditions?.primaryBulbType) {
    const bulbType = auditData.currentConditions.primaryBulbType;
    
    // Adjust lighting component based on bulb efficiency
    if (bulbType === 'mostly-led') {
      // Efficient bulbs reduce energy in all rooms
      distribution.livingRoom *= 0.92;
      distribution.kitchen *= 0.92;
      distribution.bedrooms *= 0.92;
      distribution.bathroom *= 0.92;
      distribution.outdoor *= 0.92;
    } else if (bulbType === 'mostly-incandescent') {
      // Inefficient bulbs increase energy in all rooms
      distribution.livingRoom *= 1.10;
      distribution.kitchen *= 1.10;
      distribution.bedrooms *= 1.10;
      distribution.bathroom *= 1.10;
      distribution.outdoor *= 1.10;
    }
  }
  
  // 5. Natural light adjustments
  if (auditData?.currentConditions?.naturalLight) {
    const naturalLight = auditData.currentConditions.naturalLight;
    
    if (naturalLight === 'good') {
      // Good natural light reduces needed artificial lighting
      distribution.livingRoom *= 0.95;
      distribution.kitchen *= 0.95;
      distribution.bedrooms *= 0.95;
      distribution.bathroom *= 0.97;
    } else if (naturalLight === 'limited') {
      // Limited natural light increases needed artificial lighting
      distribution.livingRoom *= 1.07;
      distribution.kitchen *= 1.07;
      distribution.bedrooms *= 1.07;
      distribution.bathroom *= 1.05;
    }
  }
  
  // 6. HVAC system adjustments
  if (auditData?.heatingCooling?.heatingSystem?.type) {
    const heatingType = auditData.heatingCooling.heatingSystem.type;
    
    // Apply heating system specific adjustments
    if (heatingType === 'electric-baseboard' || heatingType === 'space-heaters') {
      distribution.livingRoom *= 1.15;
      distribution.bedrooms *= 1.10;
      distribution.bathroom *= 1.10;
      distribution.outdoor *= 0.65;
    } else if (heatingType === 'heat-pump') {
      distribution.livingRoom *= 1.03;
      distribution.kitchen *= 0.97;
      distribution.bedrooms *= 1.03;
      distribution.bathroom *= 1.03;
      distribution.outdoor *= 0.94;
    }
  }
  
  // 7. Normalize to ensure percentages sum to 100
  const totalPercentage = 
    distribution.livingRoom + 
    distribution.kitchen + 
    distribution.bedrooms + 
    distribution.bathroom + 
    distribution.outdoor;
  
  const normalizedDistribution = {
    livingRoom: (distribution.livingRoom / totalPercentage) * 100,
    kitchen: (distribution.kitchen / totalPercentage) * 100,
    bedrooms: (distribution.bedrooms / totalPercentage) * 100,
    bathroom: (distribution.bathroom / totalPercentage) * 100,
    outdoor: (distribution.outdoor / totalPercentage) * 100
  };
  
  // 8. Apply total consumption to get absolute values
  const result: ChartDataPoint[] = [
    { name: 'Living Room', value: Math.round(totalConsumption * normalizedDistribution.livingRoom / 100) },
    { name: 'Kitchen', value: Math.round(totalConsumption * normalizedDistribution.kitchen / 100) },
    { name: 'Bedrooms', value: Math.round(totalConsumption * normalizedDistribution.bedrooms / 100) },
    { name: 'Bathroom', value: Math.round(totalConsumption * normalizedDistribution.bathroom / 100) },
    { name: 'Outdoor', value: Math.round(totalConsumption * normalizedDistribution.outdoor / 100) }
  ];
  
  return result;
}

/**
 * Transforms abstract consumption categories (Base, Seasonal, etc.) into room-based categories
 */
export function transformConsumptionToRoomBased(
  consumption: ChartDataPoint[],
  auditData: any
): ChartDataPoint[] {
  // If no consumption data is provided, return empty array
  if (!consumption || consumption.length === 0) {
    return [];
  }
  
  // Calculate total consumption from the provided data
  const totalConsumption = consumption.reduce((sum, item) => sum + item.value, 0);
  
  // Generate room-based consumption
  return calculateRoomEnergyConsumption(auditData, totalConsumption);
}
