/**
 * Script to fix product category filtering (Version 2 - with image function fixes)
 * This script implements the ProductGallery component and updates Products2Page
 */
const fs = require('fs');
const path = require('path');

console.log('Starting product category filtering fix (v2)');

// Create ProductGallery component
const productGalleryPath = path.join(__dirname, '../src/components/products/ProductGallery.tsx');
const productGalleryContent = `import React, { useState, useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../../backend/src/types/product';

interface ProductGalleryProps {
  category: string;
  subcategory: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ category, subcategory }) => {
  const { getFilteredProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;
  
  // Get product image helper function
  const getProductImage = (product: Product): string => {
    // Use product's own image if available
    if (product.imageUrl && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    
    // Fallback to category/subcategory image
    const productCategory = product.category || category;
    const productSubCategory = product.subCategory || subcategory;
    
    // Try to use the product's own subcategory if available, otherwise use the current subcategory
    return \`/data/images/category-\${productCategory.toLowerCase().replace(/\\s+/g, '-')}-\${productSubCategory.toLowerCase().replace(/\\s+/g, '-')}.jpg\`;
  };
  
  // Load products when category, subcategory, or page changes
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        console.log(\`Loading products for category: \${category}, subcategory: \${subcategory}, page: \${currentPage}\`);
        
        // Create filter with mainCategory (for backward compatibility)
        const filters = {
          mainCategory: category,
          subCategory: subcategory
        };
        
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
      } catch (err) {
        console.error('Error loading filtered products:', err);
        setError('Failed to load products. Please try again.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [category, subcategory, currentPage, getFilteredProducts]);
  
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
              className={\`relative inline-flex items-center px-4 py-2 border text-sm font-medium \${
                currentPage === number
                  ? 'z-10 bg-green-50 border-green-500 text-green-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }\`}
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
                src={getProductImage(product) || \`/data/images/category-\${category.toLowerCase().replace(/\\s+/g, '-')}.jpg\`}
                alt={product.name}
                className="h-48 w-full object-cover object-center"
                onError={(e) => {
                  // Fallback to category image if product image fails
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = \`/data/images/category-default.jpg\`;
                }}
              />
            </div>
            
            {/* Product details */}
            <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
            <p className="mt-1 text-xs text-gray-500">{product.model}</p>
            
            {/* Price if available */}
            {product.price > 0 && (
              <p className="mt-2 font-medium text-gray-900">\${product.price.toFixed(2)}</p>
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
`;

// Write ProductGallery component
fs.mkdirSync(path.dirname(productGalleryPath), { recursive: true });
fs.writeFileSync(productGalleryPath, productGalleryContent, 'utf8');
console.log(`Created ProductGallery component at ${productGalleryPath}`);

// Update Products2Page.tsx
const products2PagePath = path.join(__dirname, '../src/pages/Products2Page.tsx');

// Make sure file exists
if (!fs.existsSync(products2PagePath)) {
  console.error(`Error: Products2Page.tsx not found at ${products2PagePath}`);
  process.exit(1);
}

// Read the file content
let products2PageContent = fs.readFileSync(products2PagePath, 'utf8');

// Create backup
fs.writeFileSync(`${products2PagePath}.backup`, products2PageContent, 'utf8');
console.log(`Created backup at ${products2PagePath}.backup`);

// Update imports - uncomment ProductGallery import
products2PageContent = products2PageContent.replace(
  /\/\/ import ProductGallery from '\.\.\/components\/products\/ProductGallery';/,
  "import ProductGallery from '../components/products/ProductGallery';"
);

// Replace placeholder with ProductGallery component
products2PageContent = products2PageContent.replace(
  /{viewState === ViewState\.PRODUCTS && \((\s|.)*?\)}/,
  `{viewState === ViewState.PRODUCTS && (\n    <ProductGallery \n      category={selectedCategory} \n      subcategory={selectedSubCategory} \n    />\n  )}`
);

// Write updated Products2Page.tsx
fs.writeFileSync(products2PagePath, products2PageContent, 'utf8');
console.log(`Updated Products2Page.tsx at ${products2PagePath}`);

// Update build trigger for Heroku
const buildTriggerPath = path.join(__dirname, '../.build-trigger');
fs.writeFileSync(buildTriggerPath, new Date().toISOString(), 'utf8');
console.log('Updated .build-trigger for Heroku deployment');

console.log('Product category filtering fix completed successfully!');
