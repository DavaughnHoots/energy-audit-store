import React from 'react';
import { AuditRecommendation } from '@/types/energyAudit';
import { RecommendationDataSource } from '../recommendations/types';
import UnifiedRecommendations from '../recommendations/UnifiedRecommendations';

interface RecommendationsListProps {
  recommendations: AuditRecommendation[];
  userCategories?: string[];
  budgetConstraint?: number;
  auditId?: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  dataSource?: RecommendationDataSource;
}

/**
 * A simplified dashboard recommendations component that directly uses
 * the same component as the reports section but in compact mode
 */
const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations = [],
  userCategories = [],
  budgetConstraint,
  auditId,
  isLoading = false,
  onRefresh,
  dataSource = 'detailed'
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Recommended Improvements</h2>
      
      <UnifiedRecommendations
        recommendations={recommendations}
        userCategories={userCategories}
        budgetConstraint={budgetConstraint}
        displayMode="compact"
        maxRecommendations={3}
        showProductSuggestions={false}
        auditId={auditId}
        isLoading={isLoading}
        onRefresh={onRefresh}
        dataSource={dataSource}
      />
    </div>
  );
};

export default RecommendationsList;
