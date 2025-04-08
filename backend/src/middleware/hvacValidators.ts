import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { appLogger } from '../config/logger.js';

const heatingSystemSchema = z.object({
  type: z.enum(['furnace', 'boiler', 'heat-pump', 'electric-baseboard', 'other'], {
    required_error: "Heating system type is required"
  }),
  fuelType: z.enum(['natural-gas', 'oil', 'electric', 'propane', 'other'], {
    required_error: "Fuel type is required"
  }),
  age: z.number()
    .int()
    .min(0, "Age cannot be negative")
    .max(100, "Age seems unrealistic"),
  lastService: z.string()
    .datetime({ message: "Invalid service date" })
    .optional()
    .nullable(),
  efficiency: z.string()
    .regex(/^\d{1,2}(\.\d{1,2})?$/, "Invalid efficiency rating format")
    .optional()
    .nullable(),
  issues: z.array(z.string())
});

const coolingSystemSchema = z.object({
  type: z.enum(['central', 'window-unit', 'portable', 'none'], {
    required_error: "Cooling system type is required"
  }),
  age: z.number()
    .int()
    .min(0, "Age cannot be negative")
    .max(50, "Age seems unrealistic"),
  lastService: z.string()
    .datetime({ message: "Invalid service date" })
    .optional()
    .nullable(),
  seerRating: z.string()
    .regex(/^\d{1,2}(\.\d{1,2})?$/, "Invalid SEER rating format")
    .optional()
    .nullable(),
  issues: z.array(z.string())
});

const ventilationSchema = z.object({
  hasErv: z.boolean(),
  hasProgrammableThermostat: z.boolean(),
  hasSmartThermostat: z.boolean(),
  hasZoning: z.boolean(),
  filterChangeFrequency: z.enum([
    'monthly',
    'quarterly',
    'biannual',
    'annual',
    'unknown'
  ])
});

const maintenanceSchema = z.object({
  regularService: z.boolean(),
  serviceProvider: z.string()
    .max(100, "Service provider name too long")
    .optional()
    .nullable(),
  lastInspection: z.string()
    .datetime({ message: "Invalid inspection date" })
    .optional()
    .nullable(),
  plannedUpgrades: z.boolean()
});

const hvacDataSchema = z.object({
  heating: heatingSystemSchema,
  cooling: coolingSystemSchema,
  ventilation: ventilationSchema,
  maintenance: maintenanceSchema
}).refine(
  (data) => {
    // Additional validation for heat pumps
    if (data.heating.type === 'heat-pump' && !data.heating.efficiency) {
      return false;
    }
    // Validation for central AC SEER rating
    if (data.cooling.type === 'central' && !data.cooling.seerRating) {
      return false;
    }
    return true;
  },
  {
    message: "Missing required efficiency ratings for system type",
    path: ["systemEfficiency"]
  }
);

export const validateHVACData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = hvacDataSchema.parse(req.body);
    
    // Additional business logic validation
    const currentYear = new Date().getFullYear();
    const lastServiceDate = new Date(validatedData.heating.lastService || '');
    const lastInspectionDate = new Date(validatedData.maintenance.lastInspection || '');

    // Check if service date is in the future
    if (lastServiceDate > new Date()) {
      return res.status(400).json({
        error: 'Service date cannot be in the future'
      });
    }

    // Check if inspection date is in the future
    if (lastInspectionDate > new Date()) {
      return res.status(400).json({
        error: 'Inspection date cannot be in the future'
      });
    }

    // Validate SEER rating range
    if (validatedData.cooling.seerRating) {
      const seerValue = parseFloat(validatedData.cooling.seerRating);
      if (seerValue < 13 || seerValue > 30) {
        return res.status(400).json({
          error: 'SEER rating must be between 13 and 30'
        });
      }
    }

    // Store validated data in request for next middleware
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      appLogger.warn('HVAC data validation failed:', {
        errors: error.errors
      });
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
};

export type HVACData = z.infer<typeof hvacDataSchema>;
