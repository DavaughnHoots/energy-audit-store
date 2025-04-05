import React, { useEffect, useState } from 'react';
import useAuth from '../context/AuthContext';
import { usePageTracking } from '../hooks/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getApiUrl } from '../config/api';

// Types for the metrics returned from the API
interface AdminDashboardMetrics {
  activeUsers: number;
  newUsers: number;
  totalAudits: number;
  productEngagement: Record<string, number>;
  averageSavings: number;
  topProducts: Array<{
    id: string;
    views: number;
  }>;
  lastUpdated: string;
}

const AdminDashboardPage: React.FC = () => {
  // Track this page view for analytics
  usePageTracking('dashboard');
  
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use direct-admin endpoint since it bypasses problematic service
        const response = await fetch(
          getApiUrl(`/api/direct-admin/dashboard?timeframe=${timeframe}`),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch admin dashboard data: ${response.statusText}`);
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe]);

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
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Timeframe selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTimeframe('day')}
            className={`px-4 py-2 rounded-md ${
              timeframe === 'day'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 rounded-md ${
              timeframe === 'week'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded-md ${
              timeframe === 'month'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 rounded-md ${
              timeframe === 'year'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            This Year
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.activeUsers}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.newUsers}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Audits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.totalAudits}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Average Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${metrics.averageSavings}</p>
              </CardContent>
            </Card>
          </div>
          
          {metrics.topProducts.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Top Viewed Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 font-medium">Product ID</th>
                        <th className="pb-2 font-medium">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topProducts.map((product) => (
                        <tr key={product.id} className="border-b">
                          <td className="py-3">{product.id}</td>
                          <td className="py-3">{product.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="text-sm text-gray-500 mt-4">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
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
