import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// Component for displaying metrics cards
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
}> = ({ title, value, subtitle }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-medium text-gray-700">{title}</h3>
    <p className="text-3xl font-bold text-green-600 mt-2">{value}</p>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

// Component for charts
const BarChart: React.FC<{
  title: string;
  data: Array<{ label: string; value: number }>;
}> = ({ title, data }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-medium text-gray-700 mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 truncate">{item.label}</span>
            <span className="text-sm font-medium text-gray-700">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${Math.min(100, (item.value / Math.max(...data.map(d => d.value))) * 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [noDataForRange, setNoDataForRange] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Set default dates once component mounts
  useEffect(() => {
    try {
      // Default to 14 days ago for start date
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0] || '';
      setStartDate(twoWeeksAgoStr);
      
      // Default to today for end date
      const todayStr = new Date().toISOString().split('T')[0] || '';
      setEndDate(todayStr);
    } catch (e) {
      console.error('Error setting default dates:', e);
    }
  }, []);
  const navigate = useNavigate();

  // Function to fetch metrics data
  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.ADMIN.ANALYTICS_METRICS}`, 
        {
          params: { startDate, endDate },
          withCredentials: true
        }
      );
      // Check if the metrics return empty results
      const hasData = response.data.metrics && (
        response.data.metrics.totalSessions > 0 ||
        response.data.metrics.formCompletions > 0 ||
        (response.data.metrics.pageViewsByArea && response.data.metrics.pageViewsByArea.length > 0) ||
        (response.data.metrics.featureUsage && response.data.metrics.featureUsage.length > 0)
      );

      if (hasData) {
        setMetrics(response.data.metrics);
        setNoDataForRange(false);
      } else {
        // If no data found for the selected range, show "no data" message but keep previous metrics
        setNoDataForRange(true);
        // Don't update metrics if no data found - this keeps the previous data visible
      }
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      
      if (error.response?.status === 401) {
        // Redirect to login if unauthorized
        navigate('/admin');
      } else {
        setError(error.response?.data?.message || 'Failed to load analytics data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load metrics on mount and when date range changes
  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.ADMIN.LOGOUT}`,
        {},
        { withCredentials: true }
      );
      navigate('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Format page views data for chart
  const pageViewsData = metrics?.pageViewsByArea?.map((item: any) => ({
    label: item.area,
    value: item.count
  })) || [];

  // Format feature usage data for chart
  const featureUsageData = metrics?.featureUsage?.map((item: any) => ({
    label: item.feature,
    value: item.count
  })) || [];

  // Format time to minutes
  const formatTimeInMinutes = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Pilot Study Analytics Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date range selection */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-0 pt-6">
              <button
                onClick={fetchMetrics}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* No data notification */}
        {noDataForRange && !isLoading && (
          <div className="mb-8 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>No data available</strong> for the selected date range. Showing previous data instead. Try a different date range or ensure analytics events are being collected.</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {/* Metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total Sessions"
                value={metrics?.totalSessions || 0}
                subtitle="During selected period"
              />
              <MetricCard
                title="Avg. Session Duration"
                value={metrics?.avgSessionDuration ? formatTimeInMinutes(metrics.avgSessionDuration) : '0 min'}
                subtitle="Time spent per session"
              />
              <MetricCard
                title="Form Completions"
                value={metrics?.formCompletions || 0}
                subtitle="Successfully completed forms"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart title="Most Visited Pages" data={pageViewsData} />
              <BarChart title="Most Used Features" data={featureUsageData} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
