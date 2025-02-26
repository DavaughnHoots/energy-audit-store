// src/hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { Product, ProductFilters } from '../../backend/src/types/product';
import ProductService from '../services/productService';

const productService = new ProductService();

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

  const getFilteredProducts = async (filters?: ProductFilters) => {
    try {
      return await productService.getProducts(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
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
