import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import { AlertCircle, Download, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import RecommendationsTab from '@/components/dashboard/RecommendationsTab';
import ProductComparisons from '@/components/dashboard/ProductComparisons';
import ReportsTab from '@/components/dashboard/ReportsTab';

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
  userId?: string;
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

  const [activeTab, setActiveTab] = useState('overview');
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
            'Authorization': `Bearer ${document.cookie
              .split('; ')
              .find(row => row.startsWith('accessToken='))
              ?.split('=')[1] || ''}`
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

      console.log('Dashboard data received:', {
        hasLatestAuditId: !!data.latestAuditId,
        latestAuditId: data.latestAuditId,
        newAuditFromUrl: auditIdFromUrl,
        completedAudits: data.completedAudits,
        requestUrl: `${API_ENDPOINTS.DASHBOARD.STATS}${auditIdFromUrl ? `?newAudit=${auditIdFromUrl}` : ''}`
      });
      
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
              {stats.lastUpdated && (
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`${
                activeTab === 'recommendations'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Product Comparisons
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`${
                activeTab === 'reports'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Reports
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <DashboardOverview 
            stats={stats} 
            isLoading={isLoading} 
            error={error} 
            onRefresh={() => setRefreshKey(prev => prev + 1)} 
          />
        )}
        
        {activeTab === 'recommendations' && (
          <RecommendationsTab 
            recommendations={stats.recommendations || []} 
            onUpdate={() => setRefreshKey(prev => prev + 1)} 
          />
        )}
        
        {activeTab === 'products' && (
          <ProductComparisons 
            userId={stats.userId || ''} 
            audits={stats.completedAudits} 
          />
        )}
        
        {activeTab === 'reports' && (
          <ReportsTab 
            auditId={stats.latestAuditId || null} 
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;
