import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../../backend/src/types/product';
import { getCategoryImage } from '../../services/productImageService';

interface ProductGalleryProps {
  category: string;
  subcategory: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ category, subcategory }) => {
  const { getFilteredProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent multiple fetches
  const fetchingRef = useRef(false);
  const loadedOnceRef = useRef(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;
  
  // Default placeholder image as base64 - gray background with product icon
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFRUVFRUUiLz48cGF0aCBkPSJNODAgNjBIMTIwVjE0MEg4MFY2MFoiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTcwIDgwSDE0MCIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNNzAgMTIwSDE0MCIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjQiLz48dGV4dCB4PSIxMDAiIHk9IjE2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2NjY2Ij5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  
  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    mainCategory: category,
    subCategory: subcategory
  }), [category, subcategory]);
  
  // Get product image helper function
  const getProductImage = useCallback((product: Product): string => {
    // Use product's own image if available
    if (product.imageUrl && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    
    // Use the base64 placeholder image
    return placeholderImage;
  }, []);
  
  // Load products when category, subcategory, or page changes
  useEffect(() => {
    const loadProducts = async () => {
      // Prevent multiple simultaneous fetches
      if (fetchingRef.current) return;
      
      fetchingRef.current = true;
      setLoading(true);
      
      try {
        console.log(`Loading products for category: ${category}, subcategory: ${subcategory}, page: ${currentPage}`);
        
        // Get paginated products with filters
        const result = await getFilteredProducts(
          filters, 
          currentPage, 
          productsPerPage, 
          'relevance', 
          'desc'
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
    
    // Only load products if we haven't loaded yet or if the filters/page has changed
    if (!loadedOnceRef.current || currentPage > 1) {
      loadProducts();
    }
  }, [category, subcategory, currentPage, filters, getFilteredProducts]);
  
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
  
  // Show product grid
  return (
    <div>
      {/* Results summary */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {products.length} of {totalProducts} products in {category} &gt; {subcategory}
      </div>
      
      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
            {/* Image */}
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100 mb-4">
              <img
                src={getProductImage(product)}
                alt={product.name}
                className="h-48 w-full object-cover object-center"
                onError={(e) => {
                  // Fallback to placeholder image if product image fails
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = placeholderImage;
                }}
              />
            </div>
            
            {/* Product details */}
            <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
            <p className="mt-1 text-xs text-gray-500">{product.model}</p>
            
            {/* Price if available */}
            {product.price > 0 && (
              <p className="mt-2 font-medium text-gray-900">${product.price.toFixed(2)}</p>
            )}
            
            {/* Energy efficiency badge */}
            <div className="mt-2 flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                {product.energyEfficiency || 'Standard'}
              </span>
              
              {/* Green certified badge */}
              {product.greenCertified && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Certified
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default ProductGallery;
