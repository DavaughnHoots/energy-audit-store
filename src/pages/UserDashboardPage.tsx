import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getApiUrl } from '@/config/api';
import { fetchWithAuth } from '@/utils/authUtils';
import { useLocalStorage } from '@/utils/authUtils';
import { AlertCircle, Download, Loader2, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import ReportsTab from '@/components/dashboard/ReportsTab';
import { fetchAuditHistory, fetchReportData } from '@/services/reportService';
import { AuditRecommendation } from '@/types/energyAudit';
import {
  enrichRecommendationWithDefaultValues,
  enrichChartDataWithDefaultValues
} from '@/utils/defaultFinancialValues';
import { mergeDashboardData, didOverwriteRecommendations } from '@/utils/dashboardDataMerge';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';

import { badgeService } from '../services/BadgeService';
import useAuth from '@/context/AuthContext';

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
  
  // New fields for enhanced features
  energyAnalysis?: {
    energyBreakdown: ChartDataPoint[];
    consumption: ChartDataPoint[];
    savingsAnalysis: SavingsChartDataPoint[];
  };
  enhancedRecommendations?: AuditRecommendation[];
  productPreferences?: {
    categories: string[];
    budgetConstraint?: number;
  };
}

// Chart data point interfaces
interface ChartDataPoint {
  name: string;
  value: number;
}

interface SavingsChartDataPoint {
  name: string;
  estimatedSavings: number;
  actualSavings: number;
}

