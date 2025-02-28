// src/hooks/useProducts.ts
import { useState, useEffect } from 'react';
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
        console.log('Loaded products count:', prods.length);

        const cats = await productService.getCategories();
        console.log('Categories:', cats);

        setProducts(prods);
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
  const getFilteredProducts = async (
    filters?: ProductFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'relevance',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedProducts> => {
    try {
      // Use the paginated API endpoint
      const result = await productService.getProductsPaginated(
        filters,
        page,
        limit,
        sortBy,
        sortOrder
      );
      return result;
    } catch (err) {
      console.error('Error getting filtered products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Return empty result with pagination info
      return {
        items: [],
        total: 0,
        page,
        totalPages: 0
      };
    }
  };

  const getProduct = async (id: string) => {
    try {
      return await productService.getProduct(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  return {
    isLoading,
    error,
    products,
    categories,
    getFilteredProducts,
    getProduct
  };
}
