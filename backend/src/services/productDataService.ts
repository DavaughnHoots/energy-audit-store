// src/services/productDataService.ts
import Papa from 'papaparse';
import { Product, ProductFilters } from '../types/product.js';
import { cache } from '../config/cache.js';
import { appLogger } from '../config/logger.js';

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class ProductDataService {
  private products: Product[] = [];
  private isLoaded: boolean = false;
  private readonly CACHE_TTL = 3600; // 1 hour cache TTL
  private readonly PRODUCTS_CACHE_KEY = 'all_products';
  private readonly CATEGORIES_CACHE_KEY = 'product_categories';

  constructor() {
    // Initialize with empty products array
    this.products = [];
  }

  /**
   * Load products from CSV file and cache the result
   */
  async loadProductsFromCSV(file: string): Promise<boolean> {
    try {
      appLogger.info('Loading products from CSV', { file });
      
      // Check if products are already cached
      const cachedProducts = await cache.get<Product[]>(this.PRODUCTS_CACHE_KEY);
      if (cachedProducts && cachedProducts.length > 0) {
        appLogger.info('Using cached products', { count: cachedProducts.length });
        this.products = cachedProducts;
        this.isLoaded = true;
        return true;
      }

      // Fetch and parse CSV data
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvData = await response.text();
      appLogger.debug('CSV data loaded', { 
        size: csvData.length,
        preview: csvData.substring(0, 100) 
      });

      const results = Papa.parse(csvData, {
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
        appLogger.error('CSV parsing errors', { errors: results.errors });
        throw new Error('CSV parsing errors occurred');
      }

      this.products = results.data.map((row: any, index) => {
        try {
          // Parse features string into array
          const features = row.features
            ? row.features.split('\n').filter(Boolean).map((f: string) => f.trim())
            : [];

          // Extract specifications from description
          const specifications: { [key: string]: string } = {};
          if (row.description) {
            row.description.split('\n').forEach((line: string) => {
              const [key, value] = line.split(':').map(s => s.trim());
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
        } catch (err) {
          appLogger.error(`Error processing row ${index}`, { row, error: err });
          throw err;
        }
      });

      // Cache the products
      await cache.set(this.PRODUCTS_CACHE_KEY, this.products, this.CACHE_TTL);
      
      appLogger.info('Successfully loaded products', { count: this.products.length });
      this.isLoaded = true;
      return true;
    } catch (error) {
      const err = error as Error;
      appLogger.error('Failed to load products', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      throw new Error(`Failed to load products: ${err.message}`);
    }
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(
    filters?: ProductFilters, 
    page: number = 1, 
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<PaginatedResult<Product>> {
    // Ensure products are loaded
    if (!this.isLoaded && this.products.length === 0) {
      const cachedProducts = await cache.get<Product[]>(this.PRODUCTS_CACHE_KEY);
      if (cachedProducts && cachedProducts.length > 0) {
        this.products = cachedProducts;
        this.isLoaded = true;
      }
    }

    // Generate cache key based on filters and pagination
    const cacheKey = `products_${JSON.stringify(filters)}_${page}_${pageSize}_${sortBy}_${sortOrder}`;
    
    // Try to get from cache first
    const cachedResult = await cache.get<PaginatedResult<Product>>(cacheKey);
    if (cachedResult) {
      appLogger.debug('Using cached filtered products', { cacheKey });
      return cachedResult;
    }

    // Apply filters
    let filteredProducts = [...this.products];
    if (filters) {
      if (filters.mainCategory) {
        filteredProducts = filteredProducts.filter(
          p => p.mainCategory.toLowerCase() === filters.mainCategory?.toLowerCase()
        );
      }

      if (filters.subCategory) {
        filteredProducts = filteredProducts.filter(
          p => p.subCategory.toLowerCase() === filters.subCategory?.toLowerCase()
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.model.toLowerCase().includes(searchLower) ||
          p.features.some(f => f.toLowerCase().includes(searchLower))
        );
      }

      if (filters.efficiency) {
        filteredProducts = filteredProducts.filter(
          p => p.efficiency.toLowerCase() === filters.efficiency?.toLowerCase()
        );
      }
    }

    // Sort products
    filteredProducts = this.sortProducts(filteredProducts, sortBy, sortOrder);

    // Calculate pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const result: PaginatedResult<Product> = {
      items: paginatedProducts,
      total,
      page,
      pageSize,
      totalPages
    };

    // Cache the result
    await cache.set(cacheKey, result, 300); // Cache for 5 minutes

    return result;
  }

  /**
   * Get a single product by ID with caching
   */
  async getProduct(id: string): Promise<Product | null> {
    const cacheKey = `product_${id}`;
    
    // Try to get from cache first
    const cachedProduct = await cache.get<Product>(cacheKey);
    if (cachedProduct) {
      return cachedProduct;
    }

    // Ensure products are loaded
    if (!this.isLoaded && this.products.length === 0) {
      const cachedProducts = await cache.get<Product[]>(this.PRODUCTS_CACHE_KEY);
      if (cachedProducts && cachedProducts.length > 0) {
        this.products = cachedProducts;
        this.isLoaded = true;
      }
    }

    const product = this.products.find(p => p.id === id) || null;
    
    if (product) {
      // Cache the product
      await cache.set(cacheKey, product, this.CACHE_TTL);
    }
    
    return product;
  }

  /**
   * Get product categories with caching
   */
  async getCategories(): Promise<{ main: string[]; sub: { [key: string]: string[] } }> {
    // Try to get from cache first
    const cachedCategories = await cache.get<{ main: string[]; sub: { [key: string]: string[] } }>(
      this.CATEGORIES_CACHE_KEY
    );
    
    if (cachedCategories) {
      return cachedCategories;
    }

    // Ensure products are loaded
    if (!this.isLoaded && this.products.length === 0) {
      const cachedProducts = await cache.get<Product[]>(this.PRODUCTS_CACHE_KEY);
      if (cachedProducts && cachedProducts.length > 0) {
        this.products = cachedProducts;
        this.isLoaded = true;
      }
    }

    const categories = {
      main: [] as string[],
      sub: {} as { [key: string]: string[] }
    };

    this.products.forEach(product => {
      if (!categories.main.includes(product.mainCategory)) {
        categories.main.push(product.mainCategory);
        categories.sub[product.mainCategory] = [];
      }

      if (!categories.sub[product.mainCategory]!.includes(product.subCategory)) {
        categories.sub[product.mainCategory]!.push(product.subCategory);
      }
    });

    // Sort categories alphabetically
    categories.main.sort();
    Object.keys(categories.sub).forEach(key => {
      categories.sub[key].sort();
    });

    // Cache the categories
    await cache.set(this.CATEGORIES_CACHE_KEY, categories, this.CACHE_TTL);

    return categories;
  }

  /**
   * Get efficiency ratings available in the products
   */
  async getEfficiencyRatings(): Promise<string[]> {
    const cacheKey = 'efficiency_ratings';
    
    // Try to get from cache first
    const cachedRatings = await cache.get<string[]>(cacheKey);
    if (cachedRatings) {
      return cachedRatings;
    }

    // Ensure products are loaded
    if (!this.isLoaded && this.products.length === 0) {
      const cachedProducts = await cache.get<Product[]>(this.PRODUCTS_CACHE_KEY);
      if (cachedProducts && cachedProducts.length > 0) {
        this.products = cachedProducts;
        this.isLoaded = true;
      }
    }

    // Extract unique efficiency ratings
    const ratings = [...new Set(
      this.products
        .map(p => p.efficiency)
        .filter(Boolean)
    )].sort();

    // Cache the ratings
    await cache.set(cacheKey, ratings, this.CACHE_TTL);

    return ratings;
  }

  /**
   * Sort products based on the specified field and order
   */
  private sortProducts(
    products: Product[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc'
  ): Product[] {
    return [...products].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'efficiency':
          comparison = (a.efficiency || '').localeCompare(b.efficiency || '');
          break;
        case 'category':
          comparison = a.mainCategory.localeCompare(b.mainCategory);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Clear the product cache
   */
  async clearCache(): Promise<void> {
    await cache.del(this.PRODUCTS_CACHE_KEY);
    await cache.del(this.CATEGORIES_CACHE_KEY);
    appLogger.info('Product cache cleared');
  }
}

export default ProductDataService;
export type { PaginatedResult };
