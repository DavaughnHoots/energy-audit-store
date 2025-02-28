// src/services/productService.ts
import { getApiUrl } from '../config/api';
import { API_ENDPOINTS } from '../config/api';
import { Product, ProductFilters } from '../../backend/src/types/product';

class ProductService {
  private products: Product[] = [];
  private categories: { main: string[]; sub: { [key: string]: string[] } } = { main: [], sub: {} };
  private initialized = false;

  // This method is kept for backward compatibility but now uses the API
  async loadProductsFromCSV(file: string): Promise<boolean> {
    try {
      console.log('Using API instead of CSV file');
      // Load products from API
      await this.fetchProductsFromAPI();
      // Load categories from API
      await this.fetchCategoriesFromAPI();
      
      this.initialized = true;
      console.log('Successfully loaded products from API:', this.products.length);
      return true;
    } catch (error) {
      const err = error as Error;
      console.error('Error loading products from API:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      throw new Error(`Failed to load products: ${err.message}`);
    }
  }

  private async fetchProductsFromAPI(): Promise<void> {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.PRODUCTS));
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      this.products = await response.json();
      console.log(`Fetched ${this.products.length} products from API`);
    } catch (error) {
      console.error('Error fetching products from API:', error);
      throw error;
    }
  }

  private async fetchCategoriesFromAPI(): Promise<void> {
    try {
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}/categories`));
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      this.categories = await response.json();
      console.log('Fetched categories from API:', {
        mainCategories: this.categories.main.length,
        subCategories: Object.keys(this.categories.sub).length
      });
    } catch (error) {
      console.error('Error fetching categories from API:', error);
      throw error;
    }
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    if (!this.initialized) {
      await this.loadProductsFromCSV(''); // Parameter is ignored now
    }

    // If there are filters, we should query the API with those filters
    if (filters) {
      try {
        // Build query string
        const params = new URLSearchParams();
        if (filters.mainCategory) params.append('category', filters.mainCategory);
        if (filters.subCategory) params.append('subcategory', filters.subCategory);
        if (filters.search) params.append('search', filters.search);
        
        const url = `${getApiUrl(API_ENDPOINTS.PRODUCTS)}?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching filtered products:', error);
        return [];
      }
    }

    return this.products;
  }

  async getProduct(id: string): Promise<Product | null> {
    if (!this.initialized) {
      await this.loadProductsFromCSV(''); // Parameter is ignored now
    }

    try {
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}/${id}`));
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
  }

  async getCategories(): Promise<{ main: string[]; sub: { [key: string]: string[] } }> {
    if (!this.initialized) {
      await this.loadProductsFromCSV(''); // Parameter is ignored now
    }
    return this.categories;
  }
}

export default ProductService;
