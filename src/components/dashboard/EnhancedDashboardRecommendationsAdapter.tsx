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

  // IMPROVED DASHBOARD FALLBACK: Extract likely user categories from recommendation types
  const deriveCategoriesFromRecommendations = (recs: AuditRecommendation[]): string[] => {
    // Extract unique recommendation types
    const recommendationTypes = [...new Set(recs.map(rec => rec.type))];
    
    // Map common recommendation types to product categories
    const categoryMapping: Record<string, string> = {
      'hvac': 'hvac',
      'lighting': 'lighting',
      'insulation': 'insulation',
      'windows': 'windows',
      'appliances': 'appliances',
      'water_heating': 'water_heating',
      'renewable': 'renewable',
      'smart_home': 'smart_home',
      // Add more mappings as needed
    };
    
    // Create list of likely categories based on recommendation types
    const likelyCategories = recommendationTypes
      .map(type => categoryMapping[type] || type)
      .filter(Boolean);
      
    console.log('DASHBOARD DEBUG: Derived categories from recommendations:', likelyCategories);
    
    // If we couldn't derive any categories, return the default full set
    if (likelyCategories.length === 0) {
      return ['hvac', 'lighting', 'insulation', 'windows', 'appliances', 'water_heating', 'renewable', 'smart_home'];
    }
    
    return likelyCategories;
  };
  
  // Apply special dashboard-specific logic to ensure we always show recommendations
  useEffect(() => {
    // Log all recommendation types for debugging
    console.log('DASHBOARD DEBUG: Available recommendation types:', 
      recommendations.map(rec => ({ type: rec.type, title: rec.title }))
    );
    
    // HANDLE CASE 1: If we have recommendations but no user categories, derive categories from recommendations
    const effectiveCategories = (userCategories && userCategories.length > 0)
      ? userCategories
      : deriveCategoriesFromRecommendations(recommendations);
      
    console.log('DASHBOARD DEBUG: Using effective categories:', effectiveCategories);
    
    // HANDLE CASE 2: No recommendations received from API
    if (recommendations.length === 0) {
      console.log('DASHBOARD DEBUG: No recommendations available');
      setDashboardRecommendations([]);
      setUsingFallback(false);
      return;
    }

    // HANDLE CASE 3: Try filtering with effective categories
    if (effectiveCategories.length > 0) {
      console.log('DASHBOARD DEBUG: Filtering with categories:', effectiveCategories);
      
      const filtered = filterRecommendationsByUserPreferences(recommendations, effectiveCategories);
      
      if (filtered.length > 0) {
        console.log('DASHBOARD DEBUG: Found matching recommendations:', filtered.length);
        setDashboardRecommendations(filtered);
        setUsingFallback(false);
        return;
      }
      
      console.log('DASHBOARD DEBUG: No matches found with standard filtering, using fallbacks');
    }

    // HANDLE CASE 4: Fallback when no matches found or categories couldn't be derived
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
