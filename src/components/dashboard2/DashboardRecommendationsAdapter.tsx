import React from 'react';
import UnifiedRecommendations from '../recommendations/UnifiedRecommendations';
import { AuditRecommendation } from '@/types/energyAudit';
import { RecommendationDataSource } from '../recommendations/types';

interface DashboardRecommendationsAdapterProps {
  recommendations: AuditRecommendation[];
  userCategories?: string[];
  budgetConstraint?: number;
  auditId?: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  dataSource?: RecommendationDataSource;
}

/**
 * A dashboard-specific recommendations adapter that provides an
 * interactive display of recommendations with product suggestions
 * similar to the interactive report
 */
const DashboardRecommendationsAdapter: React.FC<DashboardRecommendationsAdapterProps> = ({
  recommendations = [],
  userCategories = [],
  budgetConstraint,
  auditId,
  isLoading = false,
  onRefresh,
  dataSource = 'detailed'
}) => {
  // Filter out recommendations with no implementation cost
  const filteredRecommendations = recommendations.filter(
    rec => ((rec.estimatedCost || 0) > 0 || (rec.implementationCost || 0) > 0)
  );
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Recommended Improvements</h2>
      
      <UnifiedRecommendations
        recommendations={filteredRecommendations}
        userCategories={userCategories}
        budgetConstraint={budgetConstraint}
        displayMode="interactive" // Use interactive mode like the report
        maxRecommendations={5}    // Show more recommendations
        showProductSuggestions={true} // Show product suggestions
        auditId={auditId}
        isLoading={isLoading}
        onRefresh={onRefresh}
        dataSource={dataSource}
      />
    </div>
  );
};

export default DashboardRecommendationsAdapter;
