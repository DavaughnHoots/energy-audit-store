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

export const getMockUserJourneys = () => [
  {
    sequence: ['/', '/sign-in', '/dashboard', '/energy-audit', '/recommendations'],
    frequency: 120,
    conversionRate: 0.68
  },
  {
    sequence: ['/', '/dashboard', '/energy-audit', '/comparisons'],
    frequency: 95,
    conversionRate: 0.52
  },
  {
    sequence: ['/', '/sign-up', '/dashboard', '/recommendations', '/products'],
    frequency: 75,
    conversionRate: 0.42
  },
  {
    sequence: ['/dashboard', '/energy-audit', '/recommendations', '/products'],
    frequency: 65,
    conversionRate: 0.38
  },
  {
    sequence: ['/dashboard', '/comparisons', '/recommendations'],
    frequency: 55,
    conversionRate: 0.30
  }
];

export const getMockNavigationFlows = () => [
  {
    fromPage: '/dashboard',
    toPage: '/energy-audit',
    total_transitions: 145,
    date_range_start: '2025-03-30',
    date_range_end: '2025-04-30'
  },
  {
    fromPage: '/energy-audit',
    toPage: '/recommendations',
    total_transitions: 120,
    date_range_start: '2025-03-30',
    date_range_end: '2025-04-30'
  },
  {
    fromPage: '/dashboard',
    toPage: '/recommendations',
    total_transitions: 95,
    date_range_start: '2025-03-30',
    date_range_end: '2025-04-30'
  },
  {
    fromPage: '/recommendations',
    toPage: '/products',
    total_transitions: 85,
    date_range_start: '2025-03-30',
    date_range_end: '2025-04-30'
  },
  {
    fromPage: '/energy-audit',
    toPage: '/comparisons',
    total_transitions: 70,
    date_range_start: '2025-03-30',
    date_range_end: '2025-04-30'
  }
];

export const getMockSessionTimeline = () => [
  {
    page: 'homepage',
    session_position: 1,
    percentage_of_sessions: 95,
    bounce_rate: 0.20
  },
  {
    page: 'login',
    session_position: 2,
    percentage_of_sessions: 65,
    bounce_rate: 0.15
  },
  {
    page: 'dashboard',
    session_position: 3,
    percentage_of_sessions: 55,
    bounce_rate: 0.10
  },
  {
    page: 'energy-audit',
    session_position: 4,
    percentage_of_sessions: 38,
    bounce_rate: 0.12
  },
  {
    page: 'recommendations',
    session_position: 5,
    percentage_of_sessions: 30,
    bounce_rate: 0.18
  },
  {
    page: 'products',
    session_position: 6,
    percentage_of_sessions: 22,
    bounce_rate: 0.25
  }
];

export const getMockUserFlow = () => {
  // Define nodes (pages)
  const nodes = [
    { id: '/', name: 'Homepage', value: 150 },
    { id: '/dashboard', name: 'Dashboard', value: 210 },
    { id: '/energy-audit', name: 'Energy Audit', value: 180 },
    { id: '/recommendations', name: 'Recommendations', value: 165 },
    { id: '/comparisons', name: 'Comparisons', value: 120 },
    { id: '/products', name: 'Products', value: 110 },
    { id: '/sign-in', name: 'Sign In', value: 90 },
    { id: '/sign-up', name: 'Sign Up', value: 70 }
  ];

  // Define links (transitions)
  const links = [
    { source: '/', target: '/sign-in', value: 40 },
    { source: '/', target: '/sign-up', value: 30 },
    { source: '/', target: '/dashboard', value: 50 }, // Direct to dashboard if logged in
    { source: '/sign-in', target: '/dashboard', value: 80 },
    { source: '/sign-up', target: '/dashboard', value: 60 },
    { source: '/dashboard', target: '/energy-audit', value: 70 },
    { source: '/dashboard', target: '/recommendations', value: 65 },
    { source: '/dashboard', target: '/comparisons', value: 40 },
    { source: '/energy-audit', target: '/recommendations', value: 90 },
    { source: '/energy-audit', target: '/comparisons', value: 50 },
    { source: '/recommendations', target: '/products', value: 75 },
    { source: '/recommendations', target: '/comparisons', value: 30 },
    { source: '/comparisons', target: '/dashboard', value: 20 }, // Back to dashboard
    { source: '/products', target: '/recommendations', value: 15 } // Back to recommendations
  ];

  return { nodes, links };
};
