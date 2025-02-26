// src/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  Product, 
  ProductFilters, 
  PaginationOptions, 
  PaginatedResponse 
} from '../../backend/src/types/product';
import { api } from '../config/api';

// Mock data for when API calls fail
const fallbackCategories = {
  main: ['Appliances', 'Lighting', 'HVAC', 'Electronics'],
  sub: {
    'Appliances': ['Refrigerators', 'Dishwashers', 'Washing Machines'],
    'Lighting': ['LED Bulbs', 'Smart Lighting', 'Fixtures'],
    'HVAC': ['Thermostats', 'Air Conditioners', 'Heat Pumps'],
    'Electronics': ['TVs', 'Computers', 'Audio Equipment']
  }
};

const fallbackEfficiencyRatings = ['A+++', 'A++', 'A+', 'A', 'B', 'C'];

export function useProducts() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{
    main: string[];
    sub: { [key: string]: string[] };
  }>(fallbackCategories);
  const [efficiencyRatings, setEfficiencyRatings] = useState<string[]>(fallbackEfficiencyRatings);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataInitialized, setDataInitialized] = useState(false);

  // Initialize categories and efficiency ratings
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories
        try {
          const categoriesResponse = await api.get('/products/categories');
          if (categoriesResponse.data && 
              categoriesResponse.data.main && 
              Array.isArray(categoriesResponse.data.main)) {
            setCategories(categoriesResponse.data);
          }
        } catch (categoryErr) {
          console.warn('Failed to load categories, using fallbacks:', categoryErr);
          // Keep using fallback categories
        }
        
        // Fetch efficiency ratings
        try {
          const ratingsResponse = await api.get('/products/efficiency-ratings');
          if (ratingsResponse.data && Array.isArray(ratingsResponse.data)) {
            setEfficiencyRatings(ratingsResponse.data);
          }
        } catch (ratingErr) {
          console.warn('Failed to load efficiency ratings, using fallbacks:', ratingErr);
          // Keep using fallback ratings
        }
        
        setError(null);
        setDataInitialized(true);
      } catch (err) {
        console.error('Product data initialization error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred loading product data');
        // Still mark as initialized so the UI can render with fallbacks
        setDataInitialized(true);
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
      try {
        const response = await api.get<any>(`/products?${params.toString()}`);
        
        // Handle different response formats
        if (response.data) {
          // If response has the expected PaginatedResponse format
          if (Array.isArray(response.data.items)) {
            setProducts(response.data.items);
            setTotalProducts(response.data.total || 0);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(response.data.page || 1);
            setError(null);
            return response.data.items;
          } 
          // If response is an array directly
          else if (Array.isArray(response.data)) {
            setProducts(response.data);
            setTotalProducts(response.data.length);
            setTotalPages(1);
            setCurrentPage(1);
            setError(null);
            return response.data;
          }
          // If response has some other format but contains products
          else if (response.data.products && Array.isArray(response.data.products)) {
            setProducts(response.data.products);
            setTotalProducts(response.data.total || response.data.products.length);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(response.data.page || 1);
            setError(null);
            return response.data.products;
          }
          // Empty but valid response
          else if (Object.keys(response.data).length === 0) {
            setProducts([]);
            setTotalProducts(0);
            setTotalPages(1);
            setCurrentPage(1);
            setError(null);
            return [];
          }
          else {
            console.warn('Unexpected API response format:', response.data);
            setProducts([]);
            setTotalProducts(0);
            setTotalPages(1);
            setCurrentPage(1);
            return [];
          }
        } else {
          console.warn('Empty API response');
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
          setCurrentPage(1);
          return [];
        }
      } catch (error: any) {
        console.error('API error fetching products:', error);
        // Return empty array but don't set error if we're just unauthorized
        // This allows the UI to render properly for non-logged in users
        if (error.response && error.response.status === 401) {
          console.warn('Unauthorized access, returning empty products array');
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
          setCurrentPage(1);
          return [];
        } else {
          // Log the error but don't throw it
          console.error('Error details:', error);
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
          setCurrentPage(1);
          return [];
        }
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching products');
      setProducts([]);
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
    } catch (err: any) {
      console.error(`Error fetching product ${id}:`, err);
      // Don't set error if we're just unauthorized
      if (err.response && err.response.status !== 401) {
        setError(err instanceof Error ? err.message : 'An error occurred fetching the product');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    products,
    categories: categories || fallbackCategories,
    efficiencyRatings: efficiencyRatings || fallbackEfficiencyRatings,
    totalProducts,
    totalPages,
    currentPage,
    dataInitialized,
    getFilteredProducts,
    getProduct
  };
}
