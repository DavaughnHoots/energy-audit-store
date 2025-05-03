import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../../backend/src/types/product';
import { Badge } from '../ui/badge';

interface SearchResultsProps {
  products: Product[];
  isSearching: boolean;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onProductSelect?: (productId: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  products,
  isSearching,
  totalProducts,
  currentPage,
  totalPages,
  onPageChange,
  onProductSelect
}) => {
  return (
    <div>
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

      {/* Product List */}
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
                {product.specifications && Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-gray-600">{key}:</span>{' '}
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => onProductSelect && onProductSelect(product.id)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  View Details
                </button>
                <a
                  href={product.productUrl || '#'}
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
      {products.length === 0 && !isSearching && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
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
                    onClick={() => onPageChange(pageNum)}
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
              onClick={() => onPageChange(currentPage + 1)}
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
    </div>
  );
};

export default SearchResults;
