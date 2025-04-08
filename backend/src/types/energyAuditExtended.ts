import {
  BasicInfo,
  HomeDetails,
  CurrentConditions,
  HeatingCooling,
  HeatingSystem,
  CoolingSystem,
  EnergyConsumption,
  EnergyAuditData,
  AuditRecommendation,
  RecommendationPriority,
  RecommendationStatus
} from './energyAudit.js';

/**
 * Extended interfaces for energy audit tool implementation
 * These interfaces extend the existing ones to include the additional data
 * required for the Python energy_audit_tool.py functionality
 */

// Extended energy consumption with factors from Python tool
export interface ExtendedEnergyConsumption extends EnergyConsumption {
  // New fields from Python tool
  seasonalFactor: number; // 0.8-1.2
  occupancyFactor: number; // 0.6-1.0
  powerFactor: number; // 0.8-1.0
  durationHours: number; // Hours of operation
}

// Extended heating system with additional fields from Python tool
export interface ExtendedHeatingSystem extends HeatingSystem {
  outputCapacity: number; // Output capacity in BTU/h
  inputPower: number; // Input power in kW
  targetEfficiency: number; // Target efficiency percentage
}

// Extended cooling system with additional fields from Python tool
export interface ExtendedCoolingSystem extends CoolingSystem {
  outputCapacity: number; // Output capacity in BTU/h
  inputPower: number; // Input power in kW
  targetEfficiency: number; // Target efficiency percentage
}

// Surface data for heat transfer calculations
export interface BuildingSurface {
  name: string;
  uValue: number; // Thermal transmittance (W/m²K)
  area: number; // Surface area (m²)
  type?: string; // Wall, roof, floor, window, etc.
}

// Extended HVAC with additional fields from Python tool
export interface ExtendedHeatingCooling extends HeatingCooling {
  heatingSystem: ExtendedHeatingSystem;
  coolingSystem: ExtendedCoolingSystem;
  temperatureDifference: number; // Indoor vs. outdoor temperature difference
  airDensity: number; // Default: 1.225 kg/m³
  specificHeat: number; // Default: 1005 J/kg·K
  surfaces?: BuildingSurface[]; // Building surfaces for heat transfer calculations
}

// Lighting fixture data
export interface LightingFixture {
  name: string;
  watts: number;
  hours: number; // Hours of use per day
  lumens: number;
  electricityRate: number; // $ per kWh
}

// Lighting data
export interface LightingData {
  fixtures: LightingFixture[];
  totalConsumption?: number; // Calculated field
  averageEfficiency?: number; // Calculated field
  totalAnnualConsumption?: number; // Calculated field
  totalAnnualCost?: number; // Calculated field
}

// Humidity data
export interface HumidityData {
  currentHumidity: number; // Current relative humidity percentage
  targetHumidity: number; // Target relative humidity percentage
  temperature: number; // Temperature for dew point calculations
  // Calculated fields
  humidityRatio?: number;
  dewPoint?: number;
  vaporPressure?: number;
  dehumidificationNeeds?: number;
}

// Product preferences
export interface ProductPreferences {
  categories: string[]; // Preferred product categories
  features: string[]; // Preferred product features
  budgetConstraint: number; // Maximum budget
}

// Extended current conditions with humidity and lighting data
export interface ExtendedCurrentConditions extends CurrentConditions {
  humidity: HumidityData;
  lighting: LightingData;
}

// Extended energy audit data with all extended interfaces
export interface ExtendedEnergyAuditData extends EnergyAuditData {
  currentConditions: ExtendedCurrentConditions;
  heatingCooling: ExtendedHeatingCooling;
  energyConsumption: ExtendedEnergyConsumption;
  productPreferences: ProductPreferences;
}

// Visualization data
export interface VisualizationData {
  id: string;
  auditId: string;
  visualizationType: string;
  data: any; // JSONB data
  createdAt: string;
}

// Extended recommendation with product recommendations
export interface ExtendedAuditRecommendation extends AuditRecommendation {
  productRecommendations: {
    productId: string;
    productName: string;
    relevanceScore: number;
  }[];
}

// Efficiency score components
export interface EfficiencyScores {
  energyScore: number;
  hvacScore: number;
  lightingScore: number;
  humidityScore: number;
  overallScore: number;
  interpretation: string;
}

// Financial analysis
export interface FinancialAnalysis {
  totalInvestmentRequired: number;
  annualSavingsPotential: number;
  simplePaybackPeriod: number;
  roi: number;
  componentAnalysis: {
    [key: string]: {
      investment: number;
      annualSavings: number;
      averagePayback: number;
    };
  };
}

// Extended energy audit with additional data
export interface ExtendedEnergyAudit {
  id: string;
  userId: string;
  data: ExtendedEnergyAuditData;
  recommendations: ExtendedAuditRecommendation[];
  efficiencyScores: EfficiencyScores;
  financialAnalysis: FinancialAnalysis;
  visualizations: VisualizationData[];
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
}
