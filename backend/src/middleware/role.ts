import { Request, Response, NextFunction } from 'express';
import { appLogger } from '../utils/logger.js';

/**
 * Middleware to ensure user has required role(s)
 * @param roles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists on request (added by authentication middleware)
    if (!req.user) {
      appLogger.warn('Unauthorized access attempt - No user found in request', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has the required role
    if (roles.includes(req.user.role)) {
      return next();
    }

    // Log unauthorized access attempts
    appLogger.warn('Forbidden access attempt - User does not have required role', {
      path: req.path,
      method: req.method,
      userRole: req.user.role,
      requiredRoles: roles,
      userId: req.user.id
    });

    // User doesn't have the required role
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. You do not have the required permissions.'
    });
  };
};
