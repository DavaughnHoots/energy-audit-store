// src/services/productDataService.ts
import { Product, ProductFilters } from '../../backend/src/types/product';

class ProductDataService {
  private products: Product[] = [];
  private categories: { main: string[]; sub: { [key: string]: string[] } } = { main: [], sub: {} };
  private initialized = false;
  private apiUrl = '/api/products';

  async loadProductsFromCSV(file: string): Promise<boolean> {
    try {
      console.log('Initializing product service...');
      
      // In the frontend, we'll fetch from the API instead of directly from the CSV
      const response = await fetch(`${this.apiUrl}/init`);
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API initialization result:', data);
      
      this.initialized = true;
      return true;
    } catch (error) {
      const err = error as Error;
      console.error('Product initialization error:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      throw new Error(`Failed to initialize products: ${err.message}`);
    }
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      if (!this.initialized) {
        await this.loadProductsFromCSV('');
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters) {
        if (filters.mainCategory) {
          params.append('mainCategory', filters.mainCategory);
        }
        if (filters.subCategory) {
          params.append('subCategory', filters.subCategory);
        }
        if (filters.search) {
          params.append('search', filters.search);
        }
      }
      
      // Fetch products from API
      const url = `${this.apiUrl}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      
      const products = await response.json();
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      if (!this.initialized) {
        await this.loadProductsFromCSV('');
      }
      
      // Fetch product from API
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      
      const product = await response.json();
      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  async getCategories(): Promise<{ main: string[]; sub: { [key: string]: string[] } }> {
    try {
      if (!this.initialized) {
        await this.loadProductsFromCSV('');
      }
      
      // Fetch categories from API
      const response = await fetch(`${this.apiUrl}/categories`);
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      
      const categories = await response.json();
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}

export default ProductDataService;
