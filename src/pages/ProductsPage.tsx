// src/pages/ProductsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { Product, ProductFilters } from '../../backend/src/types/product';
import { Badge } from '../components/ui/badge';
import { debounce } from '../utils/debounce';

const ProductsPage: React.FC = () => {
  const { isLoading: initialLoading, error, categories, getFilteredProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>({
    mainCategory: '',
    subCategory: '',
    search: '',
    efficiency: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const productsPerPage = 20;

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 500),
    []
  );

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Load products with pagination
  const loadProducts = async () => {
    setIsSearching(true);
    try {
      const result = await getFilteredProducts(filters, currentPage, productsPerPage);
      setProducts(result.items);
      setTotalProducts(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  useEffect(() => {
    loadProducts();
  }, [filters, currentPage]);

  const isLoading = initialLoading || isSearching;

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

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
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Bar */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={filters.mainCategory}
            onChange={(e) => {
              handleFilterChange('mainCategory', e.target.value);
              handleFilterChange('subCategory', ''); // Reset sub-category when main category changes
            }}
          >
            <option value="">All Categories</option>
            {categories.main.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Sub-Category Filter */}
        <div>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={filters.subCategory}
            onChange={(e) => handleFilterChange('subCategory', e.target.value)}
            disabled={!filters.mainCategory}
          >
            <option value="">All Sub-Categories</option>
            {filters.mainCategory && categories.sub[filters.mainCategory]?.map((subCategory) => (
              <option key={subCategory} value={subCategory}>{subCategory}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count and loading indicator */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {isSearching ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
              Searching...
            </span>
          ) : (
            <span>Showing {products.length} of {totalProducts} products</span>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                <Badge variant="outline" className="bg-green-50">
                  ENERGY STAR
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {/* Page numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
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
                    onClick={() => goToPage(pageNum)}
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
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
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

      {/* No Results Message */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
