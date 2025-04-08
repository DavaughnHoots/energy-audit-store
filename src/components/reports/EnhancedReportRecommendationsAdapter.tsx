import React from 'react';
import UnifiedRecommendations from '../recommendations/UnifiedRecommendations';
import { AuditRecommendation, RecommendationPriority, RecommendationStatus } from '../../types/energyAudit';
import { RecommendationDataSource } from '../recommendations/types';

interface EnhancedReportRecommendationsAdapterProps {
  recommendations: AuditRecommendation[];
  userCategories?: string[];
  budgetConstraint?: number;
  onUpdateStatus?: (
    recommendationId: string, 
    status: RecommendationStatus, 
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
  isLoading?: boolean;
  dataSource?: RecommendationDataSource;
}

/**
 * Adapter component for the Reports section
 * This replaces the existing EnhancedReportRecommendations component
 * with our new unified component in interactive mode
 */
const EnhancedReportRecommendationsAdapter: React.FC<EnhancedReportRecommendationsAdapterProps> = ({
  recommendations,
  userCategories = [],
  budgetConstraint,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateImplementationDetails,
  isLoading = false,
  dataSource = 'detailed' as RecommendationDataSource
}) => {
  return (
    <UnifiedRecommendations
      recommendations={recommendations}
      userCategories={userCategories}
      budgetConstraint={budgetConstraint}
      displayMode="interactive"
      showProductSuggestions={true}
      onUpdateStatus={onUpdateStatus}
      onUpdatePriority={onUpdatePriority}
      onUpdateImplementationDetails={onUpdateImplementationDetails}
      isLoading={isLoading}
      dataSource={dataSource}
    />
  );
};

export default EnhancedReportRecommendationsAdapter;
