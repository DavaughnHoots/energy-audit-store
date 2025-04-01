import React, { useState, useEffect } from 'react';
import { AuditRecommendation, RecommendationStatus, RecommendationPriority } from '../../types/energyAudit';
import { Calendar, DollarSign, Clock, AlertTriangle, CheckCircle2, ArrowUpCircle, ArrowDownCircle, MinusCircle, Tag, Filter } from 'lucide-react';
import ProductSuggestionCard from './ProductSuggestionCard';
import { 
  filterRecommendationsByUserPreferences, 
  matchProductsToRecommendations,
  mapRecommendationTypeToCategory,
  ProductRecommendationMatch
} from '../../services/productRecommendationService';

// Interface for tracking edits to recommendations
interface RecommendationEdit {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

interface EnhancedRecommendationsProps {
  recommendations: AuditRecommendation[];
  userCategories?: string[]; // User's preferred product categories
  budgetConstraint?: number; // User's budget constraint
  onUpdateStatus?: (
    recommendationId: string, 
    status: 'active' | 'implemented',
    actualSavings?: number
  ) => Promise<void>;
  onUpdatePriority?: (
    recommendationId: string,
    priority: RecommendationPriority
  ) => Promise<void>;
  onUpdateImplementationDetails?: (
    recommendationId: string,
    implementationDate: string,
    implementationCost: number
  ) => Promise<void>;
}

const EnhancedReportRecommendations: React.FC<EnhancedRecommendationsProps> = ({ 
  recommendations = [], // Default to empty array if undefined
  userCategories = [],
  budgetConstraint,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateImplementationDetails
}) => {
  // State for editing different fields
  const [editingSavingsId, setEditingSavingsId] = useState<string | null>(null);
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [editingImplementationId, setEditingImplementationId] = useState<string | null>(null);
  const [actualSavings, setActualSavings] = useState<string>('');
  const [implementationDate, setImplementationDate] = useState<string>('');
  const [implementationCost, setImplementationCost] = useState<string>('');
  
  // For loading states and errors
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});
  
  // For edit history
  const [editHistory, setEditHistory] = useState<Record<string, RecommendationEdit[]>>({});
  
  // For product recommendations
  const [productMatches, setProductMatches] = useState<ProductRecommendationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(userCategories.length === 0);
  
  // Filtered recommendations based on user preferences
  const [filteredRecommendations, setFilteredRecommendations] = useState<AuditRecommendation[]>(recommendations);
  
  // Filter recommendations based on user categories
  useEffect(() => {
    if (showAllRecommendations) {
      setFilteredRecommendations(recommendations);
    } else {
      setFilteredRecommendations(
        filterRecommendationsByUserPreferences(recommendations, userCategories)
      );
    }
  }, [recommendations, userCategories, showAllRecommendations]);
  
  // Fetch product recommendations
  useEffect(() => {
    const fetchProductRecommendations = async () => {
      setLoading(true);
      console.log('EnhancedReportRecommendations: Fetching product recommendations with:', {
        recommendations: filteredRecommendations.length,
        userCategories,
        budgetConstraint
      });
      
      try {
        const matches = await matchProductsToRecommendations(
          filteredRecommendations,
          userCategories,
          budgetConstraint
        );
        console.log('EnhancedReportRecommendations: Received product matches:', matches);
        setProductMatches(matches);
      } catch (error) {
        console.error('Error fetching product recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductRecommendations();
  }, [filteredRecommendations, userCategories, budgetConstraint]);
  
  // Function to track edits
  const trackEdit = (
    recommendationId: string, 
    field: string, 
    oldValue: any, 
    newValue: any
  ) => {
    const edit: RecommendationEdit = {
      field,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    };
    
    setEditHistory(prev => ({
      ...prev,
      [recommendationId]: [...(prev[recommendationId] || []), edit]
    }));
  };
  
  // Reset success states after 3 seconds
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    Object.keys(successStates).forEach(id => {
      if (successStates[id]) {
        const timeout = setTimeout(() => {
          setSuccessStates(prev => ({
            ...prev,
            [id]: false
          }));
        }, 3000);
        timeouts.push(timeout);
      }
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [successStates]);

  // Sort recommendations by priority
  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  // Helper functions to update loading and error states
  const updateLoading = (id: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: isLoading
    }));
  };
  
  const updateError = (id: string, errorMessage: string | null) => {
    setErrorStates(prev => ({
      ...prev,
      [id]: errorMessage || ''
    }));
  };
  
  // Helper to safely handle potentially undefined strings
  const safeStringValue = (value: string | number | null | undefined): string => {
    if (value === undefined || value === null) return '';
    return String(value);
  };
  
  const updateSuccess = (id: string) => {
    setSuccessStates(prev => ({
      ...prev,
      [id]: true
    }));
  };
  
  const handleStatusChange = async (recommendation: AuditRecommendation, status: 'active' | 'implemented') => {
    if (!onUpdateStatus) return;
    
    const id = recommendation.id;
    updateLoading(id, true);
    updateError(id, null);
    
    try {
      // Track the edit
      trackEdit(id, 'status', recommendation.status, status);
      
      // If we're setting to implemented and there's actual savings data, use it
      if (status === 'implemented' && recommendation.id === editingSavingsId && actualSavings) {
        const savingsValue = parseFloat(actualSavings);
        if (!isNaN(savingsValue)) {
          await onUpdateStatus(recommendation.id, status, savingsValue);
          
          // If changing to implemented and this is the first time, prompt for implementation details
          if (recommendation.status !== 'implemented' && 
              (!recommendation.implementationDate || !recommendation.implementationCost)) {
            setEditingImplementationId(recommendation.id);
            const currentDate = new Date().toISOString().split('T')[0];
            setImplementationDate(currentDate || '');
            setImplementationCost('');
          }
          
          setEditingSavingsId(null);
          setActualSavings('');
          updateSuccess(id);
          return;
        } else {
          updateError(id, 'Please enter a valid savings amount');
          return;
        }
      }
      
      // Otherwise just update the status
      await onUpdateStatus(recommendation.id, status);
      
      // If changing to implemented and this is the first time, prompt for implementation details
      if (status === 'implemented' && 
          recommendation.status !== 'implemented' && 
          (!recommendation.implementationDate || !recommendation.implementationCost)) {
        setEditingImplementationId(recommendation.id);
        const currentDate = new Date().toISOString().split('T')[0];
        setImplementationDate(currentDate || '');
        setImplementationCost('');
      }
      
      updateSuccess(id);
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      updateError(id, 'Failed to update status');
    } finally {
      updateLoading(id, false);
    }
  };
  
  const handlePriorityChange = async (recommendation: AuditRecommendation, priority: RecommendationPriority) => {
    if (!onUpdatePriority) return;
    
    const id = recommendation.id;
    updateLoading(id, true);
    updateError(id, null);
    
    try {
      // Track the edit
      trackEdit(id, 'priority', recommendation.priority, priority);
      
      await onUpdatePriority(id, priority);
      setEditingPriorityId(null);
      updateSuccess(id);
    } catch (error) {
      console.error('Error updating recommendation priority:', error);
      updateError(id, 'Failed to update priority');
    } finally {
      updateLoading(id, false);
    }
  };
  
  const handleImplementationDetailsSubmit = async (recommendation: AuditRecommendation) => {
    if (!onUpdateImplementationDetails) return;
    
    const id = recommendation.id;
    updateLoading(id, true);
    updateError(id, null);
    
    try {
      const costValue = parseFloat(implementationCost);
      if (!implementationDate) {
        updateError(id, 'Please select an implementation date');
        return;
      }
      
      if (isNaN(costValue)) {
        updateError(id, 'Please enter a valid implementation cost');
        return;
      }
      
      // Track the edits
      trackEdit(id, 'implementationDate', recommendation.implementationDate, implementationDate);
      trackEdit(id, 'implementationCost', recommendation.implementationCost, costValue);
      
      await onUpdateImplementationDetails(id, implementationDate, costValue);
      setEditingImplementationId(null);
      setImplementationDate('');
      setImplementationCost('');
      updateSuccess(id);
    } catch (error) {
      console.error('Error updating implementation details:', error);
      updateError(id, 'Failed to update implementation details');
    } finally {
      updateLoading(id, false);
    }
  };

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

  // Enhanced formatCurrency with better handling of potential zero values
  const formatCurrency = (value: number | null | undefined): string => {
    // Check for undefined, null, or NaN
    if (value === undefined || value === null) return 'N/A';
    
    // Convert string values to numbers if needed (API might return strings)
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Only return N/A if it's not a valid number after conversion
    if (isNaN(numValue)) return 'N/A';
    
    // Even zero is a valid value that should be displayed
    try {
      return `$${numValue.toLocaleString()}`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `$${numValue}`;
    }
  };
  
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  // Helper to get product suggestions for a recommendation
  const getProductSuggestions = (recommendationId: string) => {
    const match = productMatches.find(m => m.recommendationId === recommendationId);
    const products = match?.products || [];
    console.log(`Getting product suggestions for recommendation ${recommendationId}: found ${products.length} products`);
    return products;
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
        
        {userCategories.length > 0 && (
          <div className="flex items-center">
            <button
              onClick={() => setShowAllRecommendations(!showAllRecommendations)}
              className={`flex items-center text-xs px-3 py-1 rounded-md ${
                showAllRecommendations 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              {showAllRecommendations ? 'Show All' : 'Show Relevant Only'}
            </button>
          </div>
        )}
      </div>
      
      {/* Show number of filtered recommendations */}
      <p className="text-sm text-gray-500 mb-4">
        Showing {filteredRecommendations.length} of {recommendations.length} recommendations
        {!showAllRecommendations && userCategories.length > 0 && (
          <span> relevant to your selected preferences: {userCategories.join(', ')}</span>
        )}
      </p>
      
      <div className="space-y-6">
        {sortedRecommendations.map((recommendation) => (
          <div 
            key={recommendation.id} 
            className={`p-5 border-l-4 ${getPriorityColor(recommendation.priority)} bg-white shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg relative`}
          >
            {/* Success indicator */}
            {successStates[recommendation.id] && (
              <div className="absolute top-2 right-2 flex items-center text-green-600 text-sm font-medium animate-fade-out">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>Saved</span>
              </div>
            )}
            
            {/* Error indicator */}
            {errorStates[recommendation.id] && (
              <div className="absolute top-2 right-2 flex items-center text-red-600 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>{errorStates[recommendation.id]}</span>
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  {recommendation.title}
                </h3>
                
                <div className="flex items-center text-sm mt-1 space-x-4">
                  {/* Priority indicator */}
                  <div className="flex items-center">
                    {editingPriorityId === recommendation.id ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Priority:</span>
                        <div className="flex space-x-1">
                          <button 
                            className={`px-2 py-1 rounded-l text-xs flex items-center ${
                              recommendation.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-red-50'
                            }`}
                            onClick={() => handlePriorityChange(recommendation, 'high')}
                            disabled={loadingStates[recommendation.id]}
                          >
                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                            High
                          </button>
                          <button 
                            className={`px-2 py-1 text-xs flex items-center ${
                              recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-yellow-50'
                            }`}
                            onClick={() => handlePriorityChange(recommendation, 'medium')}
                            disabled={loadingStates[recommendation.id]}
                          >
                            <MinusCircle className="h-3 w-3 mr-1" />
                            Medium
                          </button>
                          <button 
                            className={`px-2 py-1 rounded-r text-xs flex items-center ${
                              recommendation.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                            }`}
                            onClick={() => handlePriorityChange(recommendation, 'low')}
                            disabled={loadingStates[recommendation.id]}
                          >
                            <ArrowDownCircle className="h-3 w-3 mr-1" />
                            Low
                          </button>
                        </div>
                        <button 
                          className="text-gray-400 hover:text-gray-600 text-xs"
                          onClick={() => setEditingPriorityId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">Priority:</span>
                        <span className="flex items-center font-medium capitalize">
                          {getPriorityIcon(recommendation.priority)}
                          {recommendation.priority}
                        </span>
                        {onUpdatePriority && (
                          <button
                            className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                            onClick={() => setEditingPriorityId(recommendation.id)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Category tag */}
                  <div className="flex items-center">
                    <Tag className="h-3 w-3 mr-1 text-blue-500" />
                    <span className="text-gray-600 capitalize">{recommendation.type}</span>
                  </div>
                  
                  {/* Status selector */}
                  {onUpdateStatus && (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">Status:</span>
                      <select
                        className="text-sm border-gray-300 rounded-md py-1"
                        value={recommendation.status}
                        onChange={(e) => handleStatusChange(recommendation, e.target.value as 'active' | 'implemented')}
                        disabled={loadingStates[recommendation.id]}
                      >
                        <option value="active">Active</option>
                        <option value="implemented">Implemented</option>
                      </select>
                      {loadingStates[recommendation.id] && (
                        <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="mt-3 text-gray-600">{recommendation.description}</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-500 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                  Estimated Savings:
                </span>
                <div className="flex items-center">
                  <span className="font-medium text-green-600">{formatCurrency(recommendation.estimatedSavings)}/year</span>
                  {recommendation.isEstimated && 
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
                  <span className="font-medium">{formatCurrency(recommendation.estimatedCost)}</span>
                  {recommendation.isEstimated && 
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
              
              {recommendation.implementationDate && (
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
              {editingImplementationId === recommendation.id && (
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
                        onClick={() => setEditingImplementationId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() => handleImplementationDetailsSubmit(recommendation)}
                        disabled={loadingStates[recommendation.id]}
                      >
                        {loadingStates[recommendation.id] ? 'Saving...' : 'Save Details'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Actual Savings (only shown for implemented recommendations) */}
              {recommendation.status === 'implemented' && (
                <div className={`${editingImplementationId === recommendation.id ? 'col-span-1 md:col-span-2' : ''} bg-gray-50 p-3 rounded-lg`}>
                  <span className="text-sm text-gray-500 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    Actual Savings:
                  </span>
                  
                  {recommendation.id === editingSavingsId ? (
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
                          onClick={() => handleStatusChange(recommendation, 'implemented')}
                          disabled={loadingStates[recommendation.id]}
                        >
                          {loadingStates[recommendation.id] ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                          onClick={() => setEditingSavingsId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="font-medium text-green-600">
                        {recommendation.actualSavings ? formatCurrency(recommendation.actualSavings) + '/year' : 'Not reported'}
                      </span>
                      {onUpdateStatus && (
                        <button
                          className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                          onClick={() => {
                            setEditingSavingsId(recommendation.id);
                            setActualSavings(safeStringValue(recommendation.actualSavings));
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Product Suggestions Section - ENHANCED V2 */}
            <div className="mt-6 relative border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-1 text-blue-500" />
                Suggested Products
              </h4>
              
              {getProductSuggestions(recommendation.id).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getProductSuggestions(recommendation.id).map(product => (
                    <ProductSuggestionCard 
                      key={product.id} 
                      product={product} 
                      budgetConstraint={budgetConstraint}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 p-3 rounded-lg text-gray-600 text-sm">
                  <p className="mb-2">No specific product suggestions available for this recommendation.</p>
                  
                  {/* Force display a mock product to verify component is working */}
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-sm mb-1">Mock Product (Debug Only)</p>
                    <p className="text-xs text-green-700">
                      This mock product is shown to verify the product suggestion component is working correctly.
                    </p>
                    
                    <div className="mt-2 p-2 bg-white rounded border border-green-200">
                      <p className="text-sm font-semibold">Energy Efficient {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)} Solution</p>
                      <p className="text-xs text-gray-600">Price: $199.99 | ROI: 85%</p>
                      <div className="mt-1 flex justify-end">
                        <button className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Edit History Section (initially collapsed) */}
            {(editHistory[recommendation.id]?.length ?? 0) > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <details className="text-sm">
                  <summary className="text-blue-600 cursor-pointer font-medium">
                    View Change History ({editHistory[recommendation.id]?.length || 0})
                  </summary>
                  <div className="mt-2 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                    <ul className="space-y-2">
                      {(editHistory[recommendation.id] || []).map((edit, index) => (
                        <li key={index} className="text-xs text-gray-600">
                          <span className="text-gray-400">{new Date(edit.timestamp).toLocaleString()}:</span>{' '}
                          Changed <span className="font-medium">{edit.field}</span> from{' '}
                          <span className="font-medium">{edit.oldValue || 'none'}</span> to{' '}
                          <span className="font-medium">{edit.newValue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}

        {sortedRecommendations.length === 0 && (
          <div className="p-4 bg-white shadow rounded-lg">
            <p className="text-gray-500">No recommendations available.</p>
            {!showAllRecommendations && userCategories.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowAllRecommendations(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Show all recommendations
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default EnhancedReportRecommendations;
