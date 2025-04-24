import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getApiUrl } from '../../config/api';

// Types for the navigation analytics data
interface NavigationJourney {
  sequence: string[];
  frequency: number;
  conversionRate: number;
}

interface NavigationFlow {
  fromPage: string;
  toPage: string;
  total_transitions: number;
  date_range_start: string;
  date_range_end: string;
}

interface FeatureCorrelation {
  feature1: string;
  feature2: string;
  correlation_score: number;
  confidence: number;
}

interface SessionTimelineData {
  page: string;
  session_position: number;
  percentage_of_sessions: number;
  bounce_rate: number;
}

interface MostVisitedArea {
  area: string;
  page_path: string;
  title: string;
  visit_count: number;
  avg_time_spent: number;
}

interface MostUsedFeature {
  feature_name: string;
  component: string;
  usage_count: number;
  usage_trend: number;
}

interface NavigationAnalyticsData {
  navigationFlows: NavigationFlow[];
  userJourneys: NavigationJourney[];
  featureCorrelations: FeatureCorrelation[];
  sessionTimeline: SessionTimelineData[];
  mostVisitedAreas: MostVisitedArea[];
  mostUsedFeatures: MostUsedFeature[];
  lastUpdated: string;
}

interface NavigationAnalyticsProps {
  startDate: string;
  endDate: string;
}

