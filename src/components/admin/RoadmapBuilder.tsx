import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
}

const CardContent: React.FC<CardContentProps> = ({ children }) => (
  <div className="p-4">{children}</div>
);

interface TypographyProps {
  variant?: string;
  component?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const Typography: React.FC<TypographyProps> = ({ variant, component, children, className = '', ...props }) => {
  let baseClasses = '';
  if (variant === 'h6') baseClasses = 'text-lg font-medium';
  else if (variant === 'h5') baseClasses = 'text-xl font-bold';
  else if (variant === 'body2') baseClasses = 'text-sm text-gray-600';
  else if (variant === 'subtitle2') baseClasses = 'text-sm font-medium';
  
  const Component = component || 'div';
  return <Component className={`${baseClasses} ${className}`} {...props}>{children}</Component>;
};

interface BoxProps {
  children: React.ReactNode;
  sx?: Record<string, any>;
  className?: string;
  [key: string]: any;
}

const Box: React.FC<BoxProps> = ({ children, sx = {}, className = '', ...props }) => {
  // Convert some basic sx props to tailwind classes
  let twClasses = '';
  if (sx.display === 'flex') twClasses += ' flex';
  if (sx.justifyContent === 'center') twClasses += ' justify-center';
  if (sx.alignItems === 'center') twClasses += ' items-center';
  if (sx.flexWrap === 'wrap') twClasses += ' flex-wrap';
  if (sx.gap === 1) twClasses += ' gap-2';
  if (sx.mb === 2) twClasses += ' mb-4';
  if (sx.mb === 3) twClasses += ' mb-6';
  if (sx.mt === 0.5) twClasses += ' mt-1';
  if (sx.ml === 2) twClasses += ' ml-4';
  if (sx.mr === 0.5) twClasses += ' mr-1';
  if (sx.mr === 1) twClasses += ' mr-2';
  if (sx.width === '100%') twClasses += ' w-full';
  if (sx.height === '50vh') twClasses += ' h-[50vh]';
  if (sx.height === '100%') twClasses += ' h-full';
  
  return (
    <div className={`${twClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

interface ButtonProps {
  variant?: string;
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const Button: React.FC<ButtonProps> = ({ 
  variant, 
  color, 
  onClick, 
  disabled, 
  startIcon, 
  children, 
  className = '', 
  ...props 
}) => {
  let btnClass = 'px-4 py-2 rounded text-sm font-medium transition-colors ';
  
  if (variant === 'outlined' && color === 'primary') {
    btnClass += 'border border-blue-500 text-blue-500 hover:bg-blue-50 ';
  }
  
  if (disabled) {
    btnClass += 'opacity-50 cursor-not-allowed ';
  }
  
  return (
    <button 
      className={`${btnClass} ${className}`} 
      onClick={disabled ? undefined : onClick} 
      disabled={disabled}
      {...props}
    >
      {startIcon && <span className="inline-block mr-2">{startIcon}</span>}
      {children}
    </button>
  );
};

interface GridProps {
  container?: boolean;
  item?: boolean;
  spacing?: number;
  xs?: number;
  md?: number;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const Grid: React.FC<GridProps> = ({ 
  container, 
  item, 
  spacing, 
  xs, 
  md, 
  children, 
  className = '', 
  ...props 
}) => {
  let gridClass = '';
  
  if (container) {
    gridClass += 'grid gap-4 ';
    if (spacing === 3) gridClass += 'gap-6 ';
  }
  
  if (item) {
    if (xs === 12 && md === 6) {
      gridClass += 'col-span-12 md:col-span-6 ';
    } else if (xs === 12) {
      gridClass += 'col-span-12 ';
    }
  }
  
  return (
    <div className={`${gridClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CircularProgressProps {
  size?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ size }) => (
  <div className={`animate-spin rounded-full border-t-2 border-blue-500 ${size ? `h-${size/4} w-${size/4}` : 'h-5 w-5'}`}></div>
);

interface ChipProps {
  label: string;
  size?: string;
  color?: string;
  icon?: React.ReactNode;
  variant?: string;
  className?: string;
  [key: string]: any;
}

const Chip: React.FC<ChipProps> = ({ 
  label, 
  size, 
  color, 
  icon, 
  variant, 
  className = '', 
  ...props 
}) => {
  let chipClass = 'inline-flex items-center px-2 py-1 rounded-full text-xs ';
  
  if (variant === 'outlined') {
    chipClass += 'border ';
    chipClass += 'border-gray-300 text-gray-700 ';
  } else {
    if (color === 'success') chipClass += 'bg-green-100 text-green-800 ';
    else if (color === 'warning') chipClass += 'bg-yellow-100 text-yellow-800 ';
    else if (color === 'error') chipClass += 'bg-red-100 text-red-800 ';
    else if (color === 'info') chipClass += 'bg-blue-100 text-blue-800 ';
    else chipClass += 'bg-gray-100 text-gray-800 ';
  }
  
  if (size === 'small') {
    chipClass += 'text-xs ';
  }
  
  return (
    <span className={`${chipClass} ${className}`} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </span>
  );
};

interface AlertProps {
  severity?: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const Alert: React.FC<AlertProps> = ({ severity, children, className = '', ...props }) => {
  let alertClass = 'p-4 mb-4 rounded ';
  
  if (severity === 'error') alertClass += 'bg-red-100 text-red-800 ';
  else if (severity === 'warning') alertClass += 'bg-yellow-100 text-yellow-800 ';
  else if (severity === 'info') alertClass += 'bg-blue-100 text-blue-800 ';
  else if (severity === 'success') alertClass += 'bg-green-100 text-green-800 ';
  
  return (
    <div className={`${alertClass} ${className}`} role="alert" {...props}>
      {children}
    </div>
  );
};

// Simple icon placeholders
const TrendingUpIcon = () => <span>📈</span>;
const TrafficIcon = () => <span>🚦</span>;
const BuildIcon = () => <span>🔧</span>;
const EmojiEventsIcon = () => <span>🏆</span>;
const FormatListBulletedIcon = () => <span>📋</span>;

interface Feature {
  feature_name: string;
  component: string;
  usage_count: number;
  usage_trend: number;
}

interface Page {
  page_path: string;
  area: string;
  title: string;
  visit_count: number;
  avg_time_spent: number;
}

interface FeatureCorrelation {
  feature1: string;
  feature2: string;
  correlation_score: number;
  confidence: number;
}

interface RoadmapSuggestion {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  features: string[];
  pages: string[];
  priority: number;
}

const RoadmapBuilder: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topFeatures, setTopFeatures] = useState<Feature[]>([]);
  const [topPages, setTopPages] = useState<Page[]>([]);
  const [correlations, setCorrelations] = useState<FeatureCorrelation[]>([]);
  const [suggestions, setSuggestions] = useState<RoadmapSuggestion[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Function to generate roadmap suggestions based on analytics data
  const generateSuggestions = (
    features: Feature[], 
    pages: Page[], 
    correlations: FeatureCorrelation[]
  ): RoadmapSuggestion[] => {
    const newSuggestions: RoadmapSuggestion[] = [];
    
    // Find features with high usage but potentially disconnected user flow
    const highUsageFeatures = features.filter(f => f.usage_count > 50);
    
    // Find popular pages with high visit counts
    const popularPages = pages.filter(p => p.visit_count > 100);
    
    // Find strong feature correlations
    const strongCorrelations = correlations.filter(c => c.correlation_score > 0.7);
    
    // Suggestion 1: Improve connection between top features
    if (strongCorrelations.length > 0) {
      const topCorrelation = strongCorrelations[0];
      newSuggestions.push({
        title: `Enhance Integration Between ${topCorrelation.feature1} and ${topCorrelation.feature2}`,
        description: `Users frequently use these features together (${Math.round(topCorrelation.correlation_score * 100)}% correlation). Streamline the workflow between them to create a more unified experience.`,
        impact: 'high',
        effort: 'medium',
        features: [topCorrelation.feature1, topCorrelation.feature2],
        pages: [],
        priority: 90
      });
    }
    
    // Suggestion 2: Create a dashboard for most used features
    if (highUsageFeatures.length >= 3) {
      const top3Features = highUsageFeatures.slice(0, 3);
      newSuggestions.push({
        title: 'Create a Quick Access Dashboard',
        description: `Combine the most-used features (${top3Features.map(f => f.feature_name).join(', ')}) into a unified dashboard for easier access.`,
        impact: 'high',
        effort: 'medium',
        features: top3Features.map(f => f.feature_name),
        pages: [],
        priority: 80
      });
    }
    
    // Suggestion 3: Optimize high-traffic pages
    if (popularPages.length > 0) {
      const topPage = popularPages[0];
      newSuggestions.push({
        title: `Optimize ${topPage.title || topPage.page_path} Page`,
        description: `This is your most visited page with ${topPage.visit_count} views. Consider improving load time, adding more features, or enhancing the user experience.`,
        impact: 'high',
        effort: 'medium',
        features: [],
        pages: [topPage.page_path],
        priority: 85
      });
    }
    
    // Suggestion 4: Connect popular features that aren't strongly correlated
    if (highUsageFeatures.length >= 2) {
      const feature1 = highUsageFeatures[0];
      const feature2 = highUsageFeatures[1];
      
      // Check if these two features don't already have a strong correlation
      const existingCorrelation = correlations.find(
        c => (c.feature1 === feature1.feature_name && c.feature2 === feature2.feature_name) ||
             (c.feature1 === feature2.feature_name && c.feature2 === feature1.feature_name)
      );
      
      if (!existingCorrelation || existingCorrelation.correlation_score < 0.5) {
        newSuggestions.push({
          title: `Connect ${feature1.feature_name} with ${feature2.feature_name}`,
          description: `These are two of your most popular features, but users don't often use them together. Creating a stronger connection could enhance the user journey.`,
          impact: 'medium',
          effort: 'medium',
          features: [feature1.feature_name, feature2.feature_name],
          pages: [],
          priority: 70
        });
      }
    }
    
    // Suggestion 5: Improve features with declining usage
    const decliningFeatures = features.filter(f => f.usage_trend < 0).sort((a, b) => a.usage_trend - b.usage_trend);
    if (decliningFeatures.length > 0) {
      const worstTrend = decliningFeatures[0];
      newSuggestions.push({
        title: `Revitalize ${worstTrend.feature_name}`,
        description: `This feature is showing declining usage. Consider redesigning it, improving visibility, or adding new capabilities.`,
        impact: 'medium',
        effort: 'high',
        features: [worstTrend.feature_name],
        pages: [],
        priority: 65
      });
    }
    
    // Suggestion 6: Look at pages with high traffic but low time spent
    const quickExitPages = pages.filter(p => p.visit_count > 50 && p.avg_time_spent < 30)
      .sort((a, b) => a.avg_time_spent - b.avg_time_spent);
    
    if (quickExitPages.length > 0) {
      const quickestExit = quickExitPages[0];
      newSuggestions.push({
        title: `Improve Engagement on ${quickestExit.title || quickestExit.page_path}`,
        description: `This page gets significant traffic (${quickestExit.visit_count} visits) but users only spend an average of ${Math.round(quickestExit.avg_time_spent)} seconds there. Add more engaging content or improve the user experience.`,
        impact: 'medium',
        effort: 'medium',
        features: [],
        pages: [quickestExit.page_path],
        priority: 75
      });
    }
    
    // Sort suggestions by priority
    return newSuggestions.sort((a, b) => b.priority - a.priority);
  };
  
  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load top features
      const featuresResponse = await apiClient.get('/api/admin/analytics/most-used-features');
      setTopFeatures(featuresResponse.data as Feature[]);
      
      // Load top pages
      const pagesResponse = await apiClient.get('/api/admin/analytics/most-visited');
      setTopPages(pagesResponse.data as Page[]);
      
      // Load feature correlations
      const correlationsResponse = await apiClient.get('/api/admin/analytics/feature-correlations', {
        params: { minScore: 0.3 }
      });
      setCorrelations(correlationsResponse.data as FeatureCorrelation[]);
      
      // Generate suggestions
      const newSuggestions = generateSuggestions(
        featuresResponse.data as Feature[],
        pagesResponse.data as Page[],
        correlationsResponse.data as FeatureCorrelation[]
      );
      
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      await apiClient.post('/api/admin/analytics/refresh');
      await loadAnalyticsData();
    } catch (err) {
      console.error('Error refreshing analytics data:', err);
      setError('Failed to refresh analytics data. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    loadAnalyticsData();
  }, []);
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };
  
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading roadmap suggestions...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          <BuildIcon />
          <span className="ml-2">Website Roadmap Suggestions</span>
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleRefreshData}
          disabled={refreshing}
          startIcon={refreshing ? <CircularProgress size={20} /> : <TrendingUpIcon />}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Analytics Data'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}
      
      {suggestions.length === 0 ? (
        <Alert severity="info">
          Not enough analytics data to generate roadmap suggestions yet. Continue collecting user data or refresh analytics.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {suggestions.map((suggestion, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card className="h-full">
                <CardContent>
                  <Typography variant="h6" component="h3" className="mb-2">
                    {suggestion.title}
                  </Typography>
                  
                  <Typography variant="body2" className="mb-4">
                    {suggestion.description}
                  </Typography>
                  
                  <Box className="flex gap-2 mb-4">
                    <Chip 
                      label={`Impact: ${suggestion.impact}`} 
                      size="small" 
                      color={getImpactColor(suggestion.impact)} 
                      icon={<EmojiEventsIcon />} 
                    />
                    <Chip 
                      label={`Effort: ${suggestion.effort}`} 
                      size="small" 
                      color={getEffortColor(suggestion.effort)} 
                      icon={<BuildIcon />} 
                    />
                  </Box>
                  
                  {suggestion.features.length > 0 && (
                    <>
                      <Typography variant="subtitle2" className="flex items-center">
                        <FormatListBulletedIcon />
                        <span className="ml-1">Related Features:</span>
                      </Typography>
                      <Box className="flex flex-wrap gap-1 mt-1 mb-2">
                        {suggestion.features.map((feature, i) => (
                          <Chip 
                            key={i} 
                            label={feature} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </>
                  )}
                  
                  {suggestion.pages.length > 0 && (
                    <>
                      <Typography variant="subtitle2" className="flex items-center">
                        <TrafficIcon />
                        <span className="ml-1">Related Pages:</span>
                      </Typography>
                      <Box className="flex flex-wrap gap-1 mt-1">
                        {suggestion.pages.map((page, i) => (
                          <Chip 
                            key={i} 
                            label={page} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RoadmapBuilder;