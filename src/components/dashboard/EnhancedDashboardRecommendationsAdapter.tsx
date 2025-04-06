import React, { useEffect, useState } from 'react';
import UnifiedRecommendations from '../recommendations/UnifiedRecommendations';
import { AuditRecommendation } from '../../types/energyAudit';
import { RecommendationDataSource } from '../recommendations/types';
import { filterRecommendationsByUserPreferences } from '../../services/productRecommendationService';

interface EnhancedDashboardRecommendationsAdapterProps {
  recommendations?: AuditRecommendation[];
  userCategories?: string[];
  budgetConstraint?: number;
  auditId?: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  isDefaultData?: boolean;
  dataSource?: RecommendationDataSource;
}

/**
 * Adapter component for the Dashboard
 * This replaces the existing EnhancedDashboardRecommendations component
 * with our new unified component in compact mode
 * 
 * Enhanced with additional dashboard-specific fallback logic to ensure
 * recommendations always appear on the dashboard
 */
const EnhancedDashboardRecommendationsAdapter: React.FC<EnhancedDashboardRecommendationsAdapterProps> = ({
  recommendations = [],
  userCategories = [],
  budgetConstraint,
  auditId,
  isLoading = false,
  onRefresh,
  isDefaultData = false,
  dataSource = 'detailed' as RecommendationDataSource
}) => {
  // Add verbose logging to track what's happening in the dashboard context
  console.log('DASHBOARD RECOMMENDATIONS DEBUG:', {
    recommendationsCount: recommendations.length,
    userCategories,
    budgetConstraint,
    auditId,
    isDefaultData,
    dataSource
  });

  // Additional state to track dashboard-specific filtering
  const [dashboardRecommendations, setDashboardRecommendations] = useState<AuditRecommendation[]>(recommendations);
  const [usingFallback, setUsingFallback] = useState(false);

  // Apply special dashboard-specific logic to ensure we always show recommendations
  useEffect(() => {
    // If no recommendations or user categories are empty, show all recommendations
    if (recommendations.length === 0) {
      console.log('DASHBOARD DEBUG: No recommendations available');
      setDashboardRecommendations([]);
      setUsingFallback(false);
      return;
    }

    // Log all recommendation types for debugging
    console.log('DASHBOARD DEBUG: Available recommendation types:', 
      recommendations.map(rec => ({ type: rec.type, title: rec.title }))
    );

    // First try using the standard filtering logic
    if (userCategories && userCategories.length > 0) {
      console.log('DASHBOARD DEBUG: Filtering with user categories:', userCategories);
      
      const filtered = filterRecommendationsByUserPreferences(recommendations, userCategories);
      
      if (filtered.length > 0) {
        console.log('DASHBOARD DEBUG: Found matching recommendations:', filtered.length);
        setDashboardRecommendations(filtered);
        setUsingFallback(false);
        return;
      }
      
      console.log('DASHBOARD DEBUG: No matches found with standard filtering, using fallbacks');
    }

    // We only reach here if no recommendations matched or no categories were provided
    // DASHBOARD-SPECIFIC FALLBACK: Always show at least 3 recommendations on dashboard
    console.log('DASHBOARD DEBUG: Using fallback to show default recommendations');
    
    // Sort by priority to show most important recommendations
    const sortedRecommendations = [...recommendations].sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });
    
    // Take top recommendations (max 3)
    const fallbackRecs = sortedRecommendations.slice(0, 3);
    console.log('DASHBOARD DEBUG: Fallback recommendations:', 
      fallbackRecs.map(rec => ({ type: rec.type, title: rec.title }))
    );
    
    setDashboardRecommendations(fallbackRecs);
    setUsingFallback(true);
  }, [recommendations, userCategories]);

  // If no recommendations at all, just render unified component which handles empty state
  if (dashboardRecommendations.length === 0 && recommendations.length === 0) {
    return (
      <UnifiedRecommendations
        recommendations={[]}
        userCategories={userCategories}
        budgetConstraint={budgetConstraint}
        displayMode="compact"
        maxRecommendations={3}
        showProductSuggestions={false}
        auditId={auditId}
        isLoading={isLoading}
        onRefresh={onRefresh}
        isDefaultData={isDefaultData}
        dataSource={dataSource}
      />
    );
  }

  // Render with our dashboard-specific recommendations
  return (
    <>
      {usingFallback && (
        <div className="p-2 mb-4 text-sm text-gray-600 bg-gray-50 rounded-md border border-gray-200">
          Showing general recommendations for your property.
        </div>
      )}
      <UnifiedRecommendations
        recommendations={dashboardRecommendations}
        userCategories={usingFallback ? [] : userCategories} /* Don't filter again if using fallback */
        budgetConstraint={budgetConstraint}
        displayMode="compact"
        maxRecommendations={3}
        showProductSuggestions={false}
        auditId={auditId}
        isLoading={isLoading}
        onRefresh={onRefresh}
        isDefaultData={isDefaultData || usingFallback}
        dataSource={usingFallback ? 'generated' : dataSource}
      />
    </>
  );
};

export default EnhancedDashboardRecommendationsAdapter;
