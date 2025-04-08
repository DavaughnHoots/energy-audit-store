import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getApiUrl } from '../../config/api';

// Types for the granular analytics data
interface GranularAnalyticsData {
  granularFeatures: Array<{
    baseComponent: string;
    features: Array<{
      feature: string;
      usageCount: number;
    }>;
    totalUsage: number;
  }>;
  lastUpdated: string;
}

interface GranularAnalyticsProps {
  startDate: string;
  endDate: string;
}

const GranularAnalytics: React.FC<GranularAnalyticsProps> = ({ startDate, endDate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<GranularAnalyticsData | null>(null);
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({});

  // Fetch granular analytics data
  const fetchGranularAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the new granular-analytics endpoint with date range parameters
      const response = await fetch(
        getApiUrl(`/api/direct-admin/granular-analytics?startDate=${startDate}&endDate=${endDate}`),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch granular analytics data: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);

      // Initialize expanded state for all components
      const expanded: Record<string, boolean> = {};
      data.granularFeatures.forEach((group) => {
        expanded[group.baseComponent] = true; // Start with all expanded
      });
      setExpandedComponents(expanded);
    } catch (err) {
      console.error('Error fetching granular analytics data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when date range changes
  useEffect(() => {
    fetchGranularAnalytics();
  }, [startDate, endDate]);

  // Toggle component expansion
  const toggleComponent = (componentName: string) => {
    setExpandedComponents((prev) => ({
      ...prev,
      [componentName]: !prev[componentName],
    }));
  };

  // Get color class based on the feature type
  const getFeatureColor = (feature: string): string => {
    if (feature.includes('_Navigation')) return 'border-l-4 border-blue-500';
    if (feature.includes('_Validation')) return 'border-l-4 border-red-500';
    if (feature.includes('_Submission')) return 'border-l-4 border-green-500';
    if (feature.includes('_Search')) return 'border-l-4 border-purple-500';
    if (feature.includes('_Filter')) return 'border-l-4 border-yellow-500';
    if (feature.includes('_Pagination')) return 'border-l-4 border-indigo-500';
    if (feature.includes('_Card')) return 'border-l-4 border-pink-500';
    return 'border-l-4 border-gray-500';
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Granular Analytics Tracking</CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : analytics && analytics.granularFeatures.length > 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              This section shows detailed feature-specific analytics tracking using the new naming convention.
              For example: "EnergyAuditForm_Navigation" instead of just "EnergyAuditForm".
            </p>

            {/* Component Groups */}
            {analytics.granularFeatures.map((group) => (
              <div key={group.baseComponent} className="mb-6">
                {/* Component Header (always visible) */}
                <div 
                  className="flex justify-between items-center p-3 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200"
                  onClick={() => toggleComponent(group.baseComponent)}
                >
                  <div className="flex items-center">
                    <span className={expandedComponents[group.baseComponent] ? "transform rotate-90" : ""}>▶</span>
                    <span className="font-semibold ml-2">{group.baseComponent}</span>
                  </div>
                  <span className="text-gray-600">Total: {group.totalUsage}</span>
                </div>

                {/* Expandable Features List */}
                {expandedComponents[group.baseComponent] && (
                  <div className="pl-6 mt-2">
                    {group.features.map((feature, idx) => (
                      <div key={idx} className={`p-2 my-1 ${getFeatureColor(feature.feature)}`}>
                        <div className="flex justify-between">
                          <span className="text-sm">{feature.feature}</span>
                          <span className="text-sm font-medium">{feature.usageCount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (feature.usageCount / group.totalUsage) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Legend */}
            <div className="mt-6 p-3 bg-gray-50 rounded-md">
              <h4 className="font-semibold mb-2">Color Legend</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                  <span className="text-sm">Navigation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 mr-2"></div>
                  <span className="text-sm">Validation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 mr-2"></div>
                  <span className="text-sm">Submission</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 mr-2"></div>
                  <span className="text-sm">Search</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 mr-2"></div>
                  <span className="text-sm">Filter</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-indigo-500 mr-2"></div>
                  <span className="text-sm">Pagination</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-pink-500 mr-2"></div>
                  <span className="text-sm">Card Interaction</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-500 mr-2"></div>
                  <span className="text-sm">Other</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No granular analytics data available for this period.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default GranularAnalytics;
