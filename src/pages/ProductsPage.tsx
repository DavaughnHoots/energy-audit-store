// src/pages/ProductsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sliders } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { Product, ProductFilters } from '../types/product';
import { Badge } from '../components/ui/badge';

const ProductsPage: React.FC = () => {
  const { isLoading, error, categories, getFilteredProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    mainCategory: '',
    subCategory: '',
    search: '',
    efficiency: ''
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    const filteredProducts = await getFilteredProducts(filters);
    setProducts(filteredProducts);
  };

  if (isLoading) {
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
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Bar */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
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
        <div>
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