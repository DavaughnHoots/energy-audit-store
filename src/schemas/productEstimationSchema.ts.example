import { z } from 'zod';

// Base estimation configuration schema with version
export const estimationConfigBaseSchema = z.object({
  schemaVersion: z.string().regex(/^\d{4}-\d{2}-v\d+$/), // Format: "2025-04-v1"
  lastUpdated: z.string().datetime(), // ISO datetime
});

// State code validator for electricity rates map
const stateCodePattern = /^[A-Z]{2}$|^US-avg$/; // Allow US-avg special code

// Reference data schema with tightened validation
export const referenceDataSchema = z.object({
  electricityRatesUSDPerkWh: z.record(
    z.string().regex(stateCodePattern, "Must be a valid state code (XX) or 'US-avg'"), 
    z.number().positive().lt(1.0, "Electricity rates should be less than $1.00 per kWh")
  ),
  iefThresholds: z.object({
    dehumidifiers: z.object({
      portable: z.object({
        small: z.object({
          standard: z.number().min(1.0).max(5.0),
          energyStar: z.number().min(1.57).max(5.0),
          mostEfficient: z.number().min(2.5).max(5.0),
        }),
        medium: z.object({
          standard: z.number().min(1.0).max(5.0),
          energyStar: z.number().min(1.57).max(5.0),
          mostEfficient: z.number().min(2.5).max(5.0),
        }),
        large: z.object({
          standard: z.number().min(1.0).max(5.0),
          energyStar: z.number().min(1.57).max(5.0),
          mostEfficient: z.number().min(2.5).max(5.0),
        }),
      }),
      wholehouse: z.object({
        standard: z.number().min(1.0).max(5.0),
        energyStar: z.number().min(1.57).max(5.0),
        mostEfficient: z.number().min(2.5).max(5.0),
      }),
    }),
  }),
  confidenceThresholds: z.object({
    medium: z.number().min(0).max(100),
    high: z.number().min(0).max(100),
  }),
});

// Dehumidifier-specific schema
export const dehumidifierConfigSchema = z.object({
  priceParameters: z.object({
    basePrice: z.number().positive(),
    capacityMultiplier: z.number().positive(),
    energyStarPremium: z.number().nonnegative(),
    mostEfficientPremium: z.number().nonnegative(),
  }),
  energyMetrics: z.object({
    standardIEF: z.number().min(1.0).max(5.0), // Reasonable IEF range
    energyStarIEF: z.number().min(1.57).max(5.0), // Current ENERGY STAR threshold for small units
    mostEfficientIEF: z.number().min(2.5).max(5.0), // Higher threshold for "Most Efficient"
  }),
  defaults: z.object({
    annualRunDays: z.number().int().positive().max(365),
    dailyRunHours: z.number().positive().max(24),
  }),
  efficiencyRatings: z.record(z.string(), z.string()),
});

// Refrigerator placeholder schema
export const refrigeratorConfigSchema = z.object({
  _placeholder: z.literal(true),
});

// HVAC placeholder schema
export const hvacConfigSchema = z.object({
  _placeholder: z.literal(true),
});

// Combined configuration schema
export const productEstimationsSchema = estimationConfigBaseSchema.extend({
  referenceData: referenceDataSchema,
  dehumidifiers: dehumidifierConfigSchema,
  refrigerators: refrigeratorConfigSchema,
  hvac: hvacConfigSchema,
});

// Discriminated union for category-specific payloads
export const productEstimationsUnion = z.discriminatedUnion("category", [
  dehumidifierConfigSchema.extend({ category: z.literal("dehumidifiers") }),
  refrigeratorConfigSchema.extend({ category: z.literal("refrigerators") }),
  hvacConfigSchema.extend({ category: z.literal("hvac") }),
]);

// Type exports for consumption by estimators
export type ReferenceData = z.infer<typeof referenceDataSchema>;
export type DehumidifierConfig = z.infer<typeof dehumidifierConfigSchema>;
export type RefrigeratorConfig = z.infer<typeof refrigeratorConfigSchema>;
export type HvacConfig = z.infer<typeof hvacConfigSchema>;
export type ProductEstimationsConfig = z.infer<typeof productEstimationsSchema>;
export type ProductCategory = z.infer<typeof productEstimationsUnion>["category"];

// Validation utility function
export function validateConfig(config: unknown): ProductEstimationsConfig {
  try {
    return productEstimationsSchema.parse(config);
  } catch (error) {
    console.error('Invalid product estimations configuration:', error);
    throw new Error('Product estimations configuration validation failed');
  }
}

// Validation utility for single category payload
export function validateCategoryConfig(categoryConfig: unknown): z.infer<typeof productEstimationsUnion> {
  try {
    return productEstimationsUnion.parse(categoryConfig);
  } catch (error) {
    console.error('Invalid category configuration:', error);
    throw new Error('Category configuration validation failed');
  }
}
