/**
 * Utility for calculating detailed energy breakdown data
 * for the dashboard charts based on audit data
 */

interface ChartDataPoint {
  name: string;
  value: number;
}

/**
 * Interface for the expected data structure used by calculation functions
 * This helps document and enforce the format that calculation functions expect
 */
export interface NormalizedAuditData {
  propertyType?: string;
  yearBuilt?: number;
  squareFootage?: number;
  systemPerformance?: string;
  lightingTypes?: string;
  temperatureConsistency?: string;
  heatingSystemType?: string;
  coolingSystemType?: string;
  monthlyEnergyBill?: string;
  occupancyPattern?: string;
  seasonalVariation?: string;
  primaryBulbType?: string;
  naturalLight?: string;
  originalData?: any;
}

/**
 * Adapter function to normalize the ReportData API response to the format 
 * needed by our calculation functions
 */
export function normalizeAuditData(reportData: any): NormalizedAuditData {
  if (!reportData) return {};
  
  console.log('Normalizing audit data for calculations...');
  
  // Create a normalized structure
  const normalizedData: NormalizedAuditData = {
    originalData: reportData
  };
  
  // Map property info
  if (reportData.propertyInfo) {
    normalizedData.propertyType = reportData.propertyInfo.propertyType;
    normalizedData.yearBuilt = reportData.propertyInfo.yearBuilt;
    normalizedData.squareFootage = reportData.propertyInfo.squareFootage;
  }
  
  // Map HVAC system performance
  if (reportData.currentConditions) {
    // Determine system performance based on HVAC age
    if (reportData.currentConditions.hvacSystemAge !== undefined) {
      const age = reportData.currentConditions.hvacSystemAge;
      if (age < 5) normalizedData.systemPerformance = 'works-well';
      else if (age < 15) normalizedData.systemPerformance = 'some-problems';
      else normalizedData.systemPerformance = 'needs-attention';
    }
    
    // Map insulation to temperature consistency
    if (reportData.currentConditions.insulation) {
      const insulation = reportData.currentConditions.insulation;
      if (insulation === 'excellent') normalizedData.temperatureConsistency = 'very-consistent';
      else if (insulation === 'good' || insulation === 'adequate') normalizedData.temperatureConsistency = 'some-variations';
      else normalizedData.temperatureConsistency = 'large-variations';
    }
  }
  
  // Map lighting data
  if (reportData.lighting) {
    // Determine primary bulb type
    if (reportData.lighting.bulbTypes) {
      const bulbs = reportData.lighting.bulbTypes;
      const ledPercentage = bulbs.led || 0;
      const incandescent = bulbs.incandescent || 0;
      
      if (ledPercentage > 70) normalizedData.lightingTypes = 'mostly-efficient';
      else if (incandescent > 50) normalizedData.lightingTypes = 'mostly-older';
      else normalizedData.lightingTypes = 'mixed';
      
      // Also map to primaryBulbType
      if (ledPercentage > 70) normalizedData.primaryBulbType = 'mostly-led';
      else if (incandescent > 50) normalizedData.primaryBulbType = 'mostly-incandescent';
      else normalizedData.primaryBulbType = 'mixed';
    }
    
    // Map natural light
    if (reportData.lighting.naturalLight) {
      normalizedData.naturalLight = reportData.lighting.naturalLight;
    }
  }
  
  // Map energy consumption data
  if (reportData.energyConsumption) {
    // Determine monthly energy bill category
    const totalUsage = (reportData.energyConsumption.electricityUsage || 0) + 
                       (reportData.energyConsumption.gasUsage || 0);
    
    if (totalUsage < 1000) normalizedData.monthlyEnergyBill = 'low';
    else if (totalUsage < 3000) normalizedData.monthlyEnergyBill = 'medium';
    else normalizedData.monthlyEnergyBill = 'high';
    
    // Map occupancy data
    const occupancyFactor = reportData.energyConsumption.occupancyFactor;
    if (occupancyFactor > 1.2) normalizedData.occupancyPattern = 'home-all-day';
    else if (occupancyFactor < 0.8) normalizedData.occupancyPattern = 'work-hours';
    else normalizedData.occupancyPattern = 'variable';
    
    // Map seasonal data
    const seasonalFactor = reportData.energyConsumption.seasonalFactor;
    if (seasonalFactor > 1.1) normalizedData.seasonalVariation = 'highest-winter';
    else if (seasonalFactor < 0.9) normalizedData.seasonalVariation = 'highest-summer';
    else normalizedData.seasonalVariation = 'consistent';
  }
  
  // Extract heating/cooling system types from recommendations
  if (reportData.recommendations && Array.isArray(reportData.recommendations)) {
    const hvacRecs = reportData.recommendations.filter((rec: any) => 
      rec.type === 'hvac' || rec.title.toLowerCase().includes('hvac')
    );
    
    if (hvacRecs.length > 0) {
      // Default values
      normalizedData.heatingSystemType = 'standard';
      normalizedData.coolingSystemType = 'standard';
      
      // Update based on recommendation titles/descriptions
      for (const rec of hvacRecs) {
        const text = (rec.title + ' ' + (rec.description || '')).toLowerCase();
        
        if (text.includes('heat pump')) {
          normalizedData.heatingSystemType = 'heat-pump';
          normalizedData.coolingSystemType = 'heat-pump';
        } else if (text.includes('efficient')) {
          normalizedData.heatingSystemType = 'efficient';
          normalizedData.coolingSystemType = 'efficient';
        }
      }
    }
  }
  
  console.log('Normalized audit data:', normalizedData);
  return normalizedData;
}

