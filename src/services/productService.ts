// src/services/productService.ts
import { getApiUrl } from '../config/api';
import { API_ENDPOINTS } from '../config/api';
import { Product, ProductFilter } from '../types/product';

class ProductService {
  private products: Product[] = [];
  private categories: { main: string[]; sub: { [key: string]: string[] } } = { main: [], sub: {} };
  // Maps for converting between mainCategory/category for backward compatibility
  private mainCategoryToCategory = new Map<string, string>();
  private categoryToMainCategory = new Map<string, string>();
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
      
      const data = await response.json();
      
      // Handle both array format and paginated format responses
      if (Array.isArray(data)) {
        this.products = data;
      } else if (data.items && Array.isArray(data.items)) {
        this.products = data.items;
      } else {
        console.warn('Unexpected API response format:', data);
        this.products = [];
      }
      
      console.log(`Fetched ${this.products.length} products from API`);
    } catch (error) {
      console.error('Error fetching products from API:', error);
      
      // Fallback to CSV if API fails
      console.log('Falling back to CSV data');
      await this.loadProductsFromCSVFallback('/data/products.csv');
    }
  }

  // Made public to allow explicit fallback loading from hook
  async loadProductsFromCSVFallback(file: string): Promise<void> {
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

        // Store mapping for backward compatibility
        const mainCategory = row.mainCategory || 'Uncategorized';
        this.mainCategoryToCategory.set(mainCategory, mainCategory);
        this.categoryToMainCategory.set(mainCategory, mainCategory);

        // Convert to our Product interface format
        return {
          id: row.energyStarUniqueId || String(index + 1),
          name: row.productName || 'Unknown Product',
          category: row.mainCategory || 'Uncategorized', // Map mainCategory to category
          subCategory: row.subCategory || 'General',
          price: parseFloat(row.price) || 0,
          energyEfficiency: row.efficiency || 'Standard',
          features: features,
          description: row.description || '',
          imageUrl: row.productUrl || '',
          manufacturerUrl: row.manufacturerUrl || '',
          annualSavings: parseFloat(row.annualSavings) || 0,
          roi: parseFloat(row.roi) || 0,
          paybackPeriod: parseFloat(row.paybackPeriod) || 0,
          rebateEligible: row.rebateEligible === 'true' || false,
          greenCertified: row.greenCertified === 'true' || false,
          userRating: parseFloat(row.userRating) || 0,
          model: row.model || ''
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
      // Get or create mainCategory (for backward compatibility with UI)
      const mainCategory = this.categoryToMainCategory.get(product.category) || product.category;
      
      if (!this.categories.main.includes(mainCategory)) {
        this.categories.main.push(mainCategory);
        this.categories.sub[mainCategory] = [];
      }

      if (product.subCategory && !this.categories.sub[mainCategory]!.includes(product.subCategory)) {
        this.categories.sub[mainCategory]!.push(product.subCategory);
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

  async getProducts(filters?: ProductFilter): Promise<Product[]> {
    // Ensure products have financial metrics
    const ensureFinancialMetrics = (products: Product[]): Product[] => {
      return products.map(product => {
        // Only set defaults if these fields are missing or zero
        if (!product.price || product.price === 0) {
          const baseDefaults = {
            price: 199.99,
            annualSavings: 25.00,
            roi: 0.125,
            paybackPeriod: 8.0
          };
          
          // Product-specific defaults based on type
          if (product.subCategory === 'Dehumidifiers') {
            return {
              ...product,
              price: 249.99,
              annualSavings: 35.00,
              roi: 0.14,
              paybackPeriod: 7.14
            };
          }
          
          return { ...product, ...baseDefaults };
        }
        return product;
      });
    };
    
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
            // Convert category to mainCategory for filtering
            const productMainCategory = this.categoryToMainCategory.get(p.category) || p.category;
            
            if (filters.mainCategory && productMainCategory.toLowerCase() !== filters.mainCategory.toLowerCase()) return false;
            if (filters.subCategory && p.subCategory?.toLowerCase() !== filters.subCategory.toLowerCase()) return false;
            if (filters.search) {
              const searchLower = filters.search.toLowerCase();
              return p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower) ||
                (p.model ? p.model.toLowerCase().includes(searchLower) : false);
            }
            return true;
          });
        }
        
        if (!response.ok) {
          throw new Error(`API error! status: ${response.status}`);
        }
        
        const data = await response.json(); return ensureFinancialMetrics(Array.isArray(data) ? data : (data.items || [data]));
      } catch (error) {
        console.error('Error fetching filtered products:', error);
        // Fall back to client-side filtering
        return this.products.filter(p => {
          // Convert category to mainCategory for filtering
          const productMainCategory = this.categoryToMainCategory.get(p.category) || p.category;
          
          if (filters.mainCategory && productMainCategory.toLowerCase() !== filters.mainCategory.toLowerCase()) return false;
          if (filters.subCategory && p.subCategory?.toLowerCase() !== filters.subCategory.toLowerCase()) return false;
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return p.name.toLowerCase().includes(searchLower) ||
              p.description.toLowerCase().includes(searchLower) ||
              (p.model ? p.model.toLowerCase().includes(searchLower) : false);
          }
          return true;
        });
      }
    }

    return this.products;
  }

  /**
   * Get products with pagination and sorting
   */
  async getProductsPaginated(
    filters?: ProductFilter,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'relevance',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    items: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!this.initialized) {
      await this.loadProductsFromCSV(''); // Parameter is ignored now
    }

    try {
      // Build query string with pagination parameters
      const params = new URLSearchParams();
      if (filters?.mainCategory) {
        params.append('category', filters.mainCategory);
        console.log(`API request with mainCategory: ${filters.mainCategory}`);
      }
      if (filters?.subCategory) {
        params.append('subcategory', filters.subCategory);
        console.log(`API request with subCategory: ${filters.subCategory}`);
      }
      if (filters?.search) params.append('search', filters.search);
      if (filters?.efficiency) params.append('efficiency', filters.efficiency);
      
      // Add pagination and sorting parameters
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const url = `${getApiUrl(API_ENDPOINTS.PRODUCTS)}?${params.toString()}`;
      console.log('Fetching paginated products from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`API returned non-JSON response: ${contentType}`);
        // Fall back to client-side pagination
        return this.clientSidePagination(filters, page, limit, sortBy, sortOrder);
      }
      
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      
      const data = await response.json(); return ensureFinancialMetrics(Array.isArray(data) ? data : (data.items || [data]));
    } catch (error) {
      console.error('Error fetching paginated products:', error);
      // Fall back to client-side pagination
      return this.clientSidePagination(filters, page, limit, sortBy, sortOrder);
    }
  }

  /**
   * Fallback client-side pagination when API fails
   */
  private clientSidePagination(
    filters?: ProductFilter,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): {
    items: Product[];
    total: number;
    page: number;
    totalPages: number;
  } {
    console.log('Using client-side pagination as fallback');
    
    // Ensure this.products is always an array
    if (!Array.isArray(this.products)) {
      console.warn('Products array is not initialized, using empty array for fallback pagination');
      this.products = [];
    }
    
    // Filter products
    let filteredProducts = [...this.products];
    
    if (filters) {
      if (filters.mainCategory) {
        console.log(`Client-side filtering for mainCategory: ${filters.mainCategory}`);
        filteredProducts = filteredProducts.filter(p => {
          // Convert category to mainCategory for filtering
          const productMainCategory = this.categoryToMainCategory.get(p.category) || p.category;
          return productMainCategory.toLowerCase() === filters.mainCategory?.toLowerCase();
        });
        console.log(`Filtered to ${filteredProducts.length} products after applying mainCategory filter`);
      }

      if (filters.subCategory) {
        console.log(`Client-side filtering for subCategory: ${filters.subCategory}`);
        filteredProducts = filteredProducts.filter(p => 
          p.subCategory?.toLowerCase() === filters.subCategory?.toLowerCase()
        );
        console.log(`Filtered to ${filteredProducts.length} products after applying subCategory filter`);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          (p.model ? p.model.toLowerCase().includes(searchLower) : false)
        );
      }
    }
    
    // Sort products
    filteredProducts.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'relevance':
          // For client-side, we don't have a true relevance score
          // Just use name as default
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, filteredProducts.length);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    return {
      items: paginatedProducts,
      total: filteredProducts.length,
      page,
      totalPages: Math.ceil(filteredProducts.length / limit)
    };
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
      
      const data = await response.json(); return ensureFinancialMetrics(Array.isArray(data) ? data : (data.items || [data]));
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
