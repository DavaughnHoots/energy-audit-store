/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express';
import { reportRateLimit, trackReportGeneration } from '../middleware/reportRateLimit';
import { appLogger } from '../config/logger.js';
import '@types/jest';

// Extend Express Request type
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Create Jest mock types
type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
  set: jest.Mock;
  on: jest.Mock;
} & Partial<Response>;

// Mock dependencies
jest.mock('../config/logger', () => ({
  appLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Report Rate Limiting Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: MockResponse;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      user: { id: 'test-user-id', email: 'test@example.com' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn(),
      on: jest.fn(),
    } as MockResponse;
    nextFunction = jest.fn();
  });

  describe('reportRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      await reportRateLimit(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle unauthorized requests', async () => {
      mockRequest.user = undefined;

      await reportRateLimit(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle rate limit exceeded', async () => {
      // Make multiple requests to exceed rate limit
      for (let i = 0; i < 6; i++) {
        await reportRateLimit(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );
      }

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many report generation requests',
        })
      );
      expect(mockResponse.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    });

    it('should cleanup rate limiter on request finish', async () => {
      const finishCallback = jest.fn();
      mockResponse.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback();
          callback();
        }
      });

      await reportRateLimit(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(finishCallback).toHaveBeenCalled();
    });
  });

  describe('trackReportGeneration', () => {
    it('should track concurrent report generations', async () => {
      // First request should pass
      await trackReportGeneration(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();

      // Second request should pass
      nextFunction.mockClear();
      await trackReportGeneration(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();

      // Third request should be blocked
      nextFunction.mockClear();
      await trackReportGeneration(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many concurrent report generations',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should cleanup tracking on request finish', async () => {
      const finishCallback = jest.fn();
      mockResponse.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback();
          callback();
        }
      });

      await trackReportGeneration(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(finishCallback).toHaveBeenCalled();

      // Next request should pass after cleanup
      nextFunction.mockClear();
      await trackReportGeneration(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle unauthorized requests', async () => {
      mockRequest.user = undefined;

      await trackReportGeneration(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
