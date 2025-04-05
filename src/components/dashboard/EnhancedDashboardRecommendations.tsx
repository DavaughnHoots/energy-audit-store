import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuditRecommendation } from '../../types/energyAudit';
import { Calendar, DollarSign, Clock, Tag, Filter, ArrowUpCircle, ArrowDownCircle, MinusCircle, ExternalLink, InfoIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/financialCalculations';

interface EnhancedDashboardRecommendationsProps {
  recommendations: AuditRecommendation[];
  userCategories?: string[];
  budgetConstraint?: number;
  auditId?: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  isDefaultData?: boolean;
  dataSource?: 'detailed' | 'generated' | 'empty';
}

/**
 * EnhancedDashboardRecommendations component
 * 
 * Displays a streamlined version of recommendations with filtering capabilities
 * and a link to the full interactive report.
 */
const EnhancedDashboardRecommendations: React.FC<EnhancedDashboardRecommendationsProps> = ({ 
  recommendations = [],
  userCategories = [],
  budgetConstraint,
  auditId,
  isLoading = false,
  onRefresh,
  isDefaultData = false,
  dataSource = 'detailed'
}) => {
  const navigate = useNavigate();
  const [showAllRecommendations, setShowAllRecommendations] = useState(userCategories.length === 0);
  const [filteredRecommendations, setFilteredRecommendations] = useState<AuditRecommendation[]>(recommendations);
  
  // Filter recommendations based on user categories
  useEffect(() => {
    if (showAllRecommendations) {
      setFilteredRecommendations(recommendations);
    } else {
      // Simple filtering for the dashboard version
      const filtered = recommendations.filter(rec => 
        userCategories.some(cat => rec.type.toLowerCase().includes(cat.toLowerCase()))
      );
      setFilteredRecommendations(filtered);
    }
  }, [recommendations, userCategories, showAllRecommendations]);

  // Sort recommendations by priority
  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

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

  // Handler for viewing full details in interactive report
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
        
        {dataSource === 'generated' && (
          <div className="flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mr-2">
            <InfoIcon className="h-3 w-3 mr-1" />
            <span>Sample Data</span>
          </div>
        )}
        
        {userCategories.length > 0 && recommendations.length > 0 && (
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
      {recommendations.length > 0 ? (
        <p className="text-sm text-gray-500 mb-4">
          Showing {Math.min(sortedRecommendations.length, 3)} of {filteredRecommendations.length} recommendations
          {!showAllRecommendations && userCategories.length > 0 && (
            <span> relevant to your selected preferences: {userCategories.join(', ')}</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          No recommendations available yet. Complete an energy audit to get personalized recommendations.
        </p>
      )}
      
      <div className="space-y-6">
        {sortedRecommendations.length > 0 ? (
          sortedRecommendations.slice(0, 3).map((recommendation) => (
            <div 
              key={recommendation.id} 
              className={`p-5 border-l-4 ${getPriorityColor(recommendation.priority)} bg-white shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg relative`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    {recommendation.title}
                  </h3>
                  
                  <div className="flex items-center text-sm mt-1 space-x-4">
                    {/* Priority indicator */}
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">Priority:</span>
                      <span className="flex items-center font-medium capitalize">
                        {getPriorityIcon(recommendation.priority)}
                        {recommendation.priority}
                      </span>
                    </div>
                    
                    {/* Category tag */}
                    <div className="flex items-center">
                      <Tag className="h-3 w-3 mr-1 text-blue-500" />
                      <span className="text-gray-600 capitalize">{recommendation.type}</span>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">Status:</span>
                      <span className={`font-medium capitalize ${recommendation.status === 'implemented' ? 'text-green-600' : 'text-blue-600'}`}>
                        {recommendation.status}
                      </span>
                    </div>
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
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 bg-gray-50 shadow-sm rounded-lg text-center">
            <p className="text-gray-500 mb-4">No recommendations available yet.</p>
            <a
              href="/energy-audit"
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 inline-block"
            >
              Complete an Energy Audit
            </a>
          </div>
        )}

        {/* Note about showing limited recommendations */}
        {sortedRecommendations.length > 3 && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500 mb-2">
              Showing 3 of {sortedRecommendations.length} recommendations
            </p>
          </div>
        )}

        {/* View all button that links to interactive report */}
        {recommendations.length > 0 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleViewFullDetails}
              disabled={!auditId}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                auditId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
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

export default EnhancedDashboardRecommendations;
