import React, { useState, useEffect } from 'react';
import { UnifiedRecommendationsProps, RecommendationEdit } from './types';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import RecommendationFilters from './RecommendationFilters';
import RecommendationCard from './RecommendationCard';
import { 
  filterRecommendationsByUserPreferences, 
  matchProductsToRecommendations,
  ProductRecommendationMatch 
} from '../../services/productRecommendationService';

/**
 * UnifiedRecommendations component
 * A unified component that displays recommendations with different display modes for Dashboard and Reports
 */
const UnifiedRecommendations: React.FC<UnifiedRecommendationsProps> = ({
  recommendations = [],
  userCategories = [],
  budgetConstraint,
  displayMode = 'compact',
  maxRecommendations,
  showProductSuggestions = displayMode !== 'compact',
  auditId,
  isLoading = false,
  onRefresh,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateImplementationDetails,
  isDefaultData = false,
  dataSource = 'detailed'
}) => {
  const navigate = useNavigate();
  const [showAllRecommendations, setShowAllRecommendations] = useState(userCategories.length === 0);
  const [filteredRecommendations, setFilteredRecommendations] = useState(recommendations);
  const [productMatches, setProductMatches] = useState<ProductRecommendationMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // UI state for editing functionality (only used in interactive mode)
  const [editingSavingsId, setEditingSavingsId] = useState<string | null>(null);
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [editingImplementationId, setEditingImplementationId] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});
  const [editHistory, setEditHistory] = useState<Record<string, RecommendationEdit[]>>({});

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
  
  // Fetch product matches when recommendations or display mode change
  useEffect(() => {
    const fetchProductMatches = async () => {
      if (!showProductSuggestions || displayMode === 'compact') {
        return;
      }
      
      setMatchesLoading(true);
      try {
        const matches = await matchProductsToRecommendations(
          filteredRecommendations,
          userCategories,
          budgetConstraint
        );
        setProductMatches(matches);
      } catch (error) {
        console.error('Error fetching product matches:', error);
      } finally {
        setMatchesLoading(false);
      }
    };
    
    fetchProductMatches();
  }, [filteredRecommendations, userCategories, budgetConstraint, showProductSuggestions, displayMode]);
  
  // Reset success messages after a delay
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
  
  // Limit recommendations for dashboard mode
  const displayedRecommendations = maxRecommendations
    ? sortedRecommendations.slice(0, maxRecommendations)
    : sortedRecommendations;
  
  // Event handlers for interactive mode
  const trackEdit = (recommendationId: string, field: string, oldValue: any, newValue: any) => {
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
  
  const updateSuccess = (id: string) => {
    setSuccessStates(prev => ({
      ...prev,
      [id]: true
    }));
  };
  
  const handleStatusChange = async (id: string, status: 'active' | 'implemented', actualSavings?: number) => {
    if (!onUpdateStatus) return;
    
    updateLoading(id, true);
    updateError(id, null);
    
    try {
      // Find the recommendation to track changes
      const recommendation = recommendations.find(r => r.id === id);
      if (recommendation) {
        trackEdit(id, 'status', recommendation.status, status);
      }
      
      await onUpdateStatus(id, status, actualSavings);
      
      // If changing to implemented and this is the first time, prompt for implementation details
      if (status === 'implemented' && recommendation?.status !== 'implemented' && 
          (!recommendation?.implementationDate || !recommendation?.implementationCost)) {
        setEditingImplementationId(id);
      }
      
      setEditingSavingsId(null);
      updateSuccess(id);
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      updateError(id, 'Failed to update status');
    } finally {
      updateLoading(id, false);
    }
  };
  
  const handlePriorityChange = async (id: string, priority: 'high' | 'medium' | 'low') => {
    if (!onUpdatePriority) return;
    
    updateLoading(id, true);
    updateError(id, null);
    
    try {
      // Find the recommendation to track changes
      const recommendation = recommendations.find(r => r.id === id);
      if (recommendation) {
        trackEdit(id, 'priority', recommendation.priority, priority);
      }
      
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
  
  const handleImplementationDetailsSubmit = async (
    id: string, 
    date: string, 
    cost: number
  ) => {
    if (!onUpdateImplementationDetails) return;
    
    updateLoading(id, true);
    updateError(id, null);
    
    try {
      // Find the recommendation to track changes
      const recommendation = recommendations.find(r => r.id === id);
      if (recommendation) {
        trackEdit(id, 'implementationDate', recommendation.implementationDate, date);
        trackEdit(id, 'implementationCost', recommendation.implementationCost, cost);
      }
      
      await onUpdateImplementationDetails(id, date, cost);
      setEditingImplementationId(null);
      updateSuccess(id);
    } catch (error) {
      console.error('Error updating implementation details:', error);
      updateError(id, 'Failed to update implementation details');
    } finally {
      updateLoading(id, false);
    }
  };
  
  // Helper to find product matches for a recommendation
  const getProductMatchesForRecommendation = (recommendationId: string): ProductRecommendationMatch => {
    return productMatches.find(match => match.recommendationId === recommendationId) || 
           { recommendationId, products: [] };
  };
  
  // Handler for viewing full report details
  const handleViewFullDetails = () => {
    if (auditId) {
      navigate(`/reports/${auditId}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mx-0 flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mx-0">
      {/* Filters section */}
      <RecommendationFilters
        userCategories={userCategories}
        showAllRecommendations={showAllRecommendations}
        onToggleShowAll={() => setShowAllRecommendations(!showAllRecommendations)}
        dataSource={dataSource}
        totalRecommendations={recommendations.length}
        filteredCount={filteredRecommendations.length}
      />
      
      <div className="space-y-6">
        {displayedRecommendations.length > 0 ? (
          displayedRecommendations.map(recommendation => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              displayMode={displayMode}
              productSuggestions={showProductSuggestions ? [getProductMatchesForRecommendation(recommendation.id)] : []}
              budgetConstraint={budgetConstraint}
              isEditingSavings={editingSavingsId === recommendation.id}
              isEditingPriority={editingPriorityId === recommendation.id}
              isEditingImplementation={editingImplementationId === recommendation.id}
              isLoading={loadingStates[recommendation.id] || false}
              errorMessage={errorStates[recommendation.id] || undefined}
              successMessage={successStates[recommendation.id] ? 'Saved' : undefined}
              editHistory={editHistory}
              onUpdateStatus={onUpdateStatus ? handleStatusChange : undefined}
              onUpdatePriority={onUpdatePriority ? handlePriorityChange : undefined}
              onUpdateImplementationDetails={onUpdateImplementationDetails ? handleImplementationDetailsSubmit : undefined}
              onStartEditingSavings={onUpdateStatus ? (id) => setEditingSavingsId(id) : undefined}
              onStartEditingPriority={onUpdatePriority ? (id) => setEditingPriorityId(id) : undefined}
              onStartEditingImplementation={onUpdateImplementationDetails ? (id) => setEditingImplementationId(id) : undefined}
              onCancelEditing={() => {
                setEditingSavingsId(null);
                setEditingPriorityId(null);
                setEditingImplementationId(null);
              }}
            />
          ))
        ) : (
          <div className="p-6 bg-gray-50 shadow-sm rounded-lg text-center">
            <p className="text-gray-500 mb-4">No recommendations available yet.</p>
            {!isDefaultData && (
              <a
                href="/energy-audit"
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 inline-block"
              >
                Complete an Energy Audit
              </a>
            )}
          </div>
        )}

        {/* Note about showing limited recommendations */}
        {maxRecommendations && sortedRecommendations.length > maxRecommendations && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500 mb-2">
              Showing {displayedRecommendations.length} of {sortedRecommendations.length} recommendations
            </p>
          </div>
        )}

        {/* View all button that links to interactive report (only for Dashboard mode) */}
        {displayMode === 'compact' && recommendations.length > 0 && auditId && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleViewFullDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              <span>View All Recommendations & Details</span>
            </button>
          </div>
        )}
        
        {sortedRecommendations.length === 0 && recommendations.length > 0 && (
          <div className="p-4 bg-white shadow rounded-lg">
            <p className="text-gray-500">No recommendations match your current filters.</p>
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
    </div>
  );
};

export default UnifiedRecommendations;
