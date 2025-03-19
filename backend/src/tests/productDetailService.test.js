const { productRecommendationService } = require('../services/productRecommendationService');
const { pool } = require('../config/database');

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  appLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Product Detail Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getDetailedProductInfo', () => {
    it('should return null when product is not found', async () => {
      // Mock database query to return empty results
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await productRecommendationService.getDetailedProductInfo('non-existent-id', 'user123');
      
      expect(result).toBeNull();
      expect(pool.query).toHaveBeenCalledTimes(3); // Main product query + comparisons query + recommendations query
    });

    it('should return detailed real product data when found', async () => {
      // Mock database query to return a real product
      const mockProduct = {
        id: 'product123',
        name: 'Energy Efficient HVAC',
        main_category: 'HVAC',
        price: '3500',
        efficiency_rating: 'High',
        features: 'Energy Star Certified,Smart Thermostat Compatible',
        description: 'A highly efficient HVAC system',
        annual_savings: '500',
        roi: '0.14',
        payback_period: '7',
        audit_id: 'audit123',
        audit_date: '2025-01-01T00:00:00.000Z'
      };

      // Mock audit context data
      const mockAuditData = {
        id: 'audit123',
        created_at: '2025-01-01T00:00:00.000Z',
        home_details: JSON.stringify({
          squareFootage: 2000,
          propertyType: 'residential',
          yearBuilt: 2000,
          location: 'New York',
          occupants: 4
        }),
        energy_consumption: JSON.stringify({
          electricityUsage: 1000,
          electricBill: 150,
          gasUsage: 100,
          gasBill: 120
        })
      };

      pool.query.mockResolvedValueOnce({ rows: [mockProduct] });
      pool.query.mockResolvedValueOnce({ rows: [mockAuditData] });

      const result = await productRecommendationService.getDetailedProductInfo('product123', 'user123');
      
      expect(result).not.toBeNull();
      expect(result.id).toBe('product123');
      expect(result.name).toBe('Energy Efficient HVAC');
      expect(result.category).toBe('HVAC');
      expect(result.price).toBe(3500);
      expect(result.features).toHaveLength(2);
      expect(result.features).toContain('Energy Star Certified');
      expect(result.auditContext).toBeDefined();
      expect(result.enhancedMetrics).toBeDefined();
      expect(result.isSample).toBe(false);
    });

    it('should return sample product from comparison history', async () => {
      // Mock database queries to return empty rows for real product
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock comparison query with sample product
      const mockSampleProduct = {
        products: JSON.stringify([
          {
            id: 'sample-hvac-123',
            name: 'Sample HVAC System',
            category: 'HVAC',
            price: 3500,
            energyEfficiency: 'High',
            features: ['Energy Star Certified', 'Smart Thermostat Compatible'],
            description: 'A sample HVAC system',
            annualSavings: 500,
            roi: 0.14,
            paybackPeriod: 7,
            isSampleProduct: true
          }
        ])
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockSampleProduct] });
      
      // Mock default audit context
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      const result = await productRecommendationService.getDetailedProductInfo('sample-hvac-123', 'user123');
      
      expect(result).not.toBeNull();
      expect(result.id).toBe('sample-hvac-123');
      expect(result.name).toBe('Sample HVAC System');
      expect(result.category).toBe('HVAC');
      expect(result.features).toContain('Energy Star Certified');
      expect(result.auditContext).toBeDefined();
      expect(result.enhancedMetrics).toBeDefined();
      expect(result.isSample).toBe(true);
    });
  });

  describe('calculateEnhancedProductMetrics', () => {
    it('should calculate accurate metrics for a product', () => {
      const mockProduct = {
        price: 3500,
        annualSavings: 500,
        roi: 0.14,
        paybackPeriod: 7,
        category: 'HVAC'
      };

      const mockAuditContext = {
        energyInfo: {
          electricityCost: 1500,
          gasCost: 1200
        }
      };

      const result = productRecommendationService.calculateEnhancedProductMetrics(mockProduct, mockAuditContext);
      
      expect(result.fiveYearSavings).toBe(500 * 5);
      expect(result.tenYearSavings).toBe(500 * 10);
      expect(result.monthlySavings).toBe(500 / 12);
      expect(result.percentageReduction).toBeGreaterThan(0);
      expect(result.co2Reduction).toBeDefined();
      expect(result.co2Reduction.annual).toBeGreaterThan(0);
    });

    it('should handle invalid inputs gracefully', () => {
      const mockProduct = {};
      const mockAuditContext = {};

      const result = productRecommendationService.calculateEnhancedProductMetrics(mockProduct, mockAuditContext);
      
      expect(result.fiveYearSavings).toBe(0);
      expect(result.tenYearSavings).toBe(0);
      expect(result.monthlySavings).toBe(0);
      expect(result.percentageReduction).toBe(0);
      expect(result.co2Reduction.annual).toBe(0);
    });
  });

  describe('CO2 reduction calculations', () => {
    it('should calculate CO2 reduction based on product category', () => {
      // Test different product categories to ensure they calculate CO2 differently
      const testCategories = ['HVAC', 'Lighting', 'Insulation', 'Windows', 'Appliances', 'Other'];
      
      const mockAuditContext = {
        energyInfo: {
          electricityCost: 1500,
          gasCost: 1200
        }
      };
      
      // Store results for each category
      const results = {};
      
      testCategories.forEach(category => {
        const mockProduct = {
          category,
          annualSavings: 500
        };
        
        const metrics = productRecommendationService.calculateEnhancedProductMetrics(mockProduct, mockAuditContext);
        results[category] = metrics.co2Reduction.annual;
      });
      
      // HVAC should affect both electricity and gas
      expect(results['HVAC']).toBeGreaterThan(0);
      
      // Lighting should mostly affect electricity
      expect(results['Lighting']).toBeGreaterThan(0);
      
      // Different categories should yield different CO2 reductions
      const uniqueValues = new Set(Object.values(results));
      expect(uniqueValues.size).toBeGreaterThan(1);
    });
  });
});
