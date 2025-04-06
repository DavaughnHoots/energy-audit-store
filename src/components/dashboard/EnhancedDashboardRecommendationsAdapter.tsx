import React from 'react';
import UnifiedRecommendations from '../recommendations/UnifiedRecommendations';
import { AuditRecommendation } from '../../types/energyAudit';
import { RecommendationDataSource } from '../recommendations/types';

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
  return (
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
      isDefaultData={isDefaultData}
      dataSource={dataSource}
    />
  );
};

export default EnhancedDashboardRecommendationsAdapter;
