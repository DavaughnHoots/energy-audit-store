import React, { useEffect, useState } from 'react';
import useAuth from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getApiUrl } from '../config/api';
import GranularAnalytics from '../components/analytics/GranularAnalytics';

// Types for the metrics returned from the API
interface AnalyticsDashboardData {
  sessions: {
    total: number;
    avgDurationMinutes: number;
  };
  formCompletions: number;
  pageVisits: Array<{
    path: string;
    title: string;
    area: string;
    visits: number;
    displayName: string;
  }>;
  featureUsage: Array<{
    feature: string;
    usageCount: number;
  }>;
  lastUpdated: string;
}

const AdminDashboardPage: React.FC = () => {
  // Removed analytics tracking for dashboard to prevent excessive events
  
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsDashboardData | null>(null);
  
  // Date range filter state
  const [startDate, setStartDate] = useState<string>(
    (() => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return thirtyDaysAgo.toISOString().split('T')[0] || ''; // Format as YYYY-MM-DD with fallback
    })()
  );
  const [endDate, setEndDate] = useState<string>(
    (() => {
      return new Date().toISOString().split('T')[0] || ''; // Format as YYYY-MM-DD with fallback
    })()
  );

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use direct-admin endpoint with date range parameters
      const response = await fetch(
        getApiUrl(`/api/direct-admin/dashboard?startDate=${startDate}&endDate=${endDate}`),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics dashboard data: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching analytics dashboard data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Handle date changes and refresh
  const handleApply = () => {
    fetchDashboardData();
  };
  
  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pilot Study Analytics Dashboard</h1>
        <button
          onClick={() => window.location.href = '/logout'}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Log Out
        </button>
      </div>
      
      {/* Date Range Filter */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <button
                onClick={handleApply}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Apply
              </button>
            </div>
            
            <div>
              <button
                onClick={handleRefresh}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      ) : metrics ? (
        <>
          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-2">Total Sessions</h3>
                <p className="text-4xl font-bold text-green-600 mb-2">{metrics.sessions.total}</p>
                <p className="text-sm text-gray-500">During selected period</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-2">Avg. Session Duration</h3>
                <p className="text-4xl font-bold text-green-600 mb-2">{metrics.sessions.avgDurationMinutes} min</p>
                <p className="text-sm text-gray-500">Time spent per session</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-2">Form Completions</h3>
                <p className="text-4xl font-bold text-green-600 mb-2">{metrics.formCompletions}</p>
                <p className="text-sm text-gray-500">Successfully completed forms</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Data Visualization Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Most Visited Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.pageVisits.length > 0 ? (
                  <div>
                    {metrics.pageVisits.map((page, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span title={`Path: ${page.path}, Area: ${page.area}`} className="truncate max-w-[70%]">
                            {page.displayName}
                          </span>
                          <span>{page.visits}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, (page.visits / Math.max(...metrics.pageVisits.map(p => p.visits))) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No page visit data available for this period.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Most Used Features</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.featureUsage.length > 0 ? (
                  <div>
                    {metrics.featureUsage.map((feature, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span>{feature.feature}</span>
                          <span>{feature.usageCount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, (feature.usageCount / Math.max(...metrics.featureUsage.map(f => f.usageCount))) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No feature usage data available for this period.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Last Updated */}
          <div className="text-sm text-gray-500 mb-8">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </div>
          
          {/* Debugging Tools */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4">Debugging Tools</h2>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Analytics Tools</h3>
              <button 
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
                onClick={() => window.location.href = '/admin/analytics/debug'}
              >
                Analytics Debug
              </button>
            </div>

          {/* Granular Analytics Section */}
          <GranularAnalytics startDate={startDate} endDate={endDate} />
        </div>
        
        {/* Pilot Study Survey Responses Section */}
        <div className="border-t pt-6 mt-8">
          <h2 className="text-xl font-bold mb-4">Pilot Study Survey Responses</h2>
          <p className="text-gray-600 mb-4">
            View and analyze feedback collected from users participating in the pilot study.
          </p>
          
          {/* Importing the survey response list component */}
          <React.Suspense fallback={<div>Loading survey responses...</div>}>
            {React.createElement(React.lazy(() => import('../components/admin/SurveyResponseList')))}
          </React.Suspense>
        </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">No data available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboardPage;
