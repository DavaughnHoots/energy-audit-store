import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { Loader2, Save, Trash, RefreshCw, AlertCircle, Info } from 'lucide-react';
import ProductDetailModal from '../products/ProductDetailModal';
import { formatCurrency, formatPercentage } from '@/utils/formatting';

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
  audit_id?: string;
  audit_date?: string;
}

interface SavedComparison {
  id: string;
  name: string;
  products: Product[];
  created_at: string;
}

interface ProductComparisonsProps {
  userId: string;
  audits: number;
}

const ProductComparisons: React.FC<ProductComparisonsProps> = ({ userId, audits }) => {
  const [productHistory, setProductHistory] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [comparisonName, setComparisonName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<string | null>(null);
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);
  
  // Fetch product history and saved comparisons
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch product history
        const historyResponse = await fetch(`${API_ENDPOINTS.DASHBOARD.PRODUCT_HISTORY}`, {
          credentials: 'include'
        });
        
        if (!historyResponse.ok) {
          throw new Error('Failed to fetch product history');
        }
        
        const historyData = await historyResponse.json();
        setProductHistory(historyData.productHistory || []);
        
        // Fetch saved comparisons
        const comparisonsResponse = await fetch(`${API_ENDPOINTS.COMPARISONS.BASE}`, {
          credentials: 'include'
        });
        
        if (!comparisonsResponse.ok) {
          throw new Error('Failed to fetch saved comparisons');
        }
        
        const comparisonsData = await comparisonsResponse.json();
        setSavedComparisons(comparisonsData.comparisons || []);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, audits]);
  
  // Handle product selection
  const toggleProductSelection = (product: Product) => {
    if (selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };
  
  // Save comparison
  const saveComparison = async () => {
    if (selectedProducts.length < 2) {
      setError('Please select at least 2 products to compare');
      return;
    }
    
    if (!comparisonName.trim()) {
      setError('Please enter a name for this comparison');
      return;
    }
    
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPARISONS.BASE}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: comparisonName,
          products: selectedProducts
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save comparison');
      }
      
      const data = await response.json();
      setSavedComparisons([data.comparison, ...savedComparisons]);
      setComparisonName('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  // Load saved comparison
  const loadComparison = (comparison: SavedComparison) => {
    setSelectedProducts(comparison.products);
  };
  
  // Delete saved comparison
  const deleteComparison = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPARISONS.GET_BY_ID(id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comparison');
      }
      
      setSavedComparisons(savedComparisons.filter(c => c.id !== id));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-lg">Loading product data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="mt-1">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Product History Panel */}
        <div className="lg:col-span-1 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Product History</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select products to compare from your past energy audits.
          </p>
          
          {productHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <p>No product history available.</p>
              <p className="text-sm mt-2">Complete an energy audit to get product recommendations.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] sm:max-h-96 overflow-y-auto">
              {productHistory.map(product => (
                <div 
                  key={`${product.id}-${product.audit_id}`}
                  className={`p-2 sm:p-3 border rounded-md ${
                    selectedProducts.some(p => p.id === product.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div 
                      className="cursor-pointer flex-grow pr-2"
                      onClick={() => toggleProductSelection(product)}
                    >
                      <h3 className="font-medium text-sm sm:text-base">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{product.category}</p>
                      <p className="text-xs sm:text-sm font-semibold">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="flex items-start">
                      <input 
                        type="checkbox" 
                        checked={selectedProducts.some(p => p.id === product.id)}
                        onChange={() => toggleProductSelection(product)} 
                        className="h-5 w-5 text-green-600 mr-1 sm:mr-2 shrink-0"
                      />
                      <button
                        onClick={() => {
                          setSelectedProductForDetail(product.id);
                          setIsProductDetailModalOpen(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800 rounded shrink-0"
                        title="View product details"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Comparison Workspace */}
        <div className="lg:col-span-3">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold mb-4">Comparison Workspace</h2>
            
            {selectedProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Select products from the left panel to compare them.</p>
              </div>
            ) : (
              <>
                {/* Product Comparison Grid */}
                <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead>
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px] sm:w-auto">
                          Feature
                        </th>
                        {selectedProducts.map(product => (
                          <th key={product.id} className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] sm:min-w-[200px]">
                            {product.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Price Row */}
                      <tr>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          Price
                        </td>
                        {selectedProducts.map(product => (
                          <td key={product.id} className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {formatCurrency(product.price)}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Category Row */}
                      <tr>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          Category
                        </td>
                        {selectedProducts.map(product => (
                          <td key={product.id} className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {product.category}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Energy Efficiency Row */}
                      <tr>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          Energy Efficiency
                        </td>
                        {selectedProducts.map(product => (
                          <td key={product.id} className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {product.energyEfficiency}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Annual Savings Row */}
                      <tr>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          Annual Savings
                        </td>
                        {selectedProducts.map(product => (
                          <td key={product.id} className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {formatCurrency(product.annualSavings)}
                          </td>
                        ))}
                      </tr>
                      
                      {/* ROI Row */}
                      <tr>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          ROI
                        </td>
                        {selectedProducts.map(product => (
                          <td key={product.id} className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {formatPercentage(product.roi)}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Payback Period Row */}
                      <tr>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          Payback Period
                        </td>
                        {selectedProducts.map(product => (
                          <td key={product.id} className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {product.paybackPeriod.toFixed(1)} years
                          </td>
                        ))}
                      </tr>
                      
                      {/* Features Row */}
                      <tr>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          Features
                        </td>
                        {selectedProducts.map(product => (
                          <td key={product.id} className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500">
                            <ul className="list-disc pl-4 sm:pl-5">
                              {product.features.map(feature => (
                                <li key={feature}>{feature}</li>
                              ))}
                            </ul>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Save Comparison Controls */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
                  <input
                    type="text"
                    value={comparisonName}
                    onChange={(e) => setComparisonName(e.target.value)}
                    placeholder="Comparison name"
                    className="flex-grow px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={saveComparison}
                    className="flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Comparison
                  </button>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Saved Comparisons */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Saved Comparisons</h2>
            
            {savedComparisons.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>No saved comparisons yet.</p>
                <p className="text-sm mt-2">Compare products and save them for future reference.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedComparisons.map(comparison => (
                  <div 
                    key={comparison.id}
                    className="p-3 sm:p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                      <div>
                        <h3 className="font-medium">{comparison.name}</h3>
                        <p className="text-sm text-gray-600">
                          {comparison.products.length} products • 
                          Created {new Date(comparison.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 self-end sm:self-auto">
                        <button
                          onClick={() => loadComparison(comparison)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md hover:bg-blue-200"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteComparison(comparison.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-md hover:bg-red-200"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {comparison.products.map(product => (
                        <span 
                          key={product.id}
                          className="px-2 py-1 bg-gray-100 text-xs rounded-full inline-block mb-1 mr-1"
                        >
                          {product.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <ProductDetailModal
          productId={selectedProductForDetail}
          isOpen={isProductDetailModalOpen}
          onClose={() => setIsProductDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductComparisons;
