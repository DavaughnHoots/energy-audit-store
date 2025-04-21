/**
 * Schema definitions for product estimations
 * Using native TypeScript types instead of Zod
 */

// Type definitions (formerly Zod schemas)

/** Base configuration with version */
export interface EstimationConfigBase {
  schemaVersion: string; // Format: "2025-04-v1"
  lastUpdated: string; // ISO datetime
}

/** Reference data for calculations */
export interface ReferenceData {
  electricityRatesUSDPerkWh: Record<string, number>;
  iefThresholds: {
    dehumidifiers: {
      portable: {
        small: {
          standard: number;
          energyStar: number;
          mostEfficient: number;
        };
        medium: {
          standard: number;
          energyStar: number;
          mostEfficient: number;
        };
        large: {
          standard: number;
          energyStar: number;
          mostEfficient: number;
        };
      };
      wholehouse: {
        standard: number;
        energyStar: number;
        mostEfficient: number;
      };
    };
  };
  confidenceThresholds: {
    medium: number;
    high: number;
  };
}

/** Dehumidifier configuration */
export interface DehumidifierConfig {
  priceParameters: {
    basePrice: number;
    capacityMultiplier: number;
    energyStarPremium: number;
    mostEfficientPremium: number;
  };
  energyMetrics: {
    standardIEF: number;
    energyStarIEF: number;
    mostEfficientIEF: number;
  };
  defaults: {
    annualRunDays: number;
    dailyRunHours: number;
  };
  efficiencyRatings: Record<string, string>;
}

/** Refrigerator placeholder */
export interface RefrigeratorConfig {
  _placeholder: boolean;
}

/** HVAC placeholder */
export interface HvacConfig {
  _placeholder: boolean;
}

/** Combined configuration */
export interface ProductEstimationsConfig extends EstimationConfigBase {
  referenceData: ReferenceData;
  dehumidifiers: DehumidifierConfig;
  refrigerators: RefrigeratorConfig;
  hvac: HvacConfig;
}

/** Category-specific configuration types */
export interface DehumidifierCategoryConfig extends DehumidifierConfig {
  category: 'dehumidifiers';
}

export interface RefrigeratorCategoryConfig extends RefrigeratorConfig {
  category: 'refrigerators';
}

export interface HvacCategoryConfig extends HvacConfig {
  category: 'hvac';
}

export type ProductCategoryConfig = 
  | DehumidifierCategoryConfig
  | RefrigeratorCategoryConfig
  | HvacCategoryConfig;

export type ProductCategory = ProductCategoryConfig['category'];

/**
 * Validation functions
 */

/**
 * Simple validation helper for configs
 * @param config The configuration to validate
 * @returns The validated configuration
 */
export function validateConfig(config: unknown): ProductEstimationsConfig {
  // Basic runtime type checking
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be an object');
  }
  
  const typedConfig = config as ProductEstimationsConfig;
  
  // Check essential properties
  if (!typedConfig.schemaVersion) {
    throw new Error('Missing schemaVersion in configuration');
  }
  
  if (!typedConfig.referenceData) {
    throw new Error('Missing referenceData in configuration');
  }
  
  if (!typedConfig.dehumidifiers) {
    throw new Error('Missing dehumidifiers configuration');
  }
  
  // Return typed config
  return typedConfig;
}

/**
 * Validate category-specific configuration
 * @param categoryConfig The configuration to validate
 * @returns The validated configuration
 */
export function validateCategoryConfig(categoryConfig: unknown): ProductCategoryConfig {
  if (!categoryConfig || typeof categoryConfig !== 'object') {
    throw new Error('Category configuration must be an object');
  }
  
  const typedConfig = categoryConfig as ProductCategoryConfig;
  
  if (!typedConfig.category) {
    throw new Error('Missing category in configuration');
  }
  
  // Validate based on category
  switch (typedConfig.category) {
    case 'dehumidifiers':
      // Add more validation if needed
      break;
    case 'refrigerators':
    case 'hvac':
      // Add more validation if needed
      break;
    default:
      throw new Error('Unknown category: ' + String(typedConfig.category));
  }
  
  return typedConfig;
}
