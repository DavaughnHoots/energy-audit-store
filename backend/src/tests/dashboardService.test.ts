/// <reference types="jest" />

import { Pool, QueryResult } from 'pg';
import { dashboardService } from '../services/dashboardService.js';
import { cache } from '../config/cache.js';
import { appLogger } from '../config/logger.js';
import '@types/jest';

// Mock dependencies
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('../config/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../config/logger', () => ({
  appLogger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('DashboardService', () => {
  let pool: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = (new Pool() as unknown) as jest.Mocked<Pool>;
  });

  describe('getUserStats', () => {
    const mockUserId = 'test-user-id';
    const mockStats: QueryResult = {
      rows: [{
        total_estimated_savings: 1000,
        total_actual_savings: 800,
        overall_accuracy: 80,
        completed_audits: 2,
        active_recommendations: 3,
        implemented_changes: 1,
        last_updated: new Date().toISOString()
      }],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    };

    const mockMonthlySavings: QueryResult = {
      rows: [
        {
          month: '2025-02',
          estimated: '100',
          actual: '80'
        }
      ],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    };

    const mockRecommendations: QueryResult = {
      rows: [
        {
          id: 'rec-1',
          title: 'Test Recommendation',
          description: 'Test Description',
          priority: 'high',
          status: 'active',
          estimated_savings: '500',
          actual_savings: '400',
          implementation_date: null,
          implementation_cost: null,
          last_update: new Date().toISOString()
        }
      ],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    };

    it('should return cached stats if available', async () => {
      const cachedStats = {
        totalSavings: { estimated: 1000, actual: 800, accuracy: 80 },
        completedAudits: 2,
        activeRecommendations: 3,
        implementedChanges: 1
      };

      (cache.get as jest.Mock).mockResolvedValueOnce(cachedStats);

      const result = await dashboardService.getUserStats(mockUserId);
      expect(result).toEqual(cachedStats);
      expect(cache.get).toHaveBeenCalledWith(`dashboard_stats:${mockUserId}`);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should fetch and cache stats if not cached', async () => {
      (cache.get as jest.Mock).mockResolvedValueOnce(null);
      (pool.query as jest.Mock)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockMonthlySavings)
        .mockResolvedValueOnce(mockRecommendations);

      const result = await dashboardService.getUserStats(mockUserId);

      expect(result.totalSavings.estimated).toBe(1000);
      expect(result.totalSavings.actual).toBe(800);
      expect(result.monthlySavings).toHaveLength(1);
      expect(result.recommendations).toHaveLength(1);
      expect(cache.set).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (cache.get as jest.Mock).mockResolvedValueOnce(null);
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(dashboardService.getUserStats(mockUserId))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateRecommendationStatus', () => {
    const mockUserId = 'test-user-id';
    const mockRecommendationId = 'test-rec-id';
    const mockStatus = 'implemented';
    const mockDate = new Date();

    it('should update recommendation status successfully', async () => {
      const mockResult: QueryResult = { rows: [], command: '', rowCount: 1, oid: 0, fields: [] };
      (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      await dashboardService.updateRecommendationStatus(
        mockUserId,
        mockRecommendationId,
        mockStatus as any,
        mockDate
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [mockStatus, mockDate, mockRecommendationId, mockUserId]
      );
      expect(cache.del).toHaveBeenCalledWith(`dashboard_stats:${mockUserId}`);
    });

    it('should handle update errors gracefully', async () => {
      const error = new Error('Update failed');
      (pool.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        dashboardService.updateRecommendationStatus(
          mockUserId,
          mockRecommendationId,
          mockStatus as any,
          mockDate
        )
      ).rejects.toThrow('Update failed');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateActualSavings', () => {
    const mockUserId = 'test-user-id';
    const mockRecommendationId = 'test-rec-id';
    const mockMonth = new Date();
    const mockUpdate = {
      actualSavings: 100,
      implementationCost: 500,
      notes: 'Test update'
    };

    it('should update savings successfully', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 1, oid: 0, fields: [] });

      await dashboardService.updateActualSavings(
        mockUserId,
        mockRecommendationId,
        mockMonth,
        mockUpdate
      );

      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(cache.del).toHaveBeenCalledWith(`dashboard_stats:${mockUserId}`);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
      const error = new Error('Update failed');
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 1, oid: 0, fields: [] })
        .mockRejectedValueOnce(error);

      await expect(
        dashboardService.updateActualSavings(
          mockUserId,
          mockRecommendationId,
          mockMonth,
          mockUpdate
        )
      ).rejects.toThrow('Update failed');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(appLogger.error).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
