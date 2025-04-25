// src/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { Product, ProductFilters } from '../../backend/src/types/product';
import ProductService from '../services/productService';

const productService = new ProductService();

interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export function useProducts() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{
    main: string[];
    sub: { [key: string]: string[] };
  }>({ main: [], sub: {} });

  useEffect(() => {
    const initializeProducts = async () => {
      try {
        console.log('Starting product initialization...');
        const success = await productService.loadProductsFromCSV('/data/products.csv');
        console.log('Load CSV result:', success);

        if (!success) {
          throw new Error('Failed to load CSV data');
        }

        const prods = await productService.getProducts();
        console.log('Loaded products count:', prods?.length || 'undefined');

        // If no products loaded, try loading some directly for client-side usage
        if (!prods || prods.length === 0) {
          console.log('No products returned from API, loading from CSV for client-side fallback');
          await productService.loadProductsFromCSVFallback('/data/products.csv');
          // Try again to get products after loading from CSV
          const fallbackProducts = await productService.getProducts();
          if (fallbackProducts && fallbackProducts.length > 0) {
            console.log('Successfully loaded fallback products:', fallbackProducts.length);
            setProducts(fallbackProducts);
          } else {
            console.error('Failed to load products from any source');
            setProducts([]);
          }
        } else {
          setProducts(prods);
        }

        const cats = await productService.getCategories();
        console.log('Categories:', cats);

        setCategories(cats);
        setError(null);
      } catch (err) {
        console.error('Product initialization error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred loading products');
        setProducts([]);
        setCategories({ main: [], sub: {} });
      } finally {
        setIsLoading(false);
      }
    };

    initializeProducts();
  }, []);

  /**
   * Get filtered products with pagination support
   */
  const getFilteredProducts = useCallback(async (
    filters?: ProductFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'relevance',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedProducts> => {
    try {
      console.log('Requesting filtered products with:', { filters, page, limit, sortBy, sortOrder });
      
      // Use the paginated API endpoint
      const result = await productService.getProductsPaginated(
        filters,
        page,
        limit,
        sortBy,
        sortOrder
      );
      
      // Deep validation of the result
      if (!result) {
        throw new Error('API returned empty response');
      }
      
      // Ensure all required fields are present with defaults if not
      const validatedResult: PaginatedProducts = {
        items: Array.isArray(result.items) ? result.items : [],
        total: typeof result.total === 'number' ? result.total : 0,
        page: typeof result.page === 'number' ? result.page : page,
        totalPages: typeof result.totalPages === 'number' ? result.totalPages : 0
      };

      console.log(`Successfully retrieved filtered products:`, {
        count: validatedResult.items.length,
        total: validatedResult.total,
        totalPages: validatedResult.totalPages
      });
      
      return validatedResult;
    } catch (err) {
      console.error('Error getting filtered products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Return empty result with pagination info
      const emptyResult = {
        items: [],
        total: 0,
        page,
        totalPages: 0
      };
      
      console.log('Returning empty result due to error');
      return emptyResult;
    }
  }, []);

  const getProduct = useCallback(async (id: string) => {
    try {
      return await productService.getProduct(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    products,
    categories,
    getFilteredProducts,
    getProduct
  };
}