/**
 * Express middleware for validating requests using express-validator
 * Checks for validation errors and returns appropriate error responses
 */

import { validationResult } from 'express-validator';
import { appLogger } from '../config/logger.js';

/**
 * Middleware to validate request data using express-validator
 * Must be used after express-validator validation chains
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      return {
        param: err.param,
        message: err.msg,
        value: err.value
      };
    });
    
    appLogger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      errors: errorMessages,
      userId: req.user?.id
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};
