import axios from 'axios';
import { Product, ProductFilter } from '../types/product';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

/**
 * Service for interacting with the product database API
 */
export class ProductService {
  private apiBaseUrl: string;
  private cache: Map<string, { timestamp: number, products: Product[] }>;
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor() {
    this.apiBaseUrl = `${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`;
    this.cache = new Map();
  }
  
  /**
   * Fetch products from the API with optional filters
   * @param filter Optional filter parameters
   * @returns Array of products matching the filter
   */
  public async getProducts(filter?: ProductFilter): Promise<Product[]> {
    try {
      // Generate cache key based on filter
      const cacheKey = filter ? JSON.stringify(filter) : 'all-products';
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        console.debug('Using cached products data');
        return cached.products;
      }
      
      // Prepare query parameters
      const params: Record<string, any> = {};
      
      if (filter) {
        if (filter.mainCategory) params.category = filter.mainCategory;
        if (filter.subCategory) params.subCategory = filter.subCategory;
        if (filter.efficiencyRating) params.efficiencyRating = filter.efficiencyRating;
        if (filter.rebateEligible) params.rebateEligible = filter.rebateEligible;
        if (filter.greenCertified) params.greenCertified = filter.greenCertified;
        if (filter.minUserRating) params.minRating = filter.minUserRating;
        
        if (filter.priceRange) {
          if (filter.priceRange.min) params.minPrice = filter.priceRange.min;
          if (filter.priceRange.max) params.maxPrice = filter.priceRange.max;
        }
      }
      
      // Make API request
      const response = await axios.get(this.apiBaseUrl, { params });
      
      // Validate response
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response format from products API', response.data);
        return [];
      }
      
      // Store in cache
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        products: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching products', error);
      
      // Return empty array on error - could be enhanced with retry logic
      return [];
    }
  }
  
  /**
   * Fetch a single product by ID
   * @param id Product ID
   * @returns Product details or null if not found
   */
  public async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}`, error);
      return null;
    }
  }
  
  /**
   * Get product categories
   * @returns Array of product categories
   */
  public async getCategories(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/categories`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching product categories', error);
      return [];
    }
  }
  
  /**
   * Clear the products cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export default ProductService;
