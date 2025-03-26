export interface BasicInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyType: string;
  yearBuilt: number;
  occupants: number;
  auditDate: string;
}

export interface HomeDetails {
  squareFootage: number;
  stories: number;
  bedrooms: number;
  bathrooms: number;
  homeType: string;
  homeSize: number;
  constructionPeriod: 'before-1980' | '1980-2000' | 'after-2000';
  numRooms: number;
  numFloors: number;
  wallLength: number;
  wallWidth: number;
  ceilingHeight: number;
  basementType: 'finished' | 'unfinished' | 'none';
  basementHeating: 'heated' | 'unheated';
  unitPosition?: 'interior' | 'end' | 'corner'; // For townhouses - position affects energy usage
}

export interface InsulationInfo {
  attic: string;
  walls: string;
  basement: string;
  floor: string;
}

// New interfaces for lighting data
export interface LightingFixture {
  name?: string;
  watts?: number;
  hoursPerDay?: number;
  lumens?: number;
}

export interface LightingPatterns {
  morning: 'most' | 'some' | 'few' | 'none';
  day: 'most' | 'some' | 'few' | 'none';
  evening: 'most' | 'some' | 'few' | 'none';
  night: 'most' | 'some' | 'few' | 'none';
}

export interface BulbPercentages {
  led: number;
  cfl: number;
  incandescent: number;
}

export interface CurrentConditions {
  insulation: InsulationInfo;
  windowType: string;
  windowCondition: 'poor' | 'fair' | 'good' | 'excellent';
  numWindows: number;
  windowCount: 'few' | 'average' | 'many';  // Basic selection for window count
  doorCount: number;
  airLeaks: string[];
  weatherStripping: string;
  temperatureConsistency: 'very-consistent' | 'some-variations' | 'large-variations';
  comfortIssues: string[];
  
  // New lighting fields
  primaryBulbType?: 'mostly-led' | 'mixed' | 'mostly-incandescent';
  naturalLight?: 'good' | 'moderate' | 'limited';
  lightingControls?: 'basic' | 'some-advanced' | 'smart';
  bulbPercentages?: BulbPercentages;
  lightingPatterns?: LightingPatterns;
  fixtures?: LightingFixture[];
  
  // Humidity fields
  currentHumidity?: number; // Current relative humidity percentage
  targetHumidity?: number; // Target relative humidity percentage
  humidityTemperature?: number; // Temperature for dew point calculations
}

export interface HeatingSystem {
  type: string;
  fuel: string;
  fuelType: string;
  age: number;
  efficiency: number;
  lastService: string;
  outputCapacity?: number; // BTU/hr or kW
  inputPower?: number; // kW
  targetEfficiency?: number; // %
}

export interface CoolingSystem {
  type: string;
  age: number;
  efficiency: number;
  outputCapacity?: number; // BTU/hr or kW
  inputPower?: number; // kW
  targetEfficiency?: number; // %
}

export interface HeatingCooling {
  heatingSystem: HeatingSystem;
  coolingSystem: CoolingSystem;
  thermostatType: string;
  zoneCount: number;
  systemPerformance: 'works-well' | 'some-problems' | 'needs-attention';
  temperatureDifference?: number; // °F or °C
  temperatureDifferenceCategory?: 'small' | 'moderate' | 'large' | 'extreme';
}

export interface OccupancyHours {
  weekday: string;
  weekend: string;
}

export interface EnergyConsumption {
  electricBill: number;
  gasBill: number;
  oilBill?: number;
  propaneBill?: number;
  seasonalVariation: string;
  powerConsumption: number;
  occupancyPattern: string;
  occupancyHours: OccupancyHours;
  peakUsageTimes: string[];
  monthlyBill: number;
  season: string;
  durationHours?: number; // Duration hours for energy consumption calculation
  powerFactor?: number; // Power factor (0.8-1.0) for energy consumption calculation
  seasonalFactor?: number; // Seasonal factor (0.8-1.2) calculated from seasonalVariation
  occupancyFactor?: number; // Occupancy factor (0.6-1.0) calculated from occupancyPattern
}

// Product preferences interface
export interface ProductPreferences {
  categories: string[]; // Preferred product categories
  features: string[]; // Preferred product features
  budgetConstraint: number; // Maximum budget
}

export interface Lighting {
  bulbTypes: {
    led: number;
    cfl: number;
    incandescent: number;
  };
  naturalLight: string;
  controls: string;
}

export interface EnergyAuditData {
  basicInfo: BasicInfo;
  homeDetails: HomeDetails;
  currentConditions: CurrentConditions;
  heatingCooling: HeatingCooling;
  energyConsumption: EnergyConsumption;
  productPreferences?: ProductPreferences;
  lighting?: Lighting;
}

export type RecommendationPriority = 'high' | 'medium' | 'low';
export type RecommendationStatus = 'active' | 'implemented';

export interface AuditRecommendation {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  estimatedSavings: number;
  estimatedCost: number;
  paybackPeriod: number;
  actualSavings: number | null;
  implementationDate: string | null;
  implementationCost: number | null;
  lastUpdate: string;
  scope?: string; // Added: Area or scope of the recommendation (e.g., specific rooms)
  isEstimated?: boolean; // Added: Flag indicating if values are estimates
}

export interface EnergyAudit {
  id: string;
  userId: string;
  data: EnergyAuditData;
  recommendations: AuditRecommendation[];
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// Validation functions
export const validateBasicInfo = (info: BasicInfo): string[] => {
  const errors: string[] = [];
  
  if (!info.fullName) errors.push('Full name is required');
  if (!info.email) errors.push('Email is required');
  if (!info.phone) errors.push('Phone number is required');
  if (!info.address) errors.push('Address is required');
  if (!info.propertyType) errors.push('Property type is required');
  if (!info.yearBuilt) errors.push('Year built is required');
  if (!info.occupants) errors.push('Number of occupants is required');
  if (!info.auditDate) errors.push('Audit date is required');
  
  return errors;
};

export const validateHomeDetails = (details: HomeDetails): string[] => {
  const errors: string[] = [];
  
  if (!details.squareFootage) errors.push('Square footage is required');
  if (!details.stories) errors.push('Number of stories is required');
  if (!details.bedrooms) errors.push('Number of bedrooms is required');
  if (!details.bathrooms) errors.push('Number of bathrooms is required');
  if (!details.homeType) errors.push('Home type is required');
  if (!details.homeSize) errors.push('Home size is required');
  if (!details.numRooms) errors.push('Number of rooms is required');
  if (!details.numFloors) errors.push('Number of floors is required');
  if (!details.wallLength) errors.push('Wall length is required');
  if (!details.wallWidth) errors.push('Wall width is required');
  if (!details.ceilingHeight) errors.push('Ceiling height is required');
  if (!details.basementType) errors.push('Basement type is required');
  
  return errors;
};

// Lookup tables for condition ratings
export const conditionRatings = {
  poor: 0.4,
  fair: 0.6,
  good: 0.8,
  excellent: 1.0,
  'not-sure': 0.5
} as const;

export const insulationRatings = {
  poor: 0.3,
  average: 0.6,
  good: 0.8,
  excellent: 1.0,
  'not-sure': 0.5,
  'not-applicable': 0.0
} as const;

export const windowRatings = {
  single: 0.3,
  double: 0.7,
  triple: 0.9,
  'not-sure': 0.5
} as const;

import { TooltipItem } from 'chart.js';

// Chart.js tooltip context type
export interface ChartTooltipContext {
  raw: number;
  parsed: number;
  dataIndex: number;
  dataset: TooltipItem<any>;
  datasetIndex: number;
}
