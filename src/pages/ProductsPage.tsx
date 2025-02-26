// src/pages/ProductsPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sliders, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { Product, ProductFilters, PaginationOptions } from '../../backend/src/types/product';
import { Badge } from '../components/ui/badge';

// Simple debounce function implementation
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<number | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

const ProductsPage: React.FC = () => {
  const { 
    isLoading, 
    error, 
    categories, 
    efficiencyRatings,
    totalProducts,
    totalPages,
    currentPage,
    getFilteredProducts 
  } = useProducts();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    mainCategory: '',
    subCategory: '',
    search: '',
    efficiency: ''
  });
  
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: 12,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  // Handle search with debounce
  const handleSearchUpdate = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
  }, []);
  
  const debouncedSearch = useDebounce(handleSearchUpdate, 500);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    debouncedSearch(searchTerm);
  };
  
  // Load products when filters or pagination changes
  useEffect(() => {
    const loadProducts = async () => {
      const filteredProducts = await getFilteredProducts(filters, pagination);
      setProducts(filteredProducts);
    };
    
    loadProducts();
  }, [filters, pagination, getFilteredProducts]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      // Scroll to top of product list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handle sort change
  const handleSortChange = (sortBy: string) => {
    setPagination(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Loading state
  if (isLoading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Energy Efficient Products</h1>
        <p className="mt-2 text-gray-600">
          Browse our selection of ENERGY STAR® certified products
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Bar */}
        <div className="md:col-span-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              defaultValue={filters.search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={filters.mainCategory}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              mainCategory: e.target.value,
              subCategory: '' // Reset sub-category when main category changes
            }))}
          >
            <option value="">All Categories</option>
            {categories.main.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Sub-Category Filter */}
        <div className="md:col-span-2">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={filters.subCategory}
            onChange={(e) => setFilters(prev => ({ ...prev, subCategory: e.target.value }))}
            disabled={!filters.mainCategory}
          >
            <option value="">All Sub-Categories</option>
            {filters.mainCategory && categories.sub[filters.mainCategory]?.map((subCategory) => (
              <option key={subCategory} value={subCategory}>{subCategory}</option>
            ))}
          </select>
        </div>
        
        {/* Efficiency Rating Filter */}
        <div className="md:col-span-2">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={filters.efficiency}
            onChange={(e) => setFilters(prev => ({ ...prev, efficiency: e.target.value }))}
          >
            <option value="">All Efficiency Ratings</option>
            {efficiencyRatings.map((rating) => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Sorting Controls */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {products.length > 0 ? ((pagination.page || 1) - 1) * (pagination.pageSize || 12) + 1 : 0}-
          {Math.min((pagination.page || 1) * (pagination.pageSize || 12), totalProducts)} of {totalProducts} products
        </div>
        
        <div className="flex space-x-4">
          <button 
            className={`flex items-center text-sm font-medium ${pagination.sortBy === 'name' ? 'text-green-600' : 'text-gray-600'}`}
            onClick={() => handleSortChange('name')}
          >
            Name
            {pagination.sortBy === 'name' && (
              <ArrowUpDown className="ml-1 h-4 w-4" />
            )}
          </button>
          
          <button 
            className={`flex items-center text-sm font-medium ${pagination.sortBy === 'efficiency' ? 'text-green-600' : 'text-gray-600'}`}
            onClick={() => handleSortChange('efficiency')}
          >
            Efficiency
            {pagination.sortBy === 'efficiency' && (
              <ArrowUpDown className="ml-1 h-4 w-4" />
            )}
          </button>
          
          <button 
            className={`flex items-center text-sm font-medium ${pagination.sortBy === 'category' ? 'text-green-600' : 'text-gray-600'}`}
            onClick={() => handleSortChange('category')}
          >
            Category
            {pagination.sortBy === 'category' && (
              <ArrowUpDown className="ml-1 h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && products.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading products...</p>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                <Badge variant="outline" className="bg-green-50 whitespace-nowrap">
                  {product.efficiency || 'ENERGY STAR'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-4">Model: {product.model}</p>

              <div className="mb-4">
                {Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-gray-600">{key}:</span>{' '}
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <Link
                  to={`/products/${product.id}`}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  View Details
                </Link>
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-200 transition-colors duration-200"
                >
                  View on Site
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {products.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange((pagination.page || 1) - 1)}
              disabled={(pagination.page || 1) === 1}
              className={`p-2 rounded-md ${
                (pagination.page || 1) === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate which page numbers to show
                let pageNum;
                const currentPage = pagination.page || 1;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === pageNum
                        ? 'bg-green-100 text-green-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange((pagination.page || 1) + 1)}
              disabled={(pagination.page || 1) === totalPages}
              className={`p-2 rounded-md ${
                (pagination.page || 1) === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
