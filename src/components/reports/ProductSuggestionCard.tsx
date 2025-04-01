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
 * Helper function to generate Energy Star product URLs
 */
const getEnergyStarUrl = (product: Product): string => {
  // Define category mappings for Energy Star URLs
  const energyStarCategoryMapping: Record<string, string> = {
    'lighting': 'light-fixtures/results',
    'light bulbs': 'light-fixtures/results', 
    'light fixtures': 'light-fixtures/results',
    'ceiling fans': 'ceiling-fans/results',
    'hvac systems': 'heating-cooling/results',
    'thermostats': 'connected-thermostats/results',
    'furnaces': 'furnaces/results',
    'air conditioners': 'central-air-conditioners/results',
    'heat pumps': 'heat-pumps/results',
    'insulation': 'home-envelope/results',
    'windows': 'windows/results',
    'doors': 'exterior-doors/results',
    'water heaters': 'water-heaters/results',
    'appliances': 'appliances/results',
    'refrigerators': 'refrigerators/results',
    'dishwashers': 'dishwashers/results',
    'clothes washers': 'clothes-washers/results',
    'dehumidifiers': 'dehumidifiers/results',
    'smart home': 'connected-home/results',
    'renewable energy': 'renewable-energy/results',
    'general': 'products/results'
  };
  
  // If product has a direct URL, use it
  if (product.imageUrl) return product.imageUrl;
  
  // Try to get Energy Star category
  const category = product.category?.toLowerCase() || 'general';
  const mappedCategory = energyStarCategoryMapping[category] || energyStarCategoryMapping['general'];
  
  // Build the Energy Star product finder URL (with /results suffix)
  const baseUrl = "https://www.energystar.gov/productfinder/product/certified-";
  return `${baseUrl}${mappedCategory}`;
};

/**
 * Helper function to generate Amazon product search URLs
 */
const getAmazonUrl = (product: Product): string => {
  // Extract more specific terms from product name and category
  const productName = product.name.toLowerCase();
  const category = product.category?.toLowerCase() || 'general';
  let searchTerm = '';
  
  if (category === 'light bulbs') {
    searchTerm = 'energy saving light bulbs';
  } else if (category === 'light fixtures' || (category === 'lighting' && productName.includes('fixture'))) {
    searchTerm = 'energy saving light fixtures';
  } else if (category === 'lighting') {
    // General lighting but not specifically fixtures or bulbs
    searchTerm = productName.includes('bulb') ? 'energy saving light bulbs' : 'energy saving lighting';
  } else if (category.includes('hvac') || category.includes('heating') || category.includes('cooling')) {
    // HVAC-related search
    if (productName.includes('thermostat')) {
      searchTerm = 'smart thermostat energy star';
    } else if (productName.includes('heat pump')) {
      searchTerm = 'energy efficient heat pump';
    } else {
      searchTerm = `energy efficient ${category}`;
    }
  } else {
    // For other categories, use the category itself plus energy efficient
    searchTerm = `energy efficient ${category}`;
  }
  
  // Include the product name in the search for more specific results
  return `https://www.amazon.com/s?k=energy+star+${encodeURIComponent(searchTerm)}`;
};

/**
 * Helper function to generate Home Depot product search URLs (tertiary fallback)
 */
const getHomeDepotUrl = (product: Product): string => {
  const searchTerm = `energy star ${product.category}`;
  return `https://www.homedepot.com/s/${encodeURIComponent(searchTerm)}?NCNI-5`;
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

          {/* Card Footer with Details Button and Shopping Links */}
          <div className="flex justify-between items-center mt-auto pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
            >
              <Info className="h-3 w-3 mr-1" />
              {isExpanded ? 'Less Details' : 'More Details'}
            </button>
            
            {/* Shopping Links Section */}
            <div className="flex space-x-2">
              {/* Energy Star Link */}
              <a
                href={getEnergyStarUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Energy Star
              </a>
              
              {/* Amazon Link */}
              <a
                href={getAmazonUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Amazon
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestionCard;
