// Mock API endpoints for admin analytics when real database tables don't exist

export const getMockFeatures = () => [
  {
    feature_name: 'energy-audit/calculator',
    component: 'energy-audit',
    usage_count: 135,
    usage_trend: 0.12
  },
  {
    feature_name: 'recommendations/view',
    component: 'recommendations',
    usage_count: 120,
    usage_trend: 0.05
  },
  {
    feature_name: 'comparisons/chart',
    component: 'comparisons',
    usage_count: 95,
    usage_trend: -0.03
  },
  {
    feature_name: 'dashboard/summary',
    component: 'dashboard',
    usage_count: 85,
    usage_trend: 0.08
  },
  {
    feature_name: 'energy-consumption/tracking',
    component: 'energy-consumption',
    usage_count: 78,
    usage_trend: 0.15
  }
];

export const getMockPages = () => [
  {
    page_path: '/dashboard',
    area: 'dashboard',
    title: 'User Dashboard',
    visit_count: 210,
    avg_time_spent: 240
  },
  {
    page_path: '/energy-audit',
    area: 'energy-audit',
    title: 'Energy Audit Calculator',
    visit_count: 180,
    avg_time_spent: 350
  },
  {
    page_path: '/recommendations',
    area: 'recommendations',
    title: 'Personalized Recommendations',
    visit_count: 165,
    avg_time_spent: 200
  },
  {
    page_path: '/comparisons',
    area: 'comparisons',
    title: 'Energy Usage Comparisons',
    visit_count: 120,
    avg_time_spent: 180
  },
  {
    page_path: '/products',
    area: 'products',
    title: 'Energy-Efficient Products',
    visit_count: 110,
    avg_time_spent: 150
  }
];

export const getMockCorrelations = (minScore: number = 0.3) => [
  {
    feature1: 'energy-audit/calculator',
    feature2: 'recommendations/view',
    correlation_score: 0.85,
    confidence: 0.9
  },
  {
    feature1: 'recommendations/view',
    feature2: 'products/browse',
    correlation_score: 0.72,
    confidence: 0.8
  },
  {
    feature1: 'dashboard/summary',
    feature2: 'energy-consumption/tracking',
    correlation_score: 0.68,
    confidence: 0.7
  },
  {
    feature1: 'comparisons/chart',
    feature2: 'energy-audit/calculator',
    correlation_score: 0.55,
    confidence: 0.6
  },
  {
    feature1: 'dashboard/summary',
    feature2: 'comparisons/chart',
    correlation_score: 0.42,
    confidence: 0.5
  }
].filter(item => item.correlation_score >= minScore);
