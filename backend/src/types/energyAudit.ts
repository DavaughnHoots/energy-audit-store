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
}

export interface InsulationInfo {
  attic: string;
  walls: string;
  basement: string;
  floor: string;
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
}

export interface HeatingSystem {
  type: string;
  fuel: string;
  fuelType: string;
  age: number;
  efficiency: number;
  lastService: string;
}

export interface CoolingSystem {
  type: string;
  age: number;
  efficiency: number;
}

export interface HeatingCooling {
  heatingSystem: HeatingSystem;
  coolingSystem: CoolingSystem;
  thermostatType: string;
  zoneCount: number;
  systemPerformance: 'works-well' | 'some-problems' | 'needs-attention';
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
}

export interface EnergyAuditData {
  basicInfo: BasicInfo;
  homeDetails: HomeDetails;
  currentConditions: CurrentConditions;
  heatingCooling: HeatingCooling;
  energyConsumption: EnergyConsumption;
}

export type RecommendationPriority = 'high' | 'medium' | 'low';
export type RecommendationStatus = 'active' | 'implemented';

export interface AuditRecommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  estimatedSavings: number;
  estimatedCost: number;
  paybackPeriod: number;
  actualSavings: number | null;
  implementationDate: string | null;
  implementationCost: number | null;
  lastUpdate: string;
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

// Chart.js tooltip context type
export interface ChartTooltipContext {
  raw: number;
  parsed: number;
}
