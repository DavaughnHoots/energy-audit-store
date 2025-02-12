// src/pages/UserDashboardPage.tsx

import React, { useState, useEffect, ReactNode } from 'react';
import useAuth from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Battery, Calendar, DollarSign, Leaf, AlertCircle, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedSavings: number;
  estimatedCost: number;
  paybackPeriod: number;
}

interface DashboardStats {
  totalSavings: number;
  completedAudits: number;
  activeRecommendations: number;
  implementedChanges: number;
  monthlySavings: {
    month: string;
    savings: number;
  }[];
  lastUpdated?: string;
  refreshInterval?: number;
  latestAuditId?: string | null;
  recommendations?: Recommendation[];
}

const UserDashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ReactNode | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSavings: 0,
    completedAudits: 0,
    activeRecommendations: 0,
    implementedChanges: 0,
    monthlySavings: [],
    latestAuditId: null
  });

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { logout } = useAuth();

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
  }, []);

  const fetchDashboardData = async (newAuditId?: string): Promise<number | undefined> => {
    try {
      // If there's a new audit ID in the URL, use that
      const urlParams = new URLSearchParams(window.location.search);
      const auditIdFromUrl = urlParams.get('newAudit');
      
      const response = await fetch(`${API_BASE_URL}/dashboard/stats${auditIdFromUrl ? `?newAudit=${auditIdFromUrl}` : ''}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        switch (data.code) {
          case 'AUTH_REQUIRED':
            console.error('Authentication error:', data.error);
            logout();
            return undefined;

          case 'SETUP_REQUIRED':
            setError(
              <div className="space-y-4">
                <p>{data.details}</p>
                <a
                  href={data.setupUrl}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Complete Setup
                </a>
              </div>
            );
            return undefined;

          case 'SERVICE_UNAVAILABLE':
            setError(
              <div>
                <p>{data.details}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Retrying in {data.retryAfter} seconds...
                </p>
              </div>
            );
            return data.retryAfter * 1000;

          default:
            throw new Error(data.error || 'Failed to fetch dashboard data');
        }
      }

      setStats(data);
      setError(null);
      return data.refreshInterval;

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(
        <div>
          <p>Unable to load dashboard data.</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              fetchDashboardData();
            }}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Retry Now
          </button>
        </div>
      );
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description 
  }: { 
    title: string;
    value: number | string;
    icon: any;
    description: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-green-100">
          <Icon className="h-6 w-6 text-green-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  const handleDownloadReport = async () => {
    if (!stats.latestAuditId) return;
    
    setIsGeneratingReport(true);
    try {
      const response = await fetch(`${API_BASE_URL}/energy-audit/${stats.latestAuditId}/report`, {
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
      a.download = `energy-audit-report-${stats.latestAuditId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
            {stats.latestAuditId && (
              <button
                onClick={handleDownloadReport}
                disabled={isGeneratingReport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </>
                )}
              </button>
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
            value={`$${stats.totalSavings.toLocaleString()}`}
            icon={DollarSign}
            description="Lifetime energy cost savings"
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
                <Line
                  type="monotone"
                  dataKey="savings"
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Recommendations</h2>
          {stats.latestAuditId ? (
            <div className="space-y-4">
              {stats.recommendations && stats.recommendations.length > 0 ? (
                stats.recommendations.map((rec: Recommendation, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{rec.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span className="text-green-600">Estimated Savings: ${rec.estimatedSavings}</span>
                          <span className="text-gray-500">Cost: ${rec.estimatedCost}</span>
                          <span className="text-blue-600">Payback: {rec.paybackPeriod} years</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No recommendations available.</p>
              )}
              <div className="flex justify-center mt-6">
                <a
                  href="/energy-audit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Start New Audit
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No active recommendations at this time.</p>
              <a
                href="/energy-audit"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Start New Energy Audit
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default UserDashboardPage;