const NavigationAnalytics: React.FC<NavigationAnalyticsProps> = ({ startDate, endDate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<NavigationAnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('most-visited');

  // Fetch navigation analytics data
  const fetchNavigationAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parallel requests for different endpoint data
      const [flowsResponse, journeysResponse, correlationsResponse, timelineResponse, visitedResponse, featuresResponse] = await Promise.all([
        fetch(getApiUrl(`/api/admin/analytics/navigation-flows?startDate=${startDate}&endDate=${endDate}`), {
          credentials: 'include',
        }),
        fetch(getApiUrl(`/api/admin/analytics/user-journeys`), {
          credentials: 'include',
        }),
        fetch(getApiUrl(`/api/admin/analytics/feature-correlations?minScore=0.3`), {
          credentials: 'include',
        }),
        fetch(getApiUrl(`/api/admin/analytics/session-timeline`), {
          credentials: 'include',
        }),
        fetch(getApiUrl(`/api/admin/analytics/most-visited`), {
          credentials: 'include',
        }),
        fetch(getApiUrl(`/api/admin/analytics/most-used-features`), {
          credentials: 'include',
        }),
      ]);

      // Check if any response failed
      if (!flowsResponse.ok || !journeysResponse.ok || !correlationsResponse.ok || 
          !timelineResponse.ok || !visitedResponse.ok || !featuresResponse.ok) {
        throw new Error(`Failed to fetch navigation analytics data: ${flowsResponse.statusText}`);
      }

      // Parse all responses
      const [flowsData, journeysData, correlationsData, timelineData, visitedData, featuresData] = await Promise.all([
        flowsResponse.json(),
        journeysResponse.json(),
        correlationsResponse.json(),
        timelineResponse.json(),
        visitedResponse.json(),
        featuresResponse.json(),
      ]);

      // Combine data into a single object
      setAnalytics({
        navigationFlows: flowsData.data || [],
        userJourneys: journeysData.data || [],
        featureCorrelations: correlationsData.data || [],
        sessionTimeline: timelineData.data || [],
        mostVisitedAreas: visitedData.data || [],
        mostUsedFeatures: featuresData.data || [],
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error fetching navigation analytics data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when date range changes
  useEffect(() => {
    fetchNavigationAnalytics();
  }, [startDate, endDate]);

  // Refresh data manually
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      // Trigger refresh on the server side
      await fetch(getApiUrl('/api/admin/analytics/refresh'), {
        method: 'POST',
        credentials: 'include',
      });
      
      // Wait a bit for the refresh to complete
      setTimeout(() => {
        fetchNavigationAnalytics();
      }, 1000);
    } catch (err) {
      console.error('Error refreshing navigation data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during refresh');
      setIsLoading(false);
    }
  };

  // Render tab navigation
  const renderTabNavigation = () => {
    const tabs = [
      { id: 'most-visited', label: 'Most Visited Pages' },
      { id: 'most-used', label: 'Most Used Features' },
      { id: 'user-journeys', label: 'User Journeys' },
      { id: 'correlations', label: 'Feature Correlations' },
      { id: 'flows', label: 'Navigation Flows' },
      { id: 'timeline', label: 'Session Timeline' },
    ];

    return (
      <div className="flex flex-wrap space-x-1 border-b mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={handleRefresh}
          className="ml-auto px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    );
  };

  // Render most visited pages
  const renderMostVisitedPages = () => {
    if (!analytics || !analytics.mostVisitedAreas.length) {
      return <p className="text-gray-500">No most visited page data available.</p>;
    }

    const maxVisits = Math.max(...analytics.mostVisitedAreas.map(area => area.visit_count));

    return (
      <div>
        <p className="text-sm text-gray-500 mb-4">
          These are the most visited pages on the site. Use this to understand which areas to prioritize in your website roadmap.
        </p>
        {analytics.mostVisitedAreas.map((area, index) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between mb-1">
              <div className="flex-1">
                <span className="font-medium">{area.title || area.page_path}</span>
                <span className="text-xs text-gray-500 ml-2">{area.area}</span>
              </div>
              <div className="flex space-x-4">
                <span className="text-sm font-medium">{area.visit_count} visits</span>
                <span className="text-sm text-gray-600">{area.avg_time_spent.toFixed(1)} sec avg</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (area.visit_count / maxVisits) * 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render most used features
  const renderMostUsedFeatures = () => {
    if (!analytics || !analytics.mostUsedFeatures.length) {
      return <p className="text-gray-500">No most used feature data available.</p>;
    }

    const maxUsage = Math.max(...analytics.mostUsedFeatures.map(feature => feature.usage_count));

    return (
      <div>
        <p className="text-sm text-gray-500 mb-4">
          These are the most used features on the site. This can guide feature development priorities in your roadmap.
        </p>
        {analytics.mostUsedFeatures.map((feature, index) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between mb-1">
              <div className="flex-1">
                <span className="font-medium">{feature.feature_name}</span>
                <span className="text-xs text-gray-500 ml-2">{feature.component}</span>
              </div>
              <div className="flex space-x-4">
                <span className="text-sm font-medium">{feature.usage_count} uses</span>
                <span className={`text-sm ${feature.usage_trend > 0 ? 'text-green-600' : feature.usage_trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {feature.usage_trend > 0 ? '+' : ''}{feature.usage_trend}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (feature.usage_count / maxUsage) * 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render user journeys
  const renderUserJourneys = () => {
    if (!analytics || !analytics.userJourneys.length) {
      return <p className="text-gray-500">No user journey data available.</p>;
    }

    return (
      <div>
        <p className="text-sm text-gray-500 mb-4">
          These are common user journey sequences through the site. Understanding these patterns can help you optimize the user flow.
        </p>
        <div className="grid grid-cols-1 gap-4">
          {analytics.userJourneys.map((journey, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-sm">Frequency: {journey.frequency}</span>
                <span className="text-sm text-green-600">Conversion Rate: {(journey.conversionRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex flex-wrap items-center">
                {journey.sequence.map((step, i) => (
                  <React.Fragment key={i}>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded my-1">{step}</span>
                    {i < journey.sequence.length - 1 && <span className="text-gray-400 mx-1">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render feature correlations
  const renderFeatureCorrelations = () => {
    if (!analytics || !analytics.featureCorrelations.length) {
      return <p className="text-gray-500">No feature correlation data available.</p>;
    }

    return (
      <div>
        <p className="text-sm text-gray-500 mb-4">
          This shows which features are commonly used together. High correlation suggests these features could be more tightly integrated in your roadmap.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {analytics.featureCorrelations.map((correlation, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Correlation Score: {correlation.correlation_score.toFixed(2)}</span>
                <span className="text-sm">
                  Confidence: 
                  <span className={`ml-1 ${correlation.confidence > 0.7 ? 'text-green-600' : correlation.confidence > 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {(correlation.confidence * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">{correlation.feature1}</span>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded">{correlation.feature2}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render navigation flows
  const renderNavigationFlows = () => {
    if (!analytics || !analytics.navigationFlows.length) {
      return <p className="text-gray-500">No navigation flow data available.</p>;
    }

    const maxTransitions = Math.max(...analytics.navigationFlows.map(flow => flow.total_transitions));

    return (
      <div>
        <p className="text-sm text-gray-500 mb-4">
          This shows common navigation patterns between pages. Strong flows indicate important pathways to maintain in your site structure.
        </p>
        <div className="space-y-3">
          {analytics.navigationFlows.map((flow, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Transitions: {flow.total_transitions}</span>
                <span className="text-xs text-gray-500">
                  {new Date(flow.date_range_start).toLocaleDateString()} - {new Date(flow.date_range_end).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-2">
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm truncate max-w-[40%]">{flow.fromPage}</span>
                <div className="w-24 h-2 bg-blue-200 relative">
                  <div 
                    className="absolute top-0 h-2 bg-blue-600" 
                    style={{ width: `${Math.min(100, (flow.total_transitions / maxTransitions) * 100)}%` }}
                  ></div>
                </div>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm truncate max-w-[40%]">{flow.toPage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render session timeline
  const renderSessionTimeline = () => {
    if (!analytics || !analytics.sessionTimeline.length) {
      return <p className="text-gray-500">No session timeline data available.</p>;
    }

    return (
      <div>
        <p className="text-sm text-gray-500 mb-4">
          This shows which pages appear at different points in user sessions. Understanding this sequence helps optimize the user journey in your roadmap.
        </p>
        <div className="border rounded-lg bg-white shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Position</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Sessions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bounce Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.sessionTimeline.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.session_position}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.page}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(item.percentage_of_sessions * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(item.bounce_rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Select the appropriate content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'most-visited':
        return renderMostVisitedPages();
      case 'most-used':
        return renderMostUsedFeatures();
      case 'user-journeys':
        return renderUserJourneys();
      case 'correlations':
        return renderFeatureCorrelations();
      case 'flows':
        return renderNavigationFlows();
      case 'timeline':
        return renderSessionTimeline();
      default:
        return renderMostVisitedPages();
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-xl">Navigation Analytics & Website Roadmap</CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading && (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading analytics data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
                <p className="text-sm text-red-500 mt-2">Try refreshing the data or contact the administrator.</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && analytics && (
          <>
            {renderTabNavigation()}
            <div className="mt-6">
              {renderTabContent()}
            </div>
            <div className="text-xs text-gray-500 mt-6 text-right">
              Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
            </div>
          </>
        )}

        {!isLoading && !error && !analytics && (
          <div className="text-center p-12">
            <p className="text-gray-500">No analytics data available.</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Load Data
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NavigationAnalytics;