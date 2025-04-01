import React, { useState } from 'react';
import { Product } from '../../services/productRecommendationService';
import { formatCurrency, formatPercentage } from '../../utils/formatting';
import { DollarSign, Star, Clock, Info, ExternalLink } from 'lucide-react';

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
            
            {/* Add external link if available */}
            {product.imageUrl && (
              <a
                href={product.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Product
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestionCard;
