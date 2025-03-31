import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getApiUrl } from '@/config/api';
import { fetchWithAuth } from '@/utils/authUtils';
import { useLocalStorage } from '@/utils/authUtils';
import { AlertCircle, Download, Loader2, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import RecommendationsTab from '@/components/dashboard/RecommendationsTab';
import ProductComparisons from '@/components/dashboard/ProductComparisons';
import ReportsTab from '@/components/dashboard/ReportsTab';
import { fetchAuditHistory } from '@/services/reportService';

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
  // Use localStorage to persist dashboard stats
  const [persistedStats, setPersistentStats] = useLocalStorage<DashboardStats>('dashboard-stats', {
    totalSavings: { estimated: 0, actual: 0, accuracy: 0 },
    completedAudits: 0,
    activeRecommendations: 0,
    implementedChanges: 0,
    monthlySavings: [],
    latestAuditId: null,
    recommendations: []
  });
  
  const [stats, setStats] = useState<DashboardStats>(persistedStats);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh
  const [effectiveAuditId, setEffectiveAuditId] = useState<string | null>(null);
  const [usingFallbackAudit, setUsingFallbackAudit] = useState(false);

  const fetchDashboardData = useCallback(async (): Promise<number | undefined> => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const auditIdFromUrl = urlParams.get('newAudit');
      
      // Use the new fetchWithAuth utility for better error handling and automatic retry
      const response = await fetchWithAuth(
        getApiUrl(`${API_ENDPOINTS.DASHBOARD.STATS}${auditIdFromUrl ? `?newAudit=${auditIdFromUrl}` : ''}`)
      );

      // Check for non-OK response
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.code === 'SETUP_REQUIRED') {
          throw new Error('SETUP_REQUIRED');
        }
        throw new Error(data.error || `Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();

      console.log('Dashboard data received:', {
        hasLatestAuditId: !!data.latestAuditId,
        latestAuditId: data.latestAuditId,
        newAuditFromUrl: auditIdFromUrl,
        completedAudits: data.completedAudits,
        requestUrl: `${API_ENDPOINTS.DASHBOARD.STATS}${auditIdFromUrl ? `?newAudit=${auditIdFromUrl}` : ''}`
      });
      
      // Fix for 'null' string values for latestAuditId
      if (data.latestAuditId === 'null' || data.latestAuditId === 'undefined') {
        console.log('Fixing invalid latestAuditId value:', data.latestAuditId);
        data.latestAuditId = null;
      }
      
      // Update both stats and persisted stats
      setStats(data);
      setPersistentStats(data);
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

  // Fetch first audit from history if no latestAuditId is available
  useEffect(() => {
    // Only attempt to fetch a fallback if no valid audit ID exists yet
    if ((!stats.latestAuditId || 
         stats.latestAuditId === 'null' || 
         stats.latestAuditId === 'undefined') && 
        !effectiveAuditId) {
      
      console.log('No valid audit ID found, attempting to fetch from history');
      
      // Fetch just the first audit from history
      fetchAuditHistory(1, 1)
        .then(data => {
          if (data.audits?.length > 0 && data.audits[0]?.id) {
            const firstAuditId = data.audits[0].id;
            console.log('Setting effective audit ID from history:', firstAuditId);
            
            // Store the effective ID
            setEffectiveAuditId(firstAuditId);
            
            // Also update the stats object so all child components receive it
            setStats(prevStats => ({
              ...prevStats,
              latestAuditId: firstAuditId
            }));
            
            // Indicate we're using a fallback for notification
            setUsingFallbackAudit(true);
          }
        })
        .catch(err => {
          console.error('Error fetching fallback audit ID:', err);
        });
    }
  }, [stats.latestAuditId, effectiveAuditId]);
  

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <div className="flex flex-col gap-4">
            <p className="text-sm sm:text-base text-gray-600">
              Track your energy savings and efficiency improvements
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-3">
              <Button
                onClick={() => navigate('/settings/property')}
                className="flex items-center justify-center gap-2 text-sm"
                size="sm"
              >
                <Settings className="h-4 w-4" />
                <span>Property Settings</span>
              </Button>
              {stats.lastUpdated && (
                <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
                  Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 -mx-4 sm:mx-0">
          <div className="overflow-x-auto">
            <nav className="-mb-px flex whitespace-nowrap px-4 sm:px-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`${
                activeTab === 'recommendations'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } py-3 px-4 border-b-2 font-medium text-sm`}
            >
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } py-3 px-4 border-b-2 font-medium text-sm`}
            >
              Product Comparisons
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`${
                activeTab === 'reports'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } py-3 px-4 border-b-2 font-medium text-sm`}
            >
              Reports
            </button>
            </nav>
          </div>
        </div>
        
        {/* Notification when using fallback audit */}
        {usingFallbackAudit && (
          <div className="mb-4 text-sm p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-center justify-between">
            <p>Loaded your most recent audit from history.</p>
            <Button
              onClick={() => setRefreshKey(prev => prev + 1)}
              variant="outline"
              size="sm"
              className="ml-4 text-xs flex items-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              <span>Refresh Dashboard</span>
            </Button>
          </div>
        )}
        
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
            auditId={stats.latestAuditId || effectiveAuditId} 
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;
