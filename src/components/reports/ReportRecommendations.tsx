import React, { useState, useEffect } from 'react';
import { AuditRecommendation, RecommendationStatus, RecommendationPriority } from '../../types/energyAudit';
import { Calendar, DollarSign, Clock, AlertTriangle, CheckCircle2, ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';

// Interface for tracking edits to recommendations
interface RecommendationEdit {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

interface RecommendationsProps {
  recommendations: AuditRecommendation[];
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

const ReportRecommendations: React.FC<RecommendationsProps> = ({ 
  recommendations = [], // Default to empty array if undefined
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
  
  // For loading states
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});
  
  // For edit history
  const [editHistory, setEditHistory] = useState<Record<string, RecommendationEdit[]>>({});
  
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
  const sortedRecommendations = [...(recommendations || [])].sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  const setLoading = (id: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: isLoading
    }));
  };
  
  const setError = (id: string, errorMessage: string | null) => {
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
  
  const setSuccess = (id: string) => {
    setSuccessStates(prev => ({
      ...prev,
      [id]: true
    }));
  };
  
  const handleStatusChange = async (recommendation: AuditRecommendation, status: 'active' | 'implemented') => {
    if (!onUpdateStatus) return;
    
    const id = recommendation.id;
    setLoading(id, true);
    setError(id, null);
    
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
          setSuccess(id);
          return;
        } else {
          setError(id, 'Please enter a valid savings amount');
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
      
      setSuccess(id);
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      setError(id, 'Failed to update status');
    } finally {
      setLoading(id, false);
    }
  };
  
  const handlePriorityChange = async (recommendation: AuditRecommendation, priority: RecommendationPriority) => {
    if (!onUpdatePriority) return;
    
    const id = recommendation.id;
    setLoading(id, true);
    setError(id, null);
    
    try {
      // Track the edit
      trackEdit(id, 'priority', recommendation.priority, priority);
      
      await onUpdatePriority(id, priority);
      setEditingPriorityId(null);
      setSuccess(id);
    } catch (error) {
      console.error('Error updating recommendation priority:', error);
      setError(id, 'Failed to update priority');
    } finally {
      setLoading(id, false);
    }
  };
  
  const handleImplementationDetailsSubmit = async (recommendation: AuditRecommendation) => {
    if (!onUpdateImplementationDetails) return;
    
    const id = recommendation.id;
    setLoading(id, true);
    setError(id, null);
    
    try {
      const costValue = parseFloat(implementationCost);
      if (!implementationDate) {
        setError(id, 'Please select an implementation date');
        return;
      }
      
      if (isNaN(costValue)) {
        setError(id, 'Please enter a valid implementation cost');
        return;
      }
      
      // Track the edits
      trackEdit(id, 'implementationDate', recommendation.implementationDate, implementationDate);
      trackEdit(id, 'implementationCost', recommendation.implementationCost, costValue);
      
      await onUpdateImplementationDetails(id, implementationDate, costValue);
      setEditingImplementationId(null);
      setImplementationDate('');
      setImplementationCost('');
      setSuccess(id);
    } catch (error) {
      console.error('Error updating implementation details:', error);
      setError(id, 'Failed to update implementation details');
    } finally {
      setLoading(id, false);
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

  // Updated formatCurrency with improved error handling
  const formatCurrency = (value: number | null | undefined): string => {
    // Make sure data exists and value is a number
    if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) return 'N/A';
    try {
      return `$${value.toLocaleString()}`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `$${value}`;
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

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Recommendations</h2>
      
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
                <span className="font-medium text-green-600">{formatCurrency(recommendation.estimatedSavings)}/year</span>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-500 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                  Implementation Cost:
                </span>
                <span className="font-medium">{formatCurrency(recommendation.estimatedCost)}</span>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-blue-500" />
                  Payback Period:
                </span>
                <span className="font-medium">
                  {recommendation.paybackPeriod ? `${recommendation.paybackPeriod.toFixed(1)} years` : 'N/A'}
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
          </div>
        )}
      </div>
    </section>
  );
};

export default ReportRecommendations;
