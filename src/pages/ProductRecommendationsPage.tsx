import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import { Loader2, Filter, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  energyEfficiency: string;
  features: string[];
  description: string;
  imageUrl?: string;
  annualSavings: number;
  roi: number;
  paybackPeriod: number;
}

interface FilterOptions {
  categories: string[];
  features: string[];
  priceRange: [number, number];
  sortBy: 'price' | 'energyEfficiency' | 'roi' | 'paybackPeriod';
  sortOrder: 'asc' | 'desc';
}

const ProductRecommendationsPage: React.FC = () => {
  // Add page tracking
  usePageTracking('products');
const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const auditId = queryParams.get('auditId');

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    features: [],
    priceRange: [0, 50000],
    sortBy: 'roi',
    sortOrder: 'desc'
  });
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (!auditId) {
      setError('No audit ID provided. Please start an energy audit first.');
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        // Fetch product recommendations
        const response = await fetch(`${API_ENDPOINTS.RECOMMENDATIONS}/products?auditId=${auditId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch product recommendations');
        }
        
        const data = await response.json();
        setProducts(data.products);
        
        // Extract available categories and features
        const categories = [...new Set(data.products.map((p: Product) => p.category))] as string[];
        setAvailableCategories(categories);
        
        const features = [...new Set(data.products.flatMap((p: Product) => p.features))] as string[];
        setAvailableFeatures(features);
        
        // Apply initial filtering
        applyFilters(data.products, filterOptions);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [auditId]);

  // Apply filters to products
  const applyFilters = (productsToFilter: Product[], options: FilterOptions) => {
    let filtered = [...productsToFilter];
    
    // Filter by categories
    if (options.categories.length > 0) {
      filtered = filtered.filter(p => options.categories.includes(p.category));
    }
    
    // Filter by features
    if (options.features.length > 0) {
      filtered = filtered.filter(p => 
        options.features.some(feature => p.features.includes(feature))
      );
    }
    
    // Filter by price range
    filtered = filtered.filter(p => 
      p.price >= options.priceRange[0] && p.price <= options.priceRange[1]
    );
    
    // Sort products
    filtered.sort((a, b) => {
      const aValue = a[options.sortBy];
      const bValue = b[options.sortBy];
      
      if (options.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredProducts(filtered);
  };

  const handleFilterChange = (newOptions: Partial<FilterOptions>) => {
    const updatedOptions = { ...filterOptions, ...newOptions };
    setFilterOptions(updatedOptions);
    applyFilters(products, updatedOptions);
  };

  const handleCategoryToggle = (category: string) => {
    const updatedCategories = filterOptions.categories.includes(category)
      ? filterOptions.categories.filter(c => c !== category)
      : [...filterOptions.categories, category];
    
    handleFilterChange({ categories: updatedCategories });
  };

  const handleFeatureToggle = (feature: string) => {
    const updatedFeatures = filterOptions.features.includes(feature)
      ? filterOptions.features.filter(f => f !== feature)
      : [...filterOptions.features, feature];
    
    handleFilterChange({ features: updatedFeatures });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const [sortBy, sortOrder] = value.split('-') as [FilterOptions['sortBy'], FilterOptions['sortOrder']];
    handleFilterChange({ sortBy, sortOrder });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    handleFilterChange({ priceRange: [min, max] });
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}?auditId=${auditId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-lg">Loading recommendations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/energy-audit')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Start a New Energy Audit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recommended Products</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <Filter className="w-5 h-5 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Sort By
              </h3>
              <select
                value={`${filterOptions.sortBy}-${filterOptions.sortOrder}`}
                onChange={handleSortChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="energyEfficiency-desc">Energy Efficiency</option>
                <option value="roi-desc">Return on Investment</option>
                <option value="paybackPeriod-asc">Payback Period</option>
              </select>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                {availableCategories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterOptions.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="mr-2"
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <div className="space-y-2">
                {availableFeatures.map(feature => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterOptions.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="mr-2"
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Price Range</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={filterOptions.priceRange[0]}
                  onChange={(e) => handlePriceRangeChange(Number(e.target.value), filterOptions.priceRange[1])}
                  className="w-1/2 p-2 border border-gray-300 rounded-md"
                  min="0"
                  step="100"
                />
                <span>to</span>
                <input
                  type="number"
                  value={filterOptions.priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(filterOptions.priceRange[0], Number(e.target.value))}
                  className="w-1/2 p-2 border border-gray-300 rounded-md"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {filteredProducts.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products match your filters</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filter criteria to see more products.</p>
              <button
                onClick={() => handleFilterChange({
                  categories: [],
                  features: [],
                  priceRange: [0, 50000]
                })}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  {product.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        {product.energyEfficiency}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{product.category}</p>
                    <p className="text-xl font-bold mb-3">${product.price.toLocaleString()}</p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">Annual Savings</p>
                        <p className="font-semibold">${product.annualSavings.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-xs text-gray-600">ROI</p>
                        <p className="font-semibold">{(product.roi * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <p className="text-xs text-gray-600">Payback</p>
                        <p className="font-semibold">{product.paybackPeriod.toFixed(1)} yrs</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.features.slice(0, 3).map(feature => (
                        <span
                          key={feature}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                      {product.features.length > 3 && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          +{product.features.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductRecommendationsPage;