import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Battery, Calendar, DollarSign, Leaf, AlertCircle, Download, Loader2, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import RecommendationCard from '@/components/audit/RecommendationCard';

interface DashboardStats {
  totalSavings: {
    estimated: number;
    actual: number;
    accuracy: number;
  };
  completedAudits: number;
  activeRecommendations: number;
  implementedChanges: number;
  monthlySavings: {
    month: string;
    estimated: number;
    actual: number;
  }[];
  lastUpdated?: string;
  refreshInterval?: number;
  latestAuditId?: string | null;
  recommendations?: any[];
}

const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSavings: { estimated: 0, actual: 0, accuracy: 0 },
    completedAudits: 0,
    activeRecommendations: 0,
    implementedChanges: 0,
    monthlySavings: [],
    latestAuditId: null,
    recommendations: []
  });

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh

  const fetchDashboardData = useCallback(async (): Promise<number | undefined> => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const auditIdFromUrl = urlParams.get('newAudit');
      
      const response = await fetch(
        `${API_ENDPOINTS.DASHBOARD.STATS}${auditIdFromUrl ? `?newAudit=${auditIdFromUrl}` : ''}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'SETUP_REQUIRED') {
          throw new Error('SETUP_REQUIRED');
        }
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }

      setStats(data);
      setError(null);
      return data.refreshInterval;

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      if (err instanceof Error && err.message === 'SETUP_REQUIRED') {
        setError(
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Property Setup Required</h2>
            <p className="text-gray-600 mb-4">
              Please complete your property details to view your personalized dashboard statistics.
            </p>
            <Button
              onClick={() => navigate('/settings/property')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Complete Property Setup
            </Button>
          </div>
        );
      } else {
        setError(
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h2>
            <p className="text-gray-600 mb-4">
              We encountered an error while loading your dashboard data. Please try again.
            </p>
            <Button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Retry Now
            </Button>
          </div>
        );
      }
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;

    const refresh = () => {
      fetchDashboardData().then(interval => {
        if (interval) {
          refreshTimeout = setTimeout(refresh, interval);
        }
      });
    };

    refresh();

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [fetchDashboardData, refreshKey]);

  const handleDownloadReport = async () => {
    if (!stats || !stats.latestAuditId) return;
    
    setIsGeneratingReport(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.ENERGY_AUDIT}/${stats.latestAuditId}/report`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        }
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `energy-audit-report-${stats?.latestAuditId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Generation Failed</h2>
          <p className="text-gray-600 mb-4">
            We were unable to generate your report. Please try again.
          </p>
          <Button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Retry
          </Button>
        </div>
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    comparison,
  }: { 
    title: string;
    value: number | string;
    icon: any;
    description: string;
    comparison?: { actual: number; estimated: number };
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-green-100">
          <Icon className="h-6 w-6 text-green-600" />
        </div>
        <div className="ml-4 flex-grow">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{description}</p>
          {comparison && typeof comparison.estimated === 'number' && typeof comparison.actual === 'number' && (
            <div className="mt-2 text-sm">
              <span className="text-blue-600">Estimated: ${comparison.estimated.toLocaleString()}</span>
              <span className="mx-2">|</span>
              <span className="text-green-600">Actual: ${comparison.actual.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex justify-between items-center">
            <p className="mt-2 text-gray-600">
              Track your energy savings and efficiency improvements
            </p>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/settings/property')}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Property Settings</span>
              </Button>
              {stats.latestAuditId && (
                <Button
                  onClick={handleDownloadReport}
                  disabled={isGeneratingReport}
                  className="flex items-center space-x-2"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download Report</span>
                    </>
                  )}
                </Button>
              )}
              {stats.lastUpdated && (
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Savings"
            value={`$${stats?.totalSavings?.actual?.toLocaleString() ?? '0'}`}
            icon={DollarSign}
            description="Actual energy cost savings"
            comparison={stats?.totalSavings ? {
              estimated: stats.totalSavings.estimated,
              actual: stats.totalSavings.actual
            } : undefined}
          />
          <StatCard
            title="Energy Audits"
            value={stats.completedAudits}
            icon={Battery}
            description="Completed energy assessments"
          />
          <StatCard
            title="Active Recommendations"
            value={stats.activeRecommendations}
            icon={Leaf}
            description="Pending improvements"
          />
          <StatCard
            title="Implemented Changes"
            value={stats.implementedChanges}
            icon={Calendar}
            description="Completed improvements"
          />
        </div>

        {/* Savings Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Savings Trend</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.monthlySavings}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`$${value}`, 'Savings']}
                  labelFormatter={(label: string) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  name="Estimated Savings"
                  dataKey="estimated"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  name="Actual Savings"
                  dataKey="actual"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: '#22C55E' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
          {stats.recommendations && stats.recommendations.length > 0 ? (
            <div className="space-y-4">
              {stats.recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onUpdate={() => setRefreshKey(prev => prev + 1)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No recommendations available.</p>
              <Button
                asChild
                className="mt-4"
              >
                <a href="/energy-audit">Start New Energy Audit</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
