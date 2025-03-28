// backend/src/validators/homeAudit.validator.ts

import { z } from 'zod';
import { appLogger } from '../config/logger.js';

// Basic info validation schema
const basicInfoSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  email: z.string()
    .email('Invalid email format'),
  phone: z.string()
    .regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone number format')
    .optional(),
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must not exceed 200 characters'),
  auditDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

// Home details validation schema
const homeDetailsSchema = z.object({
  yearBuilt: z.number()
    .int('Year must be a whole number')
    .min(1800, 'Year built must be after 1800')
    .max(new Date().getFullYear(), 'Year built cannot be in the future'),
  homeSize: z.number()
    .positive('Home size must be positive')
    .min(100, 'Home size must be at least 100 sq ft')
    .max(50000, 'Home size must not exceed 50,000 sq ft'),
  numRooms: z.number()
    .int('Number of rooms must be a whole number')
    .min(1, 'Must have at least 1 room')
    .max(100, 'Number of rooms must not exceed 100'),
  homeType: z.enum(['apartment', 'single-family', 'townhouse', 'duplex', 'condominium', 'other'], {
    errorMap: () => ({ message: 'Invalid home type selected' })
  }),
  numFloors: z.number()
    .int('Number of floors must be a whole number')
    .min(1, 'Must have at least 1 floor')
    .max(100, 'Number of floors must not exceed 100'),
  basementType: z.enum(['full', 'partial', 'crawlspace', 'slab', 'none', 'other'], {
    errorMap: () => ({ message: 'Invalid basement type selected' })
  }),
  basementHeating: z.enum(['heated', 'unheated', 'partial'])
    .optional()
});

// Current conditions validation schema
const insulationRatingSchema = z.enum(['poor', 'average', 'good', 'excellent', 'not-sure', 'not-applicable']);

const currentConditionsSchema = z.object({
  insulation: z.object({
    attic: insulationRatingSchema,
    walls: insulationRatingSchema,
    basement: insulationRatingSchema,
    floor: insulationRatingSchema
  }),
  windowType: z.enum(['single', 'double', 'triple', 'not-sure']),
  numWindows: z.number()
    .int('Number of windows must be a whole number')
    .min(0, 'Number of windows cannot be negative'),
  windowCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  weatherStripping: z.enum(['door-sweep', 'foam', 'metal', 'none', 'not-sure'])
});

// HVAC systems validation schema
const hvacSchema = z.object({
  heatingSystem: z.object({
    type: z.enum(['furnace', 'boiler', 'heat-pump', 'central-heating', 'electric-baseboard', 'other']),
    fuelType: z.enum(['natural-gas', 'oil', 'electric', 'propane', 'other']),
    age: z.number()
      .int('System age must be a whole number')
      .min(0, 'System age cannot be negative')
      .max(100, 'System age seems too high'),
    lastService: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    outputCapacity: z.number()
      .positive('Output capacity must be positive')
      .optional(),
    inputPower: z.number()
      .positive('Input power must be positive')
      .optional(),
    targetEfficiency: z.number()
      .positive('Target efficiency must be positive')
      .max(100, 'Efficiency cannot exceed 100%')
      .optional()
  }),
  coolingSystem: z.object({
    type: z.enum(['central', 'window-unit', 'portable', 'none']),
    age: z.number()
      .int('System age must be a whole number')
      .min(0, 'System age cannot be negative')
      .max(100, 'System age seems too high'),
    outputCapacity: z.number()
      .positive('Output capacity must be positive')
      .optional(),
    inputPower: z.number()
      .positive('Input power must be positive')
      .optional(),
    targetEfficiency: z.number()
      .positive('Target efficiency must be positive')
      .max(100, 'Efficiency cannot exceed 100%')
      .optional()
  }),
  temperatureDifference: z.number()
    .min(0, 'Temperature difference cannot be negative')
    .max(50, 'Temperature difference seems too high')
    .optional(),
  temperatureDifferenceCategory: z.enum(['small', 'moderate', 'large', 'extreme'])
    .optional()
});

// Energy consumption validation schema
const energyConsumptionSchema = z.object({
  powerConsumption: z.number()
    .positive('Power consumption must be positive'),
  occupancyHours: z.object({
    weekday: z.string(),
    weekend: z.string()
  }),
  season: z.string().optional(),
  occupancyPattern: z.string()
    .min(3, 'Occupancy pattern description required')
    .max(200, 'Occupancy pattern description too long'),
  monthlyBill: z.number()
    .positive('Monthly bill must be positive')
    .max(10000, 'Monthly bill seems unusually high'),
  peakUsageTimes: z.array(z.string())
    .optional(),
  electricBill: z.number()
    .nonnegative('Electric bill cannot be negative'),
  gasBill: z.number()
    .nonnegative('Gas bill cannot be negative'),
  seasonalVariation: z.string(),
  // New fields
  durationHours: z.number()
    .min(0, 'Duration hours cannot be negative')
    .max(24, 'Duration hours cannot exceed 24')
    .optional(),
  powerFactor: z.number()
    .min(0.8, 'Power factor must be at least 0.8')
    .max(1.0, 'Power factor cannot exceed 1.0')
    .optional()
});

// Complete audit data validation schema
const energyAuditSchema = z.object({
  basicInfo: basicInfoSchema,
  homeDetails: homeDetailsSchema,
  currentConditions: currentConditionsSchema,
  heatingCooling: hvacSchema,
  energyConsumption: energyConsumptionSchema
});

// Validation function that returns typed results
export type ValidationResult =
  | { success: true; data: z.infer<typeof energyAuditSchema>; errors?: never }
  | { success: false; errors: z.ZodError; data?: never };

export const validateEnergyAudit = (data: unknown): ValidationResult => {
  try {
    const validatedData = energyAuditSchema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      appLogger.warn('Energy audit validation failed', {
        errors: error.errors
      });
      return {
        success: false,
        errors: error
      };
    }
    throw error;
  }
};

// Validation function for partial updates
export const validatePartialEnergyAudit = (data: unknown): ValidationResult => {
  try {
    const validatedData = energyAuditSchema.partial().parse(data);
    return {
      success: true,
      data: validatedData as z.infer<typeof energyAuditSchema>
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      appLogger.warn('Partial energy audit validation failed', {
        errors: error.errors
      });
      return {
        success: false,
        errors: error
      };
    }
    throw error;
  }
};

// Individual section validators for step-by-step validation
export const validateBasicInfo = (data: unknown) => {
  return basicInfoSchema.safeParse(data);
};

export const validateHomeDetails = (data: unknown) => {
  return homeDetailsSchema.safeParse(data);
};

export const validateCurrentConditions = (data: unknown) => {
  return currentConditionsSchema.safeParse(data);
};

export const validateHVAC = (data: unknown) => {
  return hvacSchema.safeParse(data);
};

export const validateEnergyConsumption = (data: unknown) => {
  return energyConsumptionSchema.safeParse(data);
};

// Export types for use in other parts of the application
export type EnergyAuditType = z.infer<typeof energyAuditSchema>;
export type BasicInfoType = z.infer<typeof basicInfoSchema>;
export type HomeDetailsType = z.infer<typeof homeDetailsSchema>;
export type CurrentConditionsType = z.infer<typeof currentConditionsSchema>;
export type HVACType = z.infer<typeof hvacSchema>;
export type EnergyConsumptionType = z.infer<typeof energyConsumptionSchema>;
