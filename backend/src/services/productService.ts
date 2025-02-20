// src/services/productService.ts

import { Product, ProductFilters } from '../types/product';

// Mock data - replace with actual API calls later
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Smart LED Bulb Pack',
    category: 'Lighting',
    energyRating: 'A+',
    price: 29.99,
    rebateAmount: 5,
    description: 'Energy-efficient LED bulbs with smart controls',
    imageUrl: '/api/placeholder/200/200',
    specifications: {
      'Wattage': '9W',
      'Lumens': '800',
      'Lifespan': '25000 hours',
      'Color Temperature': '2700K-6500K'
    },
    annualEnergySavings: 80,
    brand: 'EcoLight',
    modelNumber: 'EL-SB-100',
    warrantyYears: 3,
    // Required fields from productDataService
    productUrl: 'https://example.com/smart-led',
    mainCategory: 'Lighting',
    subCategory: 'LED Bulbs',
    efficiency: 'A+',
    features: ['Smart Controls', 'Energy Efficient', 'Long Lifespan'],
    marketInfo: 'Residential',
    energyStarId: 'LED-001',
    model: 'SB-100'
  },
  {
    id: '2',
    name: 'Smart Thermostat Pro',
    category: 'HVAC',
    energyRating: 'A++',
    price: 199.99,
    rebateAmount: 30,
    description: 'AI-powered thermostat that learns your schedule',
    imageUrl: '/api/placeholder/200/200',
    specifications: {
      'Display': 'HD Color Touch',
      'Wireless': 'Wi-Fi, Bluetooth',
      'Compatibility': 'Most HVAC systems',
      'Sensors': 'Temperature, Humidity, Occupancy'
    },
    annualEnergySavings: 150,
    brand: 'ClimateIQ',
    modelNumber: 'CIQ-200',
    warrantyYears: 2,
    // Required fields from productDataService
    productUrl: 'https://example.com/smart-thermostat',
    mainCategory: 'HVAC',
    subCategory: 'Thermostats',
    efficiency: 'A++',
    features: ['AI Learning', 'Smart Scheduling', 'Remote Control'],
    marketInfo: 'Residential',
    energyStarId: 'HVAC-001',
    model: 'CIQ-200'
  }
];

export const productService = {
  // Get all products with optional filtering
  getProducts: async (filters?: ProductFilters): Promise<Product[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filteredProducts = [...mockProducts];

    if (filters) {
      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }

      if (filters.energyRating) {
        filteredProducts = filteredProducts.filter(p => p.energyRating === filters.energyRating);
      }

      if (filters.priceRange && filters.priceRange.min !== undefined && filters.priceRange.max !== undefined) {
        filteredProducts = filteredProducts.filter(
          p => p.price !== undefined && p.price >= filters.priceRange!.min && p.price <= filters.priceRange!.max
        );
      }

      if (filters.hasRebate) {
        filteredProducts = filteredProducts.filter(p => (p.rebateAmount ?? 0) > 0);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(
          p => p.name.toLowerCase().includes(searchLower) ||
               p.description.toLowerCase().includes(searchLower) ||
               p.brand?.toLowerCase().includes(searchLower)
        );
      }
    }

    return filteredProducts;
  },

  // Get a single product by ID
  getProduct: async (id: string): Promise<Product | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProducts.find(p => p.id === id) || null;
  },

  // Get product categories
  getCategories: async (): Promise<string[]> => {
    const categories = mockProducts
      .map(p => p.category)
      .filter((category): category is string => category !== undefined);
    return [...new Set(categories)];
  }
};

export default productService;
