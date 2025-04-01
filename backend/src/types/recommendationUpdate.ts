export interface RecommendationUpdate {
  id: string;
  recommendationId: string;
  userId: string;
  status?: 'active' | 'implemented';
  priority?: 'high' | 'medium' | 'low';
  actualSavings?: number;
  implementationDate?: string;
  implementationCost?: number;
  updatedAt: string;
}
