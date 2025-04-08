// backend/src/middleware/validators.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// User validation schemas
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Energy audit validation schemas
const homeDetailsSchema = z.object({
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()),
  homeSize: z.number().min(100).max(50000),
  numRooms: z.number().min(1).max(100),
  homeType: z.enum(['apartment', 'single-family', 'townhouse', 'duplex', 'other']),
  numFloors: z.number().min(1).max(100),
  basementType: z.enum(['full', 'partial', 'crawlspace', 'slab', 'none', 'other'])
});

const currentConditionsSchema = z.object({
  insulation: z.object({
    attic: z.enum(['poor', 'average', 'good', 'excellent', 'not-sure']),
    walls: z.enum(['poor', 'average', 'good', 'excellent', 'not-sure']),
    basement: z.enum(['poor', 'average', 'good', 'excellent', 'not-sure']),
    floor: z.enum(['poor', 'average', 'good', 'excellent', 'not-sure'])
  }),
  windowType: z.enum(['single', 'double', 'triple', 'not-sure']),
  numWindows: z.number().min(0),
  windowCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  weatherStripping: z.enum(['door-sweep', 'foam', 'metal', 'none', 'not-sure'])
});

const heatingCoolingSchema = z.object({
  heatingSystem: z.object({
    type: z.enum(['furnace', 'boiler', 'heat-pump', 'electric-baseboard', 'other']),
    fuelType: z.enum(['natural-gas', 'oil', 'electric', 'propane', 'other']),
    age: z.number().min(0).max(100),
    lastService: z.string().datetime()
  }),
  coolingSystem: z.object({
    type: z.enum(['central', 'window-unit', 'portable', 'none']),
    age: z.number().min(0).max(100)
  })
});

const energyUsageSchema = z.object({
  month: z.string().datetime(),
  consumption: z.number().positive(),
  cost: z.number().positive()
});

const userSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  theme: z.enum(['light', 'dark']),
  currency: z.string().length(3),
  unitSystem: z.enum(['imperial', 'metric'])
});

// Validator middleware factory
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        next(error);
      }
    }
  };
};

// Export validator middlewares
export const validators = {
  validateUser: validate(userSchema),
  validateLogin: validate(loginSchema),
  validateHomeDetails: validate(homeDetailsSchema),
  validateCurrentConditions: validate(currentConditionsSchema),
  validateHeatingCooling: validate(heatingCoolingSchema),
  validateEnergyUsage: validate(energyUsageSchema),
  validateUserSettings: validate(userSettingsSchema),
  
  // Combined audit data validation
  validateAuditData: (req: Request, res: Response, next: NextFunction) => {
    const auditSchema = z.object({
      homeDetails: homeDetailsSchema,
      currentConditions: currentConditionsSchema,
      heatingCooling: heatingCoolingSchema
    });

    try {
      auditSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Audit data validation failed',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  }
};

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({ path: err.path.join('.'), message: err.message }))
        });
      }
    }
  }
};