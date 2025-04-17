import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  BarChart2, 
  Zap, 
  Clock, 
  Leaf, 
  Home, 
  X, 
  ArrowRight,
  Check,
  Image,
  ExternalLink
} from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { Product } from '@/types/product';
import { getProductImageData, trackImageDownload } from '@/services/productImageService';

// Interface for image data with attribution
interface ProductImageData {
  url: string;
  id: string;
  photographer: string;
  photographerUsername: string;
  photographerUrl: string;
}

// Extend the base Product type with additional fields needed for detailed view
interface DetailedProduct extends Product {
  enhancedMetrics: {
    monthlySavings: number;
    fiveYearSavings: number;
    tenYearSavings: number;
    percentageReduction: number;
    co2Reduction: {
      annual: number;
      fiveYear: number;
      tenYear: number;
      equivalentTrees: number;
      equivalentMilesDriven: number;
    };
  };
  auditContext: {
    energyInfo: {
      electricityCost: number;
      gasCost: number;
    };
    propertyInfo: {
      propertySize?: number;
      propertyType?: string;
      buildingAge?: number;
      occupants?: number;
    };
  };
  isSample?: boolean;
  audit_id?: string;
  audit_date?: string;
}

interface ProductDetailModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  productId, 
  isOpen, 
  onClose 
}) => {
  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [productImage, setProductImage] = useState<ProductImageData | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageDownloadTracked, setImageDownloadTracked] = useState(false);

  useEffect(() => {
  // Only fetch if the modal is open and we have a productId
  if (isOpen && productId) {
    // Add debouncing with timeout
    const timeoutId = setTimeout(() => {
      fetchProductDetailsRef.current();
    }, 50); // 50ms debounce
    
    // Return cleanup function
    return () => {
      // Clear timeout to prevent execution after unmount
      clearTimeout(timeoutId);
      
      // Abort any in-flight requests for this product
      requestCache.abortRequest(
        API_ENDPOINTS.RECOMMENDATIONS.GET_PRODUCT_DETAIL(productId)
      );
    };
  }
}, [isOpen, productId]); // Keep dependencies minimal and correct // Keep dependencies minimal and correct // Adding fetchProductDetails to deps would cause an infinite loop
  
  // Effect to fetch product image when product details are loaded
  useEffect(() => {
    const fetchImage = async () => {
      if (product) {
        // If product already has an image URL, use it
        if (product.imageUrl) {
          setProductImage({
            url: product.imageUrl,
            id: '',
            photographer: '',
            photographerUsername: '',
            photographerUrl: ''
          });
          return;
        }
        
        // Otherwise fetch an image based on product details
        try {
          setImageLoading(true);
          const imageData = await getProductImageData(
            product.name,
            product.category,
            product.subCategory
          );
          setProductImage(imageData);
        } catch (err) {
          console.error('Failed to load product image:', err);
          setProductImage(null);
        } finally {
          setImageLoading(false);
        }
      }
    };
    
    fetchImage();
  }, [product]);
  
  // Effect to track image downloads when an image is displayed
  useEffect(() => {
    const trackDownload = async () => {
      if (
        productImage && 
        productImage.id && 
        !imageDownloadTracked && 
        !loading
      ) {
        try {
          await trackImageDownload(productImage.id);
          setImageDownloadTracked(true);
        } catch (error) {
          console.error('Failed to track image download:', error);
        }
      }
    };
    
    trackDownload();
  }, [productImage, loading, imageDownloadTracked]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {loading ? 'Loading Product Details...' : product?.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-red-500 text-center">
              <div className="mb-2">Error loading product details:</div>
              <div>{error}</div>
              <button 
                onClick={fetchProductDetails}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Content */}
        {!loading && !error && product && (
          <>
            {/* Tabs */}
            <div className="px-6 py-2 border-b border-gray-200">
              <div className="flex space-x-6 overflow-x-auto">
                <button
                  className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'overview' 
                      ? 'border-green-500 text-green-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'savings' 
                      ? 'border-green-500 text-green-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('savings')}
                >
                  Energy Savings
                </button>
                <button
                  className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'environmental' 
                      ? 'border-green-500 text-green-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('environmental')}
                >
                  Environmental Impact
                </button>
                <button
                  className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'specifications'
                      ? 'border-green-500 text-green-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('specifications')}
                >
                  Specifications
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Product Header */}
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Product Image */}
                    <div className="w-full md:w-1/3 flex-shrink-0">
                      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center h-64">
                        {imageLoading ? (
                          <div className="animate-pulse flex flex-col items-center justify-center">
                            <Image className="h-20 w-20 text-gray-300 mb-2" />
                            <span className="text-gray-400 text-sm">Loading image...</span>
                          </div>
                        ) : productImage?.url ? (
                          <img
                            src={productImage.url}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <Home className="h-20 w-20 mx-auto mb-2 opacity-50" />
                            <span>Product image not available</span>
                          </div>
                        )}
                      </div>
                      {/* Unsplash Attribution */}
                      {productImage?.url && !product.imageUrl && (
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          {productImage.photographer ? (
                            <span>
                              Photo by{' '}
                              <a 
                                href={productImage.photographerUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                {productImage.photographer}
                              </a>{' '}
                              on{' '}
                              <a 
                                href="https://unsplash.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                Unsplash
                              </a>
                            </span>
                          ) : (
                            <span>
                              Image from{' '}
                              <a 
                                href="https://unsplash.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                Unsplash
                              </a>
                            </span>
                          )}
                        </div>
                      )}
                      {product.isSample && (
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          * Sample product based on recommendation data
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="w-full md:w-2/3">
                      <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
                      <p className="text-gray-600 mt-1">{product.category}</p>
                      
                      <div className="mt-4 text-2xl font-bold text-gray-900">
                        ${product.price.toLocaleString()}
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-gray-700">
                            Annual Savings: <span className="font-semibold">${product.annualSavings.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <BarChart2 className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-gray-700">
                            ROI: <span className="font-semibold">{(product.roi * 100).toFixed(1)}%</span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-gray-700">
                            Payback Period: <span className="font-semibold">{product.paybackPeriod.toFixed(1)} years</span>
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Zap className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-gray-700">
                            Energy Efficiency: <span className="font-semibold">{product.energyEfficiency}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="font-medium text-gray-900">Description</h3>
                        <p className="mt-1 text-gray-600">
                          {product.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Key Features */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Key Features</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      {product.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {activeTab === 'savings' && (
                <div className="space-y-8">
                  {/* Savings Summary */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Savings Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Monthly Savings</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${product.enhancedMetrics.monthlySavings.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">5-Year Savings</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${product.enhancedMetrics.fiveYearSavings.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">10-Year Savings</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${product.enhancedMetrics.tenYearSavings.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bill Reduction */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Energy Bill Reduction</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600">
                          {product.enhancedMetrics.percentageReduction.toFixed(1)}%
                        </div>
                        <div className="text-gray-600 mt-1">
                          Estimated reduction in your overall energy bills
                        </div>
                      </div>
                      
                      {/* Bill Comparison Visualization */}
                      <div className="mt-6">
                        <div className="text-sm text-gray-600 mb-2">
                          Current vs. Estimated Annual Energy Cost
                        </div>
                        <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 bg-green-500 rounded-l-lg"
                            style={{ 
                              width: `${100 - Math.min(product.enhancedMetrics.percentageReduction, 100)}%`,
                              transition: 'width 1s ease-in-out'
                            }}
                          ></div>
                          
                          <div className="absolute inset-0 flex items-center justify-between px-3">
                            <span className="text-xs font-medium text-white z-10">
                              With {product.name}
                            </span>
                            <span className="text-xs font-medium text-gray-800 z-10">
                              Current Cost
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>
                            ${((product.auditContext.energyInfo.electricityCost || 0) + 
                              (product.auditContext.energyInfo.gasCost || 0) - 
                              product.annualSavings).toLocaleString()}
                          </span>
                          <span>
                            ${((product.auditContext.energyInfo.electricityCost || 0) + 
                              (product.auditContext.energyInfo.gasCost || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payback Analysis */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Return on Investment</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="md:w-1/3">
                          <div className="relative h-32 w-32 mx-auto">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-lg font-semibold">Payback in</div>
                                <div className="text-3xl font-bold text-green-600">
                                  {product.paybackPeriod.toFixed(1)}
                                </div>
                                <div className="text-lg">years</div>
                              </div>
                            </div>
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#E5E7EB"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <path
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="3"
                                strokeDasharray={`${Math.min(100, 100 / (product.paybackPeriod / 10))}, 100`}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                        
                        <div className="md:w-2/3">
                          <p className="text-gray-600 mb-4">
                            The initial investment of ${product.price.toLocaleString()} will be recovered in {product.paybackPeriod.toFixed(1)} years through energy savings of ${product.annualSavings.toLocaleString()} per year.
                          </p>
                          
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Initial Investment</span>
                              <span className="font-semibold">${product.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Annual Savings</span>
                              <span className="font-semibold">${product.annualSavings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Annual Return (ROI)</span>
                              <span className="font-semibold">{(product.roi * 100).toFixed(1)}%</span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-between">
                              <span className="font-medium">Total 10-Year Return</span>
                              <span className="font-semibold">${(product.annualSavings * 10 - product.price).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'environmental' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Environmental Impact</h3>
                  
                  {/* CO2 Reduction */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">CO2 Emissions Reduction</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-white rounded-md text-center">
                        <div className="text-green-700 font-semibold">Annual</div>
                        <div className="text-xl font-bold mt-1">{product.enhancedMetrics.co2Reduction.annual.toFixed(0)} kg</div>
                        <div className="text-xs text-gray-500 mt-1">CO2 per year</div>
                      </div>
                      <div className="p-3 bg-white rounded-md text-center">
                        <div className="text-green-700 font-semibold">5-Year Impact</div>
                        <div className="text-xl font-bold mt-1">{product.enhancedMetrics.co2Reduction.fiveYear.toFixed(0)} kg</div>
                        <div className="text-xs text-gray-500 mt-1">CO2 over 5 years</div>
                      </div>
                      <div className="p-3 bg-white rounded-md text-center">
                        <div className="text-green-700 font-semibold">10-Year Impact</div>
                        <div className="text-xl font-bold mt-1">{product.enhancedMetrics.co2Reduction.tenYear.toFixed(0)} kg</div>
                        <div className="text-xs text-gray-500 mt-1">CO2 over 10 years</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Equivalencies */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-4">Equivalent To</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center bg-white p-4 rounded-md">
                        <div className="h-12 w-12 bg-green-100 flex items-center justify-center rounded-full mr-4">
                          <Leaf className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{product.enhancedMetrics.co2Reduction.equivalentTrees} Trees</div>
                          <div className="text-sm text-gray-600">Annual carbon absorption</div>
                        </div>
                      </div>
                      <div className="flex items-center bg-white p-4 rounded-md">
                        <div className="h-12 w-12 bg-green-100 flex items-center justify-center rounded-full mr-4">
                          <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 18h14M5 14h2M17 14h2M7 14a3 3 0 0 0-3-3M17 14a3 3 0 0 1 3-3M8 11V8M16 11V8M12 11V3M3 11h18" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold">{product.enhancedMetrics.co2Reduction.equivalentMilesDriven.toLocaleString()} Miles</div>
                          <div className="text-sm text-gray-600">Of driving avoided</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Environmental Benefit */}
                  <div className="bg-white p-4 border border-green-200 rounded-lg">
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-green-800">Environmental Benefit</h4>
                      <p className="text-green-700 mt-2">
                        By choosing this energy-efficient {product.category.toLowerCase()}, you're helping reduce greenhouse gas emissions and combat climate change.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'specifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Specifications</h3>
                  
                  {/* Product Specs */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-3 bg-gray-50 text-sm font-medium text-gray-900">Product Name</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{product.name}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 bg-gray-50 text-sm font-medium text-gray-900">Category</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{product.category}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 bg-gray-50 text-sm font-medium text-gray-900">Energy Efficiency</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{product.energyEfficiency}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 bg-gray-50 text-sm font-medium text-gray-900">Price</td>
                          <td className="px-6 py-3 text-sm text-gray-500">${product.price.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 bg-gray-50 text-sm font-medium text-gray-900">Annual Savings</td>
                          <td className="px-6 py-3 text-sm text-gray-500">${product.annualSavings.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 bg-gray-50 text-sm font-medium text-gray-900">Return on Investment (ROI)</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{(product.roi * 100).toFixed(1)}%</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 bg-gray-50 text-sm font-medium text-gray-900">Payback Period</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{product.paybackPeriod.toFixed(1)} years</td>
                        </tr>
                        {product.audit_id && (
                          <tr>
                            <td className="px-6 py-3 bg-gray-50 text-sm font-medium text-gray-900">Associated Audit</td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {new Date(product.audit_date || '').toLocaleDateString()}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Property Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.auditContext.propertyInfo.propertySize && (
                          <div>
                            <span className="text-gray-600 text-sm">Property Size:</span>
                            <div className="font-medium">{product.auditContext.propertyInfo.propertySize} sq ft</div>
                          </div>
                        )}
                        {product.auditContext.propertyInfo.propertyType && (
                          <div>
                            <span className="text-gray-600 text-sm">Property Type:</span>
                            <div className="font-medium capitalize">{product.auditContext.propertyInfo.propertyType}</div>
                          </div>
                        )}
                        {product.auditContext.propertyInfo.buildingAge && (
                          <div>
                            <span className="text-gray-600 text-sm">Building Age:</span>
                            <div className="font-medium">{product.auditContext.propertyInfo.buildingAge} years</div>
                          </div>
                        )}
                        {product.auditContext.propertyInfo.occupants && (
                          <div>
                            <span className="text-gray-600 text-sm">Occupants:</span>
                            <div className="font-medium">{product.auditContext.propertyInfo.occupants} people</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetailModal;
