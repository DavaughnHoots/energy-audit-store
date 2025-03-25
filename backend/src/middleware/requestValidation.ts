// backend/src/middleware/requestValidation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

interface ValidationSchemas {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
}

/**
 * Validates request data (body, query, params) against Zod schemas
 * @param {ValidationSchemas} schemas - Object containing Zod schemas for body, query, and/or params
 * @returns {function} Express middleware function
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body if schema provided
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      
      // Validate query parameters if schema provided
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      
      // Validate URL parameters if schema provided
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: formattedErrors
        });
      }
      
      // For unexpected errors
      console.error('Request validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during request validation'
      });
    }
  };
};
