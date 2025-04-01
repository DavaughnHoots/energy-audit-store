import React, { useState } from 'react';
import { Product } from '../../services/productRecommendationService';
import { formatCurrency, formatPercentage } from '../../utils/formatting';
import { DollarSign, Star, Clock, Info, ExternalLink } from 'lucide-react';

// Import our product images
import lightBulbsImage from '../../assets/product-images/light-bulbs.svg';
import lightFixturesImage from '../../assets/product-images/light-fixtures.svg';
import hvacImage from '../../assets/product-images/hvac.svg';
import defaultImage from '../../assets/product-images/default.svg';

/**
 * Helper function to get the appropriate product image based on category
 */
const getProductImage = (product: Product): string => {
  const category = product.category?.toLowerCase() || '';
  
  if (category.includes('light') && category.includes('bulb')) {
    return lightBulbsImage;
  } else if (category.includes('light') && category.includes('fixture')) {
    return lightFixturesImage;
  } else if (category.includes('hvac') || category.includes('heating') || category.includes('cooling')) {
    return hvacImage;
  }
  
  return defaultImage;
};

/**
 * Helper function to generate product URLs with fallbacks
 * 1. Use imageUrl if available (direct product link)
 * 2. Try Energy Star with updated URL format
 * 3. Fallback to Amazon search if category exists
 */
const getProductUrl = (product: Product): string => {
  // Use imageUrl if available (direct product URL)
  if (product.imageUrl) return product.imageUrl;
  
  // Define category mappings for Energy Star URLs
  const energyStarCategoryMapping: Record<string, string> = {
    'lighting': 'light-fixtures/results',
    'light bulbs': 'light-fixtures/results', 
    'light fixtures': 'light-fixtures/results',
    'hvac': 'heating-cooling/results',
    'insulation': 'home-envelope/results',
    'windows & doors': 'windows-doors/results',
    'water heating': 'water-heaters/results',
    'energy-efficient appliances': 'appliances/results',
    'smart home devices': 'connected-home/results',
    'renewable energy': 'renewable-energy/results',
    'general': 'products/results'
  };
  
  // Try to get Energy Star category
  const category = product.category?.toLowerCase() || 'general';
  const mappedCategory = energyStarCategoryMapping[category] || energyStarCategoryMapping['general'];
  
  // Amazon search fallback URL
  const getAmazonUrl = (searchTerm: string) => {
    return `https://www.amazon.com/s?k=energy+star+${encodeURIComponent(searchTerm)}`;
  };
  
  // Home Depot search URL (tertiary fallback)
  const getHomeDepotUrl = (searchTerm: string) => {
    return `https://www.homedepot.com/s/${encodeURIComponent(searchTerm)}?NCNI-5`;
  };
  
  // Check if we should use Amazon (Energy Star categories we know are broken)
  if (category === 'light bulbs' || category === 'lighting') {
    return getAmazonUrl('energy saving light bulbs');
  }
  
  // Build the Energy Star product finder URL (with /results suffix)
  const baseUrl = "https://www.energystar.gov/productfinder/product/certified-";
  return `${baseUrl}${mappedCategory}`;
};

/**
 * Determines if the URL points to a specific product or a general search
 */
const isSpecificProductUrl = (product: Product): boolean => {
  return !!product.imageUrl;
};

interface ProductSuggestionCardProps {
  product: Product;
  budgetConstraint?: number;
}

const ProductSuggestionCard: React.FC<ProductSuggestionCardProps> = ({ 
  product,
  budgetConstraint 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if product is within budget
  const isWithinBudget = !budgetConstraint || product.price <= budgetConstraint;

  return (
    <div 
      className={`border rounded-md overflow-hidden ${
        isWithinBudget ? 'border-green-200' : 'border-gray-200'
      } hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex flex-col h-full">
        {/* Product Header */}
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
          <h4 className="font-medium text-sm text-gray-800 truncate">{product.name}</h4>
          {isWithinBudget && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
              Within Budget
            </span>
          )}
        </div>

        {/* Product Body */}
        <div className="p-3 flex-grow flex flex-col">
          {/* Product Image */}
          <div className="mb-3 text-center">
            <img 
              src={getProductImage(product)} 
              alt={product.name} 
              className="h-20 mx-auto mb-1"
            />
            <span className="text-xs text-gray-500 block">{product.category}</span>
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center text-xs text-gray-600">
              <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Price: <span className="font-medium">{formatCurrency(product.price)}</span></span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Star className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Efficiency: <span className="font-medium">{product.energyEfficiency}</span></span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Savings: <span className="font-medium text-green-600">{formatCurrency(product.annualSavings)}/yr</span></span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Payback: <span className="font-medium">{product.paybackPeriod.toFixed(1)} years</span></span>
            </div>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <div className="mt-1 text-xs text-gray-600">
              <p className="mb-2">{product.description}</p>
              {product.features && product.features.length > 0 && (
                <div className="mt-2">
                  <h5 className="font-medium mb-1">Features:</h5>
                  <ul className="list-disc pl-4">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2">
                <h5 className="font-medium mb-1">ROI:</h5>
                <p>{formatPercentage(product.roi)}</p>
              </div>
            </div>
          )}

          {/* Card Footer */}
          <div className="flex justify-between items-center mt-auto pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
            >
              <Info className="h-3 w-3 mr-1" />
              {isExpanded ? 'Less Details' : 'More Details'}
            </button>
            
            {/* Always show product link - with fallback URL if needed */}
            <a
              href={getProductUrl(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {product.imageUrl ? 'View Product' : 'Browse Similar'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestionCard;
