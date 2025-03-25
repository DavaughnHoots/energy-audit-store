import React from 'react';
import { AuditRecommendation, RecommendationStatus } from '../../types/energyAudit';

interface RecommendationsProps {
  recommendations: AuditRecommendation[];
  onUpdateStatus?: (
    recommendationId: string,
    status: 'active' | 'implemented',
    actualSavings?: number
  ) => Promise<void>;
}

const ReportRecommendations: React.FC<RecommendationsProps> = ({ 
  recommendations,
  onUpdateStatus
}) => {
  const [editingSavingsId, setEditingSavingsId] = React.useState<string | null>(null);
  const [actualSavings, setActualSavings] = React.useState<string>('');

  // Sort recommendations by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  const handleStatusChange = async (recommendation: AuditRecommendation, status: 'active' | 'implemented') => {
    if (!onUpdateStatus) return;
    
    try {
      // If we're setting to implemented and there's actual savings data, use it
      if (status === 'implemented' && recommendation.id === editingSavingsId && actualSavings) {
        const savingsValue = parseFloat(actualSavings);
        if (!isNaN(savingsValue)) {
          await onUpdateStatus(recommendation.id, status, savingsValue);
          setEditingSavingsId(null);
          setActualSavings('');
          return;
        }
      }
      
      // Otherwise just update the status
      await onUpdateStatus(recommendation.id, status);
    } catch (error) {
      console.error('Error updating recommendation status:', error);
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

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Recommendations</h2>
      
      <div className="space-y-4">
        {sortedRecommendations.map((recommendation) => (
          <div 
            key={recommendation.id} 
            className={`p-4 border-l-4 ${getPriorityColor(recommendation.priority)} bg-white shadow rounded-lg`}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">{recommendation.title}</h3>
              <div className="flex items-center space-x-2">
                {onUpdateStatus && (
                  <>
                    <span className="text-sm text-gray-500">Status:</span>
                    <select
                      className="text-sm border-gray-300 rounded-md"
                      value={recommendation.status}
                      onChange={(e) => handleStatusChange(recommendation, e.target.value as 'active' | 'implemented')}
                    >
                      <option value="active">Active</option>
                      <option value="implemented">Implemented</option>
                    </select>
                  </>
                )}
              </div>
            </div>
            
            <p className="mt-2 text-gray-600">{recommendation.description}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 block">Estimated Savings:</span>
                <span className="font-medium">{formatCurrency(recommendation.estimatedSavings)}/year</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block">Implementation Cost:</span>
                <span className="font-medium">{formatCurrency(recommendation.estimatedCost)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block">Payback Period:</span>
                <span className="font-medium">
                  {recommendation.paybackPeriod ? `${recommendation.paybackPeriod.toFixed(1)} years` : 'N/A'}
                </span>
              </div>
              
              {recommendation.status === 'implemented' ? (
                <div>
                  <span className="text-sm text-gray-500 block">Actual Savings:</span>
                  {recommendation.id === editingSavingsId ? (
                    <div className="flex items-center">
                      <span className="mr-1">$</span>
                      <input
                        type="text"
                        className="w-24 border-gray-300 rounded-md text-sm"
                        value={actualSavings}
                        onChange={(e) => setActualSavings(e.target.value)}
                        placeholder="0"
                      />
                      <button
                        className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
                        onClick={() => handleStatusChange(recommendation, 'implemented')}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="font-medium">
                        {recommendation.actualSavings ? formatCurrency(recommendation.actualSavings) + '/year' : 'Not reported'}
                      </span>
                      {onUpdateStatus && (
                        <button
                          className="ml-2 text-xs text-blue-500"
                          onClick={() => {
                            setEditingSavingsId(recommendation.id);
                            setActualSavings(recommendation.actualSavings?.toString() || '');
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
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