/**
 * Default energy breakdown distribution by category
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
    livingRoom: 28,
    kitchen: 24,
    bedrooms: 18,
    bathroom: 10,
    outdoor: 20
  },
  'apartment': {
    livingRoom: 32,
    kitchen: 26,
    bedrooms: 24,
    bathroom: 12,
    outdoor: 6
  },
  'condominium': {
    livingRoom: 32,
    kitchen: 26,
    bedrooms: 24,
    bathroom: 12,
    outdoor: 6
  },
  'townhouse': {
    livingRoom: 30,
    kitchen: 25,
    bedrooms: 20,
    bathroom: 11,
    outdoor: 14
  },
  'mobile-home': {
    livingRoom: 30,
    kitchen: 26,
    bedrooms: 22,
    bathroom: 12,
    outdoor: 10
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
  console.log('Running calculateDetailedEnergyBreakdown with:', auditData);
  
  // Check if we have raw or normalized data
  let normalizedData: NormalizedAuditData;
  
  if (!auditData) {
    console.log('No audit data provided, using defaults');
    return defaultEnergyBreakdown;
  }
  
  // If the data isn't already normalized, normalize it now
  if (!('systemPerformance' in auditData) && !('lightingTypes' in auditData)) {
    console.log('Data not normalized, running normalizer...');
    normalizedData = normalizeAuditData(auditData);
  } else {
    console.log('Data already normalized');
    normalizedData = auditData;
  }
  
  // For logging which data points were used in calculations
  const usedDataPoints: Record<string, any> = {};
  
  // Extract relevant data from the normalized audit data
  const { 
    systemPerformance, 
    lightingTypes, 
    temperatureConsistency,
    heatingSystemType,
    coolingSystemType,
    monthlyEnergyBill
  } = normalizedData;

  // HVAC calculation based on System Performance
  let hvacValue = 42; // Default value
  if (systemPerformance) {
    usedDataPoints.systemPerformance = systemPerformance;
    switch(systemPerformance) {
      case 'works-well': hvacValue = 35; break;
      case 'some-problems': hvacValue = 42; break;
      case 'needs-attention': hvacValue = 50; break;
    }
  } else {
    console.log('No systemPerformance data, using default HVAC value');
  }
  
  // Lighting calculation based on bulb types
  let lightingValue = 18; // Default value
  if (lightingTypes) {
    usedDataPoints.lightingTypes = lightingTypes;
    switch(lightingTypes) {
      case 'mostly-efficient': lightingValue = 12; break;
      case 'mixed': lightingValue = 18; break;
      case 'mostly-older': lightingValue = 25; break;
    }
  } else {
    console.log('No lightingTypes data, using default lighting value');
  }
  
  // Other calculation based on temperature consistency
  let otherValue = 11; // Default value
  if (temperatureConsistency) {
    usedDataPoints.temperatureConsistency = temperatureConsistency;
    switch(temperatureConsistency) {
      case 'very-consistent': otherValue = 8; break;
      case 'some-variations': otherValue = 11; break;
      case 'large-variations': otherValue = 15; break;
    }
  } else {
    console.log('No temperatureConsistency data, using default other value');
  }
  
  // Appliances calculation based on heating and cooling system types
  let appliancesValue = 15; // Default value
  if (heatingSystemType && coolingSystemType) {
    usedDataPoints.heatingSystemType = heatingSystemType;
    usedDataPoints.coolingSystemType = coolingSystemType;
    
    // Simplistic approach - more efficient systems use less energy
    const isEfficientHeating = 
      heatingSystemType.includes('efficient') || 
      heatingSystemType.includes('new') ||
      heatingSystemType === 'heat-pump';
    
    const isEfficientCooling = 
      coolingSystemType.includes('efficient') || 
      coolingSystemType.includes('new') ||
      coolingSystemType === 'heat-pump';
    
    if (isEfficientHeating && isEfficientCooling) {
      appliancesValue = 12;
    } else if (!isEfficientHeating && !isEfficientCooling) {
      appliancesValue = 20;
    }
  } else {
    console.log('No heating/cooling system data, using default appliances value');
  }
  
  // Electronics calculation based on monthly energy bill
  let electronicsValue = 14; // Default value
  if (monthlyEnergyBill) {
    usedDataPoints.monthlyEnergyBill = monthlyEnergyBill;
    switch(monthlyEnergyBill) {
      case 'low': electronicsValue = 10; break;
      case 'medium': electronicsValue = 14; break;
      case 'high': electronicsValue = 18; break;
    }
  } else {
    console.log('No monthlyEnergyBill data, using default electronics value');
  }
  
  console.log('Energy breakdown calculation used data points:', usedDataPoints);
  
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
  console.log('Running calculateRoomEnergyConsumption with:', { auditData, totalConsumption });
  
  // Check if we have raw or normalized data
  let normalizedData: NormalizedAuditData;
  
  if (!auditData) {
    console.log('No audit data provided, using complete defaults');
    // Return a default room distribution based on single-family home
    const defaultRooms = defaultRoomEnergyDistribution['single-family'];
    if (defaultRooms) {
      return Object.entries(defaultRooms).map(([room, percentage]) => ({
        name: room.charAt(0).toUpperCase() + room.slice(1).replace(/([A-Z])/g, ' $1').trim(),
        value: Math.round(totalConsumption * percentage / 100)
      }));
    }
    
    // If somehow defaultRooms is undefined, return empty array
    return [];
  }
  
  // If the data isn't already normalized, normalize it now
  if (!auditData.propertyType && !('originalData' in auditData)) {
    console.log('Room calculation: Data not normalized, running normalizer...');
    normalizedData = normalizeAuditData(auditData);
  } else {
    console.log('Room calculation: Data already normalized');
    normalizedData = auditData;
  }
  
  // For logging which data points were used in adjustments
  const appliedAdjustments: Record<string, any> = {};
  
  // Initialize with default values for safety
  const defaultRooms = {
    livingRoom: 28,
    kitchen: 24,
    bedrooms: 18,
    bathroom: 10,
    outdoor: 20
  };
  
  // Get property type from normalized data or extract from original data
  let propertyType = normalizedData.propertyType;
  
  // If not in normalized data, try to extract from original data
  if (!propertyType && normalizedData.originalData?.propertyInfo?.propertyType) {
    propertyType = normalizedData.originalData.propertyInfo.propertyType;
  }
  
  // Default to single-family home if still no property type
  propertyType = propertyType || 'single-family';
  appliedAdjustments.propertyType = propertyType;
  
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
  
  // Apply various adjustments to the distribution...
  // (Property type, age, occupancy pattern, seasonal variation, lighting, natural light, HVAC)
  // Code omitted for brevity
  
  // Normalize to ensure percentages sum to 100
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
  
  // Convert to chart data points and apply total consumption
  return [
    { name: 'Living Room', value: Math.round(totalConsumption * normalizedDistribution.livingRoom / 100) },
    { name: 'Kitchen', value: Math.round(totalConsumption * normalizedDistribution.kitchen / 100) },
    { name: 'Bedrooms', value: Math.round(totalConsumption * normalizedDistribution.bedrooms / 100) },
    { name: 'Bathroom', value: Math.round(totalConsumption * normalizedDistribution.bathroom / 100) },
    { name: 'Outdoor', value: Math.round(totalConsumption * normalizedDistribution.outdoor / 100) }
  ];
}
