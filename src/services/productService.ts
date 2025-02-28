// src/services/productService.ts
import { getApiUrl } from '../config/api';
import { API_ENDPOINTS } from '../config/api';
import { Product, ProductFilters } from '../../backend/src/types/product';

class ProductService {
  private products: Product[] = [];
  private categories: { main: string[]; sub: { [key: string]: string[] } } = { main: [], sub: {} };
  private initialized = false;

  // This method is kept for backward compatibility but now uses the API with CSV fallback
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
      // First try to fetch from API
      const url = getApiUrl(API_ENDPOINTS.PRODUCTS);
      console.log('Fetching products from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`API returned non-JSON response: ${contentType}`);
        throw new Error('API returned non-JSON response');
      }
      
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      
      this.products = await response.json();
      console.log(`Fetched ${this.products.length} products from API`);
    } catch (error) {
      console.error('Error fetching products from API:', error);
      
      // Fallback to CSV if API fails
      console.log('Falling back to CSV data');
      await this.loadProductsFromCSVFallback('/data/products.csv');
    }
  }

  private async loadProductsFromCSVFallback(file: string): Promise<void> {
    try {
      console.log('Loading products from CSV fallback:', file);
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvData = await response.text();
      console.log('CSV data loaded, first 100 chars:', csvData.substring(0, 100));
      
      // Use Papa Parse to parse CSV
      const Papa = await import('papaparse');
      const results = Papa.default.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Convert spaces and special characters to camelCase
          return header
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
        },
      });
      
      if (results.errors && results.errors.length > 0) {
        console.error('CSV parsing errors:', results.errors);
        throw new Error('CSV parsing errors occurred');
      }
      
      this.products = results.data.map((row: any, index: number) => {
        // Parse features string into array
        const features = row.features
          ? row.features.split('\n').filter(Boolean).map((f: string) => f.trim())
          : [];

        // Extract specifications from description
        const specifications: { [key: string]: string } = {};
        if (row.description) {
          row.description.split('\n').forEach((line: string) => {
            const [key, value] = line.split(':').map((s: string) => s.trim());
            if (key && value) {
              specifications[key] = value;
            }
          });
        }

        return {
          id: row.energyStarUniqueId || String(index + 1),
          productUrl: row.productUrl || '',
          mainCategory: row.mainCategory || 'Uncategorized',
          subCategory: row.subCategory || 'General',
          name: row.productName || 'Unknown Product',
          model: row.model || '',
          description: row.description || '',
          efficiency: row.efficiency || '',
          features: features,
          marketInfo: row.market || '',
          energyStarId: row.energyStarUniqueId || '',
          upcCodes: row.upcCodes || '',
          additionalModels: row.additionalModelNamesAndOrNumbers || '',
          pdfUrl: row.pdfFileUrl || '',
          specifications
        };
      });
      
      // Build categories from products
      this.buildCategoriesFromProducts();
      
      console.log(`Loaded ${this.products.length} products from CSV fallback`);
    } catch (error) {
      console.error('Error in CSV fallback:', error);
      // Initialize with empty data if all else fails
      this.products = [];
      this.categories = { main: ['Uncategorized'], sub: { 'Uncategorized': ['General'] } };
    }
  }

  private buildCategoriesFromProducts(): void {
    this.categories = {
      main: [],
      sub: {}
    };

    this.products.forEach(product => {
      if (!this.categories.main.includes(product.mainCategory)) {
        this.categories.main.push(product.mainCategory);
        this.categories.sub[product.mainCategory] = [];
      }

      if (!this.categories.sub[product.mainCategory]!.includes(product.subCategory)) {
        this.categories.sub[product.mainCategory]!.push(product.subCategory);
      }
    });
  }

  private async fetchCategoriesFromAPI(): Promise<void> {
    try {
      const url = getApiUrl(`${API_ENDPOINTS.PRODUCTS}/categories`);
      console.log('Fetching categories from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`API returned non-JSON response: ${contentType}`);
        throw new Error('API returned non-JSON response');
      }
      
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
      
      // If we have products, build categories from them
      if (this.products.length > 0) {
        this.buildCategoriesFromProducts();
      } else {
        // Default categories if all else fails
        this.categories = { main: ['Uncategorized'], sub: { 'Uncategorized': ['General'] } };
      }
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
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`API returned non-JSON response: ${contentType}`);
          return this.products.filter(p => {
            if (filters.mainCategory && p.mainCategory.toLowerCase() !== filters.mainCategory.toLowerCase()) return false;
            if (filters.subCategory && p.subCategory.toLowerCase() !== filters.subCategory.toLowerCase()) return false;
            if (filters.search) {
              const searchLower = filters.search.toLowerCase();
              return p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower) ||
                p.model.toLowerCase().includes(searchLower);
            }
            return true;
          });
        }
        
        if (!response.ok) {
          throw new Error(`API error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching filtered products:', error);
        // Fall back to client-side filtering
        return this.products.filter(p => {
          if (filters.mainCategory && p.mainCategory.toLowerCase() !== filters.mainCategory.toLowerCase()) return false;
          if (filters.subCategory && p.subCategory.toLowerCase() !== filters.subCategory.toLowerCase()) return false;
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return p.name.toLowerCase().includes(searchLower) ||
              p.description.toLowerCase().includes(searchLower) ||
              p.model.toLowerCase().includes(searchLower);
          }
          return true;
        });
      }
    }

    return this.products;
  }

  async getProduct(id: string): Promise<Product | null> {
    if (!this.initialized) {
      await this.loadProductsFromCSV(''); // Parameter is ignored now
    }

    try {
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}/${id}`), {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`API returned non-JSON response: ${contentType}`);
        return this.products.find(p => p.id === id) || null;
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      // Fall back to local products
      return this.products.find(p => p.id === id) || null;
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
