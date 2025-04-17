import React, { useState } from 'react';
import { usePageTracking } from '../hooks/analytics/usePageTracking';
import { AnalyticsArea } from '../context/AnalyticsContext';
import { ArrowLeft, Search } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';

// Import implemented components
import CategoryGallery from '../components/products/CategoryGallery';
// Import components we'll create later
// import SubCategoryGallery from '../components/products/SubCategoryGallery';
import ProductGallery from '../components/products/ProductGallery';
// import GalleryBreadcrumb from '../components/products/GalleryBreadcrumb';
// import SearchOverlay from '../components/products/SearchOverlay';

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
  const { isLoading, error, categories } = useProducts();
  
  // Navigation state
  const [viewState, setViewState] = useState<ViewState>(ViewState.CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setViewState(ViewState.SEARCH);
    } else {
      // If search is cleared, go back to previous view
      setViewState(viewState === ViewState.SEARCH ? ViewState.CATEGORIES : viewState);
    }
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
        setViewState(ViewState.CATEGORIES);
        break;
    }
  };
  
  // Loading state
  if (isLoading) {
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
      
      {/* Navigation - will be replaced with GalleryBreadcrumb component */}
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
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.sub[selectedCategory]?.map((subCategory) => (
            <button
              key={subCategory}
              onClick={() => handleSubCategorySelect(subCategory)}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              {subCategory}
            </button>
          ))}
        </div>
      )}
      
      {viewState === ViewState.PRODUCTS && (
    <ProductGallery 
      category={selectedCategory} 
      subcategory={selectedSubCategory} 
    />
  )}
      
      {viewState === ViewState.SEARCH && (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            {`Search: ${searchQuery}`}
          </h2>
          <p className="text-gray-500">
            This is a placeholder for the Search Results that will be implemented in the next phase.
          </p>
        </div>
      )}
    </div>
  );
};

export default Products2Page;
