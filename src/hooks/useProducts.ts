// src/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  Product, 
  ProductFilters, 
  PaginationOptions, 
  PaginatedResponse 
} from '../../backend/src/types/product';
import { api } from '../config/api';

export function useProducts() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{
    main: string[];
    sub: { [key: string]: string[] };
  }>({ main: [], sub: {} });
  const [efficiencyRatings, setEfficiencyRatings] = useState<string[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize categories and efficiency ratings
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories
        const categoriesResponse = await api.get('/products/categories');
        setCategories(categoriesResponse.data);
        
        // Fetch efficiency ratings
        const ratingsResponse = await api.get('/products/efficiency-ratings');
        setEfficiencyRatings(ratingsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Product data initialization error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred loading product data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Get products with pagination, sorting, and filtering
  const getFilteredProducts = useCallback(async (
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<Product[]> => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filter parameters
      if (filters?.mainCategory) params.append('category', filters.mainCategory);
      if (filters?.subCategory) params.append('subcategory', filters.subCategory);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.efficiency) params.append('efficiency', filters.efficiency);
      
      // Add pagination parameters
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.pageSize) params.append('pageSize', pagination.pageSize.toString());
      if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
      if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);
      
      // Make API request
      const response = await api.get<PaginatedResponse<Product>>(`/products?${params.toString()}`);
      
      // Update state with response data
      setProducts(response.data.items);
      setTotalProducts(response.data.total);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.page);
      setError(null);
      
      return response.data.items;
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching products');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a single product by ID
  const getProduct = useCallback(async (id: string): Promise<Product | null> => {
    try {
      setIsLoading(true);
      const response = await api.get<Product>(`/products/${id}`);
      setError(null);
      return response.data;
    } catch (err) {
      console.error(`Error fetching product ${id}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching the product');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    products,
    categories,
    efficiencyRatings,
    totalProducts,
    totalPages,
    currentPage,
    getFilteredProducts,
    getProduct
  };
}
