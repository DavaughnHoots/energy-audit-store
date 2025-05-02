import React, { useState, useEffect, useCallback } from 'react';
import { usePageTracking } from '../hooks/analytics/usePageTracking';
import { AnalyticsArea } from '../context/AnalyticsContext';
import { ArrowLeft, Search, Info } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
// Import from backend to match useProducts hook's expected types
import { Product, ProductFilters } from '../../backend/src/types/product';
import { debounce } from '../utils/debounce';

// Import components (using path aliases for better build compatibility)
import CategoryGallery from '@products/CategoryGallery';
import SubCategoryGallery from '@products/SubCategoryGallery';
import ProductGallery from '@products/ProductGallery';
import EnhancedProductGallery from '@products/EnhancedProductGallery';
import ProductDetailModal from '@products/ProductDetailModal';
import SearchBar from '@products/SearchBar';
import ProductFilter from '@products/ProductFilter';
import SearchResults from '@products/SearchResults';

enum ViewState {
  CATEGORIES = 'categories',
  SUBCATEGORIES = 'subcategories',
  PRODUCTS = 'products',
  SEARCH = 'search'
}

const Products2Page: React.FC = () => {
  // Add page tracking
  usePageTracking('products2' as AnalyticsArea, {});
  
  // Get product data
  const { isLoading: initialLoading, error, categories, getFilteredProducts } = useProducts();
  
  // Navigation state
  const [viewState, setViewState] = useState<ViewState>(ViewState.CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Product detail modal state
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Search and filter state
  const [filters, setFilters] = useState<ProductFilters>({
    mainCategory: '',
    subCategory: '',
    search: ''
  });
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 20;
  
  // Debounced filter change function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFilterChange = useCallback(
    debounce((filterName: string, value: string) => {
      setFilters(prev => ({ ...prev, [filterName]: value }));
      setCurrentPage(1); // Reset to first page when filters change
    }, 500),
    []
  );
  
  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setViewState(ViewState.SUBCATEGORIES);
  };
  
  // Handle subcategory selection
  const handleSubCategorySelect = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
    setViewState(ViewState.PRODUCTS);
  };
  
  // Handle product selection for detail view
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setIsProductDetailOpen(true);
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedFilterChange('search', query);
    
    if (query) {
      setViewState(ViewState.SEARCH);
    } else {
      // If search is cleared, go back to previous view
      setViewState(viewState === ViewState.SEARCH ? ViewState.CATEGORIES : viewState);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    if (filterName === 'mainCategory') {
      // Update immediately without debounce
      setFilters(prev => ({ 
        ...prev, 
        [filterName]: value,
        // Reset subCategory when mainCategory changes
        subCategory: '' 
      }));
      setCurrentPage(1);
    } else {
      // Use debounce for other filters
      debouncedFilterChange(filterName, value);
    }
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  };
  
  // Handle navigation back
  const handleBack = () => {
    switch (viewState) {
      case ViewState.SUBCATEGORIES:
        setViewState(ViewState.CATEGORIES);
        setSelectedCategory('');
        break;
      case ViewState.PRODUCTS:
        setViewState(ViewState.SUBCATEGORIES);
        setSelectedSubCategory('');
        break;
      case ViewState.SEARCH:
        setSearchQuery('');
        setFilters(prev => ({ ...prev, search: '' }));
        setViewState(ViewState.CATEGORIES);
        break;
    }
  };
  
  // Load search results
  useEffect(() => {
    const loadSearchResults = async () => {
      if (viewState !== ViewState.SEARCH) return;
      
      setIsSearching(true);
      try {
        const result = await getFilteredProducts(filters, currentPage, productsPerPage);
        
        setSearchResults(result.items || []);
        setTotalProducts(result.total || 0);
        setTotalPages(result.totalPages || 1);
      } catch (err) {
        console.error('Error loading search results:', err);
        setSearchResults([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        setIsSearching(false);
      }
    };
    
    loadSearchResults();
  }, [filters, currentPage, getFilteredProducts, productsPerPage, viewState]);
  
  // Combined loading state
  const isLoading = initialLoading || (isSearching && viewState === ViewState.SEARCH);
  
  // Loading state
  if (initialLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Energy Efficient Products</h1>
          <p className="mt-1 text-gray-600">
            Browse our selection of ENERGY STAR® certified products
          </p>
        </div>
        
        {/* Search button - will be replaced with SearchOverlay component */}
        <div className="relative">
          <button 
            className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
            aria-label="Search products"
            onClick={() => setViewState(ViewState.SEARCH)}
          >
            <Search className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      {viewState !== ViewState.CATEGORIES && (
        <div className="mb-4">
          <button 
            onClick={handleBack}
            className="flex items-center text-green-600 hover:text-green-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>
              {viewState === ViewState.SUBCATEGORIES && 'Back to Categories'}
              {viewState === ViewState.PRODUCTS && `Back to ${selectedCategory}`}
              {viewState === ViewState.SEARCH && 'Clear Search'}
            </span>
          </button>
        </div>
      )}
      
      {/* Main content - render appropriate view based on navigation state */}
      {viewState === ViewState.CATEGORIES && (
        <CategoryGallery 
          categories={categories.main} 
          onCategorySelect={handleCategorySelect} 
        />
      )}
      
      {viewState === ViewState.SUBCATEGORIES && selectedCategory && (
        <SubCategoryGallery
          mainCategory={selectedCategory}
          subCategories={categories.sub[selectedCategory] || []}
          onSubCategorySelect={handleSubCategorySelect}
        />
      )}
      
      {viewState === ViewState.PRODUCTS && (
        <EnhancedProductGallery 
          category={selectedCategory} 
          subcategory={selectedSubCategory}
          onProductSelect={handleProductSelect}
        />
      )}
      
      {viewState === ViewState.SEARCH && (
        <div>
          <div className="mb-6">
            <SearchBar 
              initialValue={searchQuery} 
              onSearch={handleSearch} 
              placeholder="Search for energy efficient products..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left sidebar with filters */}
            <div className="md:col-span-1">
              <ProductFilter 
                categories={categories}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            {/* Main content area with results */}
            <div className="md:col-span-3">
              <SearchResults 
                products={searchResults}
                isSearching={isSearching}
                totalProducts={totalProducts}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onProductSelect={handleProductSelect}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Product Detail Modal */}
      {isProductDetailOpen && (
        <ProductDetailModal
          productId={selectedProductId}
          isOpen={isProductDetailOpen}
          onClose={() => setIsProductDetailOpen(false)}
        />
      )}
    </div>
  );
};

export default Products2Page;
