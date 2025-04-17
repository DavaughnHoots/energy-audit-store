import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../../backend/src/types/product';
import { getCategoryImage } from '../../services/productImageService';
import { generateProductImage } from '../../utils/svgImageGenerator';
import { ChevronDown, ChevronUp, SlidersHorizontal, Info, Star, PlusCircle, Zap, DollarSign } from 'lucide-react';

interface EnhancedProductGalleryProps {
  category: string;
  subcategory: string;
  onProductSelect?: (productId: string) => void;
}

const EnhancedProductGallery: React.FC<EnhancedProductGalleryProps> = ({ 
  category, 
  subcategory,
  onProductSelect 
}) => {
  const { getFilteredProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcategoryImageUrl, setSubcategoryImageUrl] = useState<string | null>(null);
  const [subcategoryInfo, setSubcategoryInfo] = useState<{description?: string; benefits?: string[]} | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price' | 'savings' | 'roi'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Prevent multiple fetches
  const fetchingRef = useRef(false);
  const loadedOnceRef = useRef(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;
  
  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    mainCategory: category,
    subCategory: subcategory
  }), [category, subcategory]);
  
  // Fetch subcategory image and info for display
  useEffect(() => {
    const fetchSubcategoryData = async () => {
      try {
        // Try to get image for the specific subcategory
        const imageData = await getCategoryImage(subcategory, category);
        if (imageData && imageData.url) {
          setSubcategoryImageUrl(imageData.url);
        }
        
        // Set some mock subcategory info (this could come from an API in the future)
        setSubcategoryInfo({
          description: `Browse our selection of energy-efficient ${subcategory}. These products help reduce energy consumption and save money on your utility bills.`,
          benefits: [
            'Lower energy costs',
            'Reduced environmental impact',
            'Extended product lifespan',
            'Enhanced performance'
          ]
        });
      } catch (err) {
        console.error(`Error fetching subcategory data for ${subcategory}:`, err);
        setSubcategoryImageUrl(null);
      }
    };
    
    if (subcategory) {
      fetchSubcategoryData();
    }
  }, [category, subcategory]);
  
  // Get product image helper function with multiple fallbacks
  const getProductImage = useCallback((product: Product): string => {
    // First try: Use product's own image if available
    if (product.imageUrl && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    
    // Second try: Use subcategory image as fallback if available
    if (subcategoryImageUrl) {
      return subcategoryImageUrl;
    }
    
    // Third try: Generate an SVG image based on product properties
    return generateProductImage(
      product.name, 
      category,
      product.energyEfficiency
    );
  }, [category, subcategoryImageUrl]);
  
  // Handle sort change
  const handleSortChange = (newSortBy: 'relevance' | 'price' | 'savings' | 'roi') => {
    if (newSortBy === sortBy) {
      // Toggle order if clicking the same sort option
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      // Set default order for each sort type
      if (newSortBy === 'price') {
        setSortOrder('asc'); // Lower prices first
      } else {
        setSortOrder('desc'); // Higher relevance/savings/roi first
      }
    }
    
    // Reset to first page when sort changes
    setCurrentPage(1);
  };
  
  // Load products when category, subcategory, page, or sort changes
  useEffect(() => {
    const loadProducts = async () => {
      // Prevent multiple simultaneous fetches
      if (fetchingRef.current) return;
      
      fetchingRef.current = true;
      setLoading(true);
      
      try {
        console.log(`Loading products for category: ${category}, subcategory: ${subcategory}, page: ${currentPage}, sort: ${sortBy}-${sortOrder}`);
        
        // Get paginated products with filters
        const result = await getFilteredProducts(
          filters, 
          currentPage, 
          productsPerPage, 
          sortBy, 
          sortOrder
        );
        
        setProducts(result.items);
        setTotalPages(result.totalPages);
        setTotalProducts(result.total);
        setError(null);
        loadedOnceRef.current = true;
      } catch (err) {
        console.error('Error loading filtered products:', err);
        setError('Failed to load products. Please try again.');
        setProducts([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };
    
    // Always load products when sort or pagination changes
    loadProducts();
  }, [category, subcategory, currentPage, filters, getFilteredProducts, sortBy, sortOrder]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  };
  
  // Generate pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    // Determine which page numbers to show
    const pageNumbers = [];
    const showPageCount = 5; // Show 5 page numbers at a time
    
    let startPage = Math.max(1, currentPage - Math.floor(showPageCount / 2));
    let endPage = startPage + showPageCount - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - showPageCount + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex justify-center mt-8">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          {/* Previous page button */}
          <button
            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {/* Page numbers */}
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                currentPage === number
                  ? 'z-10 bg-green-50 border-green-500 text-green-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {number}
            </button>
          ))}
          
          {/* Next page button */}
          <button
            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </nav>
      </div>
    );
  };
  
  // Show subcategory header with image and description
  const renderSubcategoryHeader = () => {
    return (
      <div className="mb-8 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          {subcategoryImageUrl && (
            <div className="w-full md:w-1/3 h-48 md:h-auto overflow-hidden">
              <img 
                src={subcategoryImageUrl} 
                alt={subcategory} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to generated SVG
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = generateProductImage(subcategory, category);
                }}
              />
            </div>
          )}
          
          {/* Content */}
          <div className="w-full md:w-2/3 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{subcategory}</h2>
            {subcategoryInfo?.description && (
              <p className="text-gray-600 mb-4">{subcategoryInfo.description}</p>
            )}
            
            {subcategoryInfo?.benefits && subcategoryInfo.benefits.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Benefits</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                  {subcategoryInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Show loading state
  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  // Show error state
  if (error && !loading) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }
  
  // Show empty state
  if (!loading && products.length === 0) {
    return (
      <div className="bg-gray-50 p-8 text-center rounded-lg">
        <h3 className="text-lg font-medium text-gray-500">
          No products found for {category} &gt; {subcategory}
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          Try selecting a different category or subcategory.
        </p>
      </div>
    );
  }
  
  // Show product grid with enhanced features
  return (
    <div>
      {/* Subcategory Header */}
      {renderSubcategoryHeader()}
      
      {/* Filters and Sorting */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          {/* Results summary */}
          <div className="text-sm text-gray-600">
            Showing {products.length} of {totalProducts} products in {subcategory}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2">
          {/* Filters toggle button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {/* Sort dropdown */}
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-2 rounded-md text-sm font-medium ${sortBy === 'relevance' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleSortChange('relevance')}
            >
              Relevance {sortBy === 'relevance' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
              className={`px-3 py-2 rounded-md text-sm font-medium ${sortBy === 'price' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleSortChange('price')}
            >
              Price {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
              className={`px-3 py-2 rounded-md text-sm font-medium ${sortBy === 'savings' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleSortChange('savings')}
            >
              Savings {sortBy === 'savings' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
              className={`px-3 py-2 rounded-md text-sm font-medium ${sortBy === 'roi' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleSortChange('roi')}
            >
              ROI {sortBy === 'roi' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Filter panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg animate-expand-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="p-2 border border-gray-300 rounded-md w-full" 
                />
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="p-2 border border-gray-300 rounded-md w-full" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Energy Efficiency</label>
              <select className="p-2 border border-gray-300 rounded-md w-full">
                <option value="">Any</option>
                <option value="high">High Efficiency</option>
                <option value="medium">Medium Efficiency</option>
                <option value="standard">Standard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select className="p-2 border border-gray-300 rounded-md w-full">
                <option value="">Any</option>
                <option value="energystar">ENERGY STAR®</option>
                <option value="other">Other Brands</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div 
            key={product.id} 
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full"
            onClick={() => onProductSelect && onProductSelect(product.id)}
          >
            {/* Image */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              <img
                src={getProductImage(product)}
                alt={product.name}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  // Fallback to generated SVG image if all other image sources fail
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite error loops
                  target.src = generateProductImage(product.name, category, product.energyEfficiency);
                }}
              />
              
              {/* Efficiency badge */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md">
                {product.energyEfficiency || 'Standard'}
              </div>
              
              {/* Certified badge if applicable */}
              {product.greenCertified && (
                <div className="absolute top-2 right-2 p-1 bg-blue-100 text-blue-800 rounded-full">
                  <Star className="h-4 w-4" />
                </div>
              )}
            </div>
            
            {/* Product details */}
            <div className="p-4 flex-grow flex flex-col">
              <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{product.model}</p>
              
              <div className="mt-auto space-y-2">
                {/* Financial details */}
                <div className="flex justify-between items-center">
                  <div className="text-gray-900 font-bold">
                    ${product.price.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center text-green-600 text-sm">
                    <DollarSign className="h-3.5 w-3.5 mr-0.5" />
                    <span>Save ${product.annualSavings.toLocaleString()}/yr</span>
                  </div>
                </div>
                
                {/* ROI & Payback */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-1.5 rounded">
                    <div className="text-gray-500">ROI</div>
                    <div className="font-medium">{(product.roi * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-gray-50 p-1.5 rounded">
                    <div className="text-gray-500">Payback</div>
                    <div className="font-medium">{product.paybackPeriod.toFixed(1)} years</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action button */}
            <button 
              className="w-full py-2 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent onClick
                onProductSelect && onProductSelect(product.id);
              }}
            >
              <Info className="h-4 w-4" />
              <span>View Details</span>
            </button>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

// Simple check icon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default EnhancedProductGallery;