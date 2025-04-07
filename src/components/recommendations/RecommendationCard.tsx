import React from 'react';
import { RecommendationCardProps } from './types';
import { formatCurrency } from '../../utils/financialCalculations';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Tag, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  MinusCircle, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import ProductSuggestionCard from './ProductSuggestionCard';

/**
 * RecommendationCard component
 * Displays a single recommendation with appropriate detail level based on display mode
 */
const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  displayMode,
  productSuggestions = [],
  budgetConstraint,
  isEditingSavings = false,
  isEditingPriority = false,
  isEditingImplementation = false,
  isLoading = false,
  errorMessage,
  successMessage,
  editHistory,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateImplementationDetails,
  onStartEditingSavings,
  onStartEditingPriority,
  onStartEditingImplementation,
  onCancelEditing
}) => {
  // Common helper functions
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  };
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <ArrowUpCircle className="h-4 w-4 text-red-500 mr-1" />;
      case 'medium':
        return <MinusCircle className="h-4 w-4 text-yellow-500 mr-1" />;
      case 'low':
        return <ArrowDownCircle className="h-4 w-4 text-green-500 mr-1" />;
      default:
        return null;
    }
  };
  
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'Not set';
    }
  };
  
  // Status editing UI - conditional rendering
  const renderStatusEdit = () => {
    if (!isEditingSavings || !onUpdateStatus) return null;
    
    const [actualSavings, setActualSavings] = React.useState<string>(
      recommendation.actualSavings ? recommendation.actualSavings.toString() : ''
    );
    
    return (
      <div className="flex items-center mt-1">
        <span className="mr-1">$</span>
        <input
          type="text"
          className="w-24 border-gray-300 rounded-md text-sm"
          value={actualSavings}
          onChange={(e) => setActualSavings(e.target.value)}
          placeholder="0"
        />
        <div className="ml-2 space-x-2">
          <button
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:bg-blue-300"
            onClick={() => {
              const savingsValue = parseFloat(actualSavings);
              if (!isNaN(savingsValue)) {
                onUpdateStatus(recommendation.id, 'implemented', savingsValue);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
            onClick={onCancelEditing}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };
  
  // Priority editing UI - conditional rendering
  const renderPriorityEdit = () => {
    if (!isEditingPriority || !onUpdatePriority) return null;
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-gray-500">Priority:</span>
        <div className="flex space-x-1">
          <button 
            className={`px-2 py-1 rounded-l text-xs flex items-center ${
              recommendation.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-red-50'
            }`}
            onClick={() => onUpdatePriority(recommendation.id, 'high')}
            disabled={isLoading}
          >
            <ArrowUpCircle className="h-3 w-3 mr-1" />
            High
          </button>
          <button 
            className={`px-2 py-1 text-xs flex items-center ${
              recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-yellow-50'
            }`}
            onClick={() => onUpdatePriority(recommendation.id, 'medium')}
            disabled={isLoading}
          >
            <MinusCircle className="h-3 w-3 mr-1" />
            Medium
          </button>
          <button 
            className={`px-2 py-1 rounded-r text-xs flex items-center ${
              recommendation.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-green-50'
            }`}
            onClick={() => onUpdatePriority(recommendation.id, 'low')}
            disabled={isLoading}
          >
            <ArrowDownCircle className="h-3 w-3 mr-1" />
            Low
          </button>
        </div>
        <button 
          className="text-gray-400 hover:text-gray-600 text-xs"
          onClick={onCancelEditing}
        >
          Cancel
        </button>
      </div>
    );
  };
  
  // Implementation details editing UI - conditional rendering
  const renderImplementationDetailsEdit = () => {
    if (!isEditingImplementation || !onUpdateImplementationDetails) return null;
    
    const [implementationDate, setImplementationDate] = React.useState<string>(
      recommendation.implementationDate || new Date().toISOString().split('T')[0]
    );
    
    const [implementationCost, setImplementationCost] = React.useState<string>(
      recommendation.implementationCost ? recommendation.implementationCost.toString() : ''
    );
    
    return (
      <div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-700 mb-2">Implementation Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Implementation Date</label>
            <input
              type="date"
              className="w-full border-gray-300 rounded-md text-sm"
              value={implementationDate}
              onChange={(e) => setImplementationDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Actual Implementation Cost</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <input
                type="text"
                className="w-full border-gray-300 rounded-md text-sm"
                value={implementationCost}
                onChange={(e) => setImplementationCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end space-x-2">
            <button
              className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
              onClick={onCancelEditing}
            >
              Cancel
            </button>
            <button
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={() => {
                const costValue = parseFloat(implementationCost);
                if (implementationDate && !isNaN(costValue)) {
                  onUpdateImplementationDetails(recommendation.id, implementationDate, costValue);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Edit history section - only for interactive mode
  const renderEditHistory = () => {
    if (displayMode !== 'interactive' || !editHistory || !(editHistory[recommendation.id]?.length > 0)) {
      return null;
    }
    
    return (
      <div className="mt-4 pt-3 border-t border-gray-200">
        <details className="text-sm">
          <summary className="text-blue-600 cursor-pointer font-medium">
            View Change History ({editHistory[recommendation.id]?.length || 0})
          </summary>
          <div className="mt-2 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
            <ul className="space-y-2">
              {(editHistory?.[recommendation.id] ?? []).map((edit, index) => (
                <li key={index} className="text-xs text-gray-600">
                  <span className="text-gray-400">{new Date(edit.timestamp || '').toLocaleString()}:</span>{' '}
                  Changed <span className="font-medium">{edit.field}</span> from{' '}
                  <span className="font-medium">{edit.oldValue || 'none'}</span> to{' '}
                  <span className="font-medium">{edit.newValue}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    );
  };
  
  // Status field (read-only or editable based on mode)
  const renderStatusField = () => {
    if (displayMode === 'compact') {
      return (
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Status:</span>
          <span className={`font-medium capitalize ${recommendation.status === 'implemented' ? 'text-green-600' : 'text-blue-600'}`}>
            {recommendation.status}
          </span>
        </div>
      );
    }
    
    if (displayMode === 'detailed' || displayMode === 'interactive') {
      if (displayMode === 'interactive' && onUpdateStatus) {
        return (
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">Status:</span>
            <select
              className="text-sm border-gray-300 rounded-md py-1"
              value={recommendation.status}
              onChange={(e) => onUpdateStatus(recommendation.id, e.target.value as 'active' | 'implemented')}
              disabled={isLoading}
            >
              <option value="active">Active</option>
              <option value="implemented">Implemented</option>
            </select>
            {isLoading && (
              <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
          </div>
        );
      }
      
      return (
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Status:</span>
          <span className={`font-medium capitalize ${recommendation.status === 'implemented' ? 'text-green-600' : 'text-blue-600'}`}>
            {recommendation.status}
          </span>
        </div>
      );
    }
    
    return null;
  };
  
  // Priority field (read-only or editable based on mode)
  const renderPriorityField = () => {
    // For all modes, show at least the basic priority
    if (isEditingPriority && displayMode === 'interactive') {
      return renderPriorityEdit();
    }
    
    const priorityDisplay = (
      <div className="flex items-center">
        <span className="text-gray-500 mr-1">Priority:</span>
        <span className="flex items-center font-medium capitalize">
          {getPriorityIcon(recommendation.priority)}
          {recommendation.priority}
        </span>
        {displayMode === 'interactive' && onStartEditingPriority && (
          <button
            className="ml-2 text-xs text-blue-500 hover:text-blue-700"
            onClick={() => onStartEditingPriority(recommendation.id)}
          >
            Edit
          </button>
        )}
      </div>
    );
    
    return priorityDisplay;
  };
  
  // Product suggestions section - only for detailed and interactive modes
  const renderProductSuggestions = () => {
    if (displayMode === 'compact') return null;
    
    return (
      <div className="mt-6 relative border rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Tag className="h-4 w-4 mr-1 text-blue-500" />
          Suggested Products
        </h4>
        
        {productSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productSuggestions.flatMap(match => 
              match.products ? match.products.map(product => (
                <ProductSuggestionCard 
                  key={product.id} 
                  product={product} 
                  budgetConstraint={budgetConstraint}
                />
              )) : []
            )}
          </div>
        ) : (
          <div className="bg-gray-100 p-3 rounded-lg text-gray-600 text-sm">
            <p className="mb-2">No specific product suggestions available for this recommendation.</p>
            
            {/* Energy Star Links Notice */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-sm mb-1">Looking for product options?</p>
              <p className="text-xs text-blue-700 mb-2">
                We suggest exploring energy-efficient products in the {recommendation.type} category.
              </p>
              
              <div className="mt-2 flex flex-col space-y-2">
                <a 
                  href={`https://www.amazon.com/s?k=energy+efficient+${recommendation.type}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-2">Amazon</span>
                  Browse energy-efficient {recommendation.type} products
                </a>
                
                <a 
                  href={`https://www.energystar.gov/products`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-2">Energy Star</span>
                  Explore all Energy Star certified products
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Status message rendering
  const renderStatusMessage = () => {
    if (!successMessage && !errorMessage) return null;
    
    if (successMessage) {
      return (
        <div className="absolute top-2 right-2 flex items-center text-green-600 text-sm font-medium animate-fade-out">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          <span>{successMessage}</span>
        </div>
      );
    }
    
    if (errorMessage) {
      return (
        <div className="absolute top-2 right-2 flex items-center text-red-600 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span>{errorMessage}</span>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div 
      className={`p-5 border-l-4 ${getPriorityColor(recommendation.priority)} bg-white shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg relative`}
    >
      {/* Status/Error Messages */}
      {renderStatusMessage()}
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            {recommendation.title}
          </h3>
          
          <div className="flex flex-wrap items-center text-sm mt-1 gap-y-1 space-x-2 sm:space-x-4">
            {/* Priority indicator */}
            {renderPriorityField()}
            
            {/* Category tag */}
            <div className="flex items-center">
              <Tag className="h-3 w-3 mr-1 text-blue-500" />
              <span className="text-gray-600 capitalize">{recommendation.type}</span>
            </div>
            
            {/* Status selector */}
            {renderStatusField()}
          </div>
        </div>
      </div>
      
      <p className="mt-3 text-gray-600">{recommendation.description}</p>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-500" />
            Estimated Savings:
          </span>
          <div className="flex items-center">
            <span className="font-medium text-green-600">{formatCurrency(recommendation.estimatedSavings)}/year</span>
            {recommendation.isEstimated && displayMode !== 'compact' && 
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Estimated</span>
            }
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
            Implementation Cost:
          </span>
          <div className="flex items-center">
            <span className="font-medium">
              {formatCurrency(recommendation.implementationCost || recommendation.estimatedCost)}
            </span>
            {recommendation.isEstimated && displayMode !== 'compact' && 
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Estimated</span>
            }
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1 text-blue-500" />
            Payback Period:
          </span>
          <span className="font-medium">
            {recommendation.paybackPeriod && !isNaN(recommendation.paybackPeriod)
              ? `${recommendation.paybackPeriod.toFixed(1)} years` 
              : 'N/A'}
          </span>
        </div>
        
        {displayMode !== 'compact' && recommendation.implementationDate && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-blue-500" />
              Implementation Date:
            </span>
            <span className="font-medium">
              {formatDate(recommendation.implementationDate)}
            </span>
          </div>
        )}
        
        {/* Implementation Details Form */}
        {renderImplementationDetailsEdit()}
        
        {/* Actual Savings (only shown for implemented recommendations) */}
        {displayMode !== 'compact' && recommendation.status === 'implemented' && (
          <div className={`${isEditingImplementation ? 'col-span-1 md:col-span-3' : ''} bg-gray-50 p-3 rounded-lg`}>
            <span className="text-sm text-gray-500 flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-green-500" />
              Actual Savings:
            </span>
            
            {isEditingSavings ? (
              renderStatusEdit()
            ) : (
              <div className="flex items-center">
                <span className="font-medium text-green-600">
                  {recommendation.actualSavings ? formatCurrency(recommendation.actualSavings) + '/year' : 'Not reported'}
                </span>
                {displayMode === 'interactive' && onStartEditingSavings && (
                  <button
                    className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                    onClick={() => onStartEditingSavings(recommendation.id)}
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Product Suggestions Section */}
      {renderProductSuggestions()}
      
      {/* Edit History Section */}
      {renderEditHistory()}
    </div>
  );
};

export default RecommendationCard;