const UserDashboardPage: React.FC = () => {
  // Add page tracking
  usePageTracking('dashboard');
  
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
  // Using a fixed set of valid tabs to prevent selection of removed tabs
  const validTabs = ['overview', 'reports'];
  const [activeTab, setActiveTab] = useState(validTabs[0]);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh
  const [effectiveAuditId, setEffectiveAuditId] = useState<string | null>(null);
  const [usingFallbackAudit, setUsingFallbackAudit] = useState(false);

  /**
   * Reference to track if we're already fetching data to prevent duplicate requests
   */
  const isLoadingRef = useRef(false);

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
      
      // Update stats using the new data merge utility to preserve recommendations
      setStats(prevStats => {
        // Check if we would be overwriting valid recommendation data with empty data
        if (didOverwriteRecommendations(prevStats, data)) {
          console.log('WARNING: Dashboard stats would overwrite existing recommendations - preserving previous data');
        }
        
        // Merge the new data with existing data, preserving valuable information
        const mergedData = mergeDashboardData(prevStats, data);
        
        // Update persisted storage with merged data
        setPersistentStats(mergedData);
        
        return mergedData;
      });
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
  // Effect to evaluate badges based on dashboard stats
  useEffect(() => {
    if (isAuthenticated && stats && !isLoading) {
      const evaluateBadgesFromStats = async () => {
        try {
          // Get user ID from auth context
          const { user } = useAuth();
          if (!user?.id) return;
          
          console.log('Evaluating badges from dashboard stats...');
          
          // Trigger evaluation for audit count
          if (stats.completedAudits && stats.completedAudits > 0) {
            await badgeService.recordActivity(user.id, 'audits_count_check', {
              count: stats.completedAudits,
              timestamp: new Date().toISOString()
            });
            console.log('Evaluated badge status for audit count:', stats.completedAudits);
          }
        } catch (error) {
          // Don't let badge evaluation errors affect dashboard operation
          console.error('Error evaluating badges from dashboard stats:', error);
        }
      };
      
      evaluateBadgesFromStats();
    }
  }, [isAuthenticated, stats, isLoading]);


  /**
   * Function to fetch dashboard data for a specific audit ID using the report API
   * for consistent data between dashboard and interactive report
   */
  const fetchAuditSpecificData = useCallback(async (auditId: string) => {
    // Prevent duplicate requests if already loading
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    try {
      console.log('Fetching audit-specific data using report API for audit:', auditId);
      
      // Use the report data API instead of dashboard API
      const reportData = await fetchReportData(auditId);
      
      console.log('Report data fetched successfully', {
        hasCharts: !!reportData.charts,
        hasRecommendations: !!reportData.recommendations?.length,
        energyBreakdownCount: reportData.charts?.energyBreakdown?.length || 0,
        recommendationsCount: reportData.recommendations?.length || 0
      });
      
      // Enhanced debugging to see exact data format in API response
      if (reportData.recommendations && reportData.recommendations.length > 0) {
        const firstRec = reportData.recommendations[0];
        console.log('RECOMMENDATION FULL DATA STRUCTURE:', JSON.stringify(firstRec, null, 2));
        
        // Log a comprehensive breakdown of all financial fields and their types
        console.log('RECOMMENDATION FINANCIAL DEBUG:', {
          title: firstRec?.title || 'Unknown',
          fieldNames: firstRec ? Object.keys(firstRec as unknown as Record<string, unknown>) : [],
          // Log details about value types and formats
          valueTypes: {
            estimatedSavings: {
              value: firstRec?.estimatedSavings,
              type: typeof firstRec?.estimatedSavings,
              hasSlash: typeof firstRec?.estimatedSavings === 'string' ? (firstRec.estimatedSavings as string).includes('/') : false,
              hasDollarSign: typeof firstRec?.estimatedSavings === 'string' ? (firstRec.estimatedSavings as string).includes('$') : false
            },
            annualSavings: {
              value: (firstRec as any)?.annualSavings,
              type: typeof (firstRec as any)?.annualSavings
            },
            savingsPerYear: {
              value: (firstRec as any)?.savingsPerYear,
              type: typeof (firstRec as any)?.savingsPerYear
            },
            implementationCost: {
              value: firstRec?.implementationCost,
              type: typeof firstRec?.implementationCost
            },
            cost: {
              value: (firstRec as any)?.cost,
              type: typeof (firstRec as any)?.cost
            },
            paybackPeriod: {
              value: firstRec?.paybackPeriod,
              type: typeof firstRec?.paybackPeriod
            }
          }
        });
      }
      
      // Also log chart data structure
      if (reportData.charts?.savingsAnalysis && reportData.charts.savingsAnalysis.length > 0) {
        console.log('CHART DATA STRUCTURE:', {
          firstItem: reportData.charts.savingsAnalysis[0],
          allItems: reportData.charts.savingsAnalysis
        });
      }
      
      // Transform report data to dashboard format with improved financial value extraction
      setStats(prevStats => {
        // Helper function to extract numeric value from various formats
        const extractNumericValue = (value: any): number => {
          if (typeof value === 'number') return value;
          if (!value) return 0;
          
          // Handle string values that may include currency symbols or units
          if (typeof value === 'string') {
            // Remove currency symbols, commas, and any text after a slash (like '/year')
            const cleanedValue = value
              .replace(/[$,]/g, '')                // Remove $ and commas
              .replace(/\/.*$/, '')                // Remove anything after a slash
              .replace(/[^\d.-]/g, '')             // Remove any non-numeric chars except decimal points
              .trim();
            
            const parsedValue = parseFloat(cleanedValue);
            return isNaN(parsedValue) ? 0 : parsedValue;
          }
          
          return 0;
        };
        
        // Process recommendations with default financial values when actual values are missing or zero
        const enhancedRecommendations = reportData.recommendations?.map(rec => {
          // First extract any numeric values from string representations
          const parsedRec = {
            ...rec,
            estimatedSavings: extractNumericValue(rec.estimatedSavings),
            actualSavings: extractNumericValue(rec.actualSavings),
            estimatedCost: extractNumericValue(rec.estimatedCost),
            implementationCost: extractNumericValue(rec.implementationCost),
            paybackPeriod: extractNumericValue(rec.paybackPeriod)
          };
          
          // Then enrich with default values when zero or missing
          const enrichedRec = enrichRecommendationWithDefaultValues(parsedRec);
          
          // Log transformation for debugging
          console.log(`Financial data mapping for "${rec.title || 'Unknown'}":`, {
            before: {
              estimatedSavings: rec.estimatedSavings,
              actualSavings: rec.actualSavings,
              estimatedCost: rec.estimatedCost,
              implementationCost: rec.implementationCost
            },
            after: {
              estimatedSavings: enrichedRec.estimatedSavings,
              actualSavings: enrichedRec.actualSavings,
              estimatedCost: enrichedRec.estimatedCost,
              implementationCost: enrichedRec.implementationCost
            }
          });
          
          return enrichedRec;
        }) || [];
        
        // Process chart data with default financial values when actual values are missing or zero
        const processedSavingsAnalysis = (reportData.charts?.savingsAnalysis || []).map(item => {
          // First extract any numeric values from string formats
          const parsedItem = {
            ...item,
            estimatedSavings: extractNumericValue(item.estimatedSavings),
            actualSavings: extractNumericValue(item.actualSavings)
          };
          
          // Then enrich with default values based on item name
          return enrichChartDataWithDefaultValues(parsedItem);
        });
        
        console.log('PROCESSED CHART DATA:', {
          before: reportData.charts?.savingsAnalysis?.[0] || 'No chart data',
          after: processedSavingsAnalysis[0] || 'No processed chart data'
        });
        
        const dashboardData = {
          ...prevStats,
          // Use processed chart data with proper financial values
          energyAnalysis: {
            energyBreakdown: reportData.charts?.energyBreakdown || [],
            consumption: reportData.charts?.consumption || [],
            savingsAnalysis: processedSavingsAnalysis
          },
          // Use our enhanced recommendations with proper financial mapping
          enhancedRecommendations,
          // Update metadata
          dataSummary: {
            hasDetailedData: true,
            isUsingDefaultData: false,
            dataSource: 'detailed',
            auditId: auditId
          },
          // Add last updated timestamp
          lastUpdated: new Date().toISOString(),
          // Keep the audit ID reference
          latestAuditId: auditId,
          specificAuditId: auditId
        };
        
        // Also update persisted stats
        setPersistentStats(dashboardData);
        
        return dashboardData;
      });
      
    } catch (err) {
      console.error('Error fetching report data for dashboard:', err);
      // Fall back to the original dashboard API on error
      try {
        console.log('Falling back to dashboard API for audit:', auditId);
        const response = await fetchWithAuth(
          getApiUrl(API_ENDPOINTS.DASHBOARD.AUDIT_STATS(auditId))
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fallback to dashboard API successful');
          // Use functional update with data merge to preserve important data
          setStats(prevStats => {
            // Check if we would be overwriting valid recommendation data with empty data
            if (didOverwriteRecommendations(prevStats, data)) {
              console.log('WARNING: Fallback API would overwrite existing recommendations - preserving previous data');
            }
            
            // Merge the new data with existing data, preserving valuable information
            const mergedData = mergeDashboardData(prevStats, data);
            
            // Update persisted storage with merged data
            setPersistentStats(mergedData);
            
            return mergedData;
          });
        } else {
          console.error('Fallback API request failed with status:', response.status);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      // Reset loading state
      isLoadingRef.current = false;
    }
  }, []);  // Note: Removed stats from dependency array to prevent infinite loop

  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;

    const refresh = () => {
      fetchDashboardData().then(interval => {
        if (interval) {
          refreshTimeout = setTimeout(refresh, interval);
        
    await badgeService.evaluateBadges();
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
            
            // Fetch dashboard data specific to this audit
            fetchAuditSpecificData(firstAuditId);
          }
        })
        .catch(err => {
          console.error('Error fetching fallback audit ID:', err);
        });
    }
  }, [stats.latestAuditId, effectiveAuditId, fetchAuditSpecificData]);
  
  // When refreshKey changes, also refresh the audit-specific data if we're using a fallback
  useEffect(() => {
    if (usingFallbackAudit && effectiveAuditId) {
      fetchAuditSpecificData(effectiveAuditId);
    }
  }, [refreshKey, usingFallbackAudit, effectiveAuditId, fetchAuditSpecificData]);
  

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
        
        {/* Tab Navigation - Streamlined */}
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
        
        {/* Tab Content - Streamlined */}
        {activeTab === 'overview' && (
          <DashboardOverview 
            stats={stats} 
            isLoading={isLoading} 
            error={error} 
            onRefresh={() => setRefreshKey(prev => prev + 1)} 
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