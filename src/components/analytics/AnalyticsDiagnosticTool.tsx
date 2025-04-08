import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, getApiUrl } from '@/config/api';
import { fetchWithAuth } from '@/utils/authUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  DatabaseIcon, 
  Terminal, 
  RefreshCw, 
  Table, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  X,
  Code,
  ArrowDown,
  ArrowUp,
  Sparkles
} from 'lucide-react';

interface AnalyticsEvent {
  id: string;
  sessionId: string;
  userId?: string;
  eventType: string;
  area: string;
  data: Record<string, any>;
  timestamp: string;
}

interface PageHook {
  path: string;
  hasPageTracking: boolean;
  hasComponentTracking: boolean;
  hasFormTracking: boolean;
  lastTrackingEvent?: string;
}

interface QueryResult {
  query: string;
  params?: any[];
  executionTime: number;
  rowCount: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Comprehensive analytics diagnostic tool for administrators
 * Provides detailed insights into analytics tracking, event logging, and SQL queries
 */
const AnalyticsDiagnosticTool: React.FC = () => {
  // Event Monitor state
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hook Status state
  const [pageHooks, setPageHooks] = useState<PageHook[]>([]);
  const [hookLoading, setHookLoading] = useState(false);
  const [hookError, setHookError] = useState<string | null>(null);
  const [pathToCheck, setPathToCheck] = useState('');

  // SQL Query state
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [showCustomQuery, setShowCustomQuery] = useState(false);

  // Summary data
  const [summary, setSummary] = useState({
    totalEvents: 0,
    uniqueSessions: 0,
    eventTypes: {},
    successRate: 0,
    failureRate: 0,
    lastUpdated: new Date().toISOString()
  });

  // Fetch recent events
  const fetchRecentEvents = async () => {
    setEventLoading(true);
    setEventError(null);
    
    try {
      const response = await fetchWithAuth(
        getApiUrl(`${API_ENDPOINTS.ADMIN.ANALYTICS_EVENTS}?limit=50`)
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics events: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRecentEvents(data.events || []);
      
      // Update summary data
      if (data.summary) {
        setSummary({
          ...data.summary,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching analytics events:', err);
      setEventError(`Failed to fetch analytics events: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setEventLoading(false);
    }
  };

  // Fetch page hooks status
  const fetchPageHooks = async () => {
    setHookLoading(true);
    setHookError(null);
    
    try {
      const response = await fetchWithAuth(
        getApiUrl(`${API_ENDPOINTS.ADMIN.HOOK_STATUS}`)
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch hook status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPageHooks(data.pages || []);
    } catch (err) {
      console.error('Error fetching hook status:', err);
      setHookError(`Failed to fetch hook status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setHookLoading(false);
    }
  };

  // Fetch query history
  const fetchQueryHistory = async () => {
    setQueryLoading(true);
    setQueryError(null);
    
    try {
      const response = await fetchWithAuth(
        getApiUrl(`${API_ENDPOINTS.ADMIN.QUERY_HISTORY}`)
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch query history: ${response.statusText}`);
      }
      
      const data = await response.json();
      setQueryHistory(data.queries || []);
    } catch (err) {
      console.error('Error fetching query history:', err);
      setQueryError(`Failed to fetch query history: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setQueryLoading(false);
    }
  };

  // Execute custom query
  const executeCustomQuery = async () => {
    setQueryLoading(true);
    setQueryError(null);
    
    try {
      const response = await fetchWithAuth(
        getApiUrl(`${API_ENDPOINTS.ADMIN.EXECUTE_QUERY}`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: customQuery })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to execute query: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add result to history
      setQueryHistory(prev => [data.result, ...prev]);
      
      // Clear the custom query
      setCustomQuery('');
    } catch (err) {
      console.error('Error executing custom query:', err);
      setQueryError(`Failed to execute query: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setQueryLoading(false);
    }
  };

  // Check path hooks
  const checkPathHooks = async () => {
    if (!pathToCheck) return;
    
    setHookLoading(true);
    setHookError(null);
    
    try {
      const response = await fetchWithAuth(
        getApiUrl(`${API_ENDPOINTS.ADMIN.CHECK_PATH_HOOKS}?path=${encodeURIComponent(pathToCheck)}`)
      );
      
      if (!response.ok) {
        throw new Error(`Failed to check path hooks: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Replace the page in the list or add it if it doesn't exist
      setPageHooks(prev => {
        const newPages = [...prev];
        const index = newPages.findIndex(p => p.path === data.page.path);
        
        if (index >= 0) {
          newPages[index] = data.page;
        } else {
          newPages.unshift(data.page);
        }
        
        return newPages;
      });
      
      // Clear the path
      setPathToCheck('');
    } catch (err) {
      console.error('Error checking path hooks:', err);
      setHookError(`Failed to check path hooks: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setHookLoading(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchRecentEvents();
      }, 5000); // Refresh every 5 seconds
    } else if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh]);

  // Initial data fetching
  useEffect(() => {
    fetchRecentEvents();
    fetchPageHooks();
    fetchQueryHistory();
  }, []);

  // Filter events based on search
  const filteredEvents = recentEvents.filter(event => {
    if (!eventFilter) return true;
    
    const filter = eventFilter.toLowerCase();
    return (
      event.eventType.toLowerCase().includes(filter) ||
      event.area.toLowerCase().includes(filter) ||
      event.sessionId.toLowerCase().includes(filter) ||
      (event.userId && event.userId.toLowerCase().includes(filter)) ||
      JSON.stringify(event.data).toLowerCase().includes(filter)
    );
  });

  // Format JSON for display
  const formatJson = (json: any) => {
    return JSON.stringify(json, null, 2);
  };

  // Export events to JSON
  const exportEvents = () => {
    const dataStr = JSON.stringify(recentEvents, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `analytics-events-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Analytics Diagnostic Tools</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalEvents}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.uniqueSessions}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.successRate}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{new Date(summary.lastUpdated).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="events">
        <TabsList className="mb-4">
          <TabsTrigger value="events">
            <DatabaseIcon className="h-4 w-4 mr-2" />
            Event Monitor
          </TabsTrigger>
          <TabsTrigger value="hooks">
            <Code className="h-4 w-4 mr-2" />
            Hook Status
          </TabsTrigger>
          <TabsTrigger value="queries">
            <Terminal className="h-4 w-4 mr-2" />
            Query Analyzer
          </TabsTrigger>
        </TabsList>
        
        {/* Event Monitor Tab */}
        <TabsContent value="events">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Filter events..."
                    className="pl-9"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={fetchRecentEvents}
                  disabled={eventLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${eventLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto-refresh"
                    checked={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="auto-refresh" className="text-sm">Auto-refresh</label>
                </div>
                <Button 
                  variant="outline" 
                  onClick={exportEvents}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {eventError && (
              <Alert variant="destructive">
                <AlertDescription>{eventError}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Area
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventLoading && filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                          </div>
                        </td>
                      </tr>
                    ) : filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No events found
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {event.eventType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.area}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="truncate block max-w-[100px]" title={event.sessionId}>
                              {event.sessionId}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <details>
                              <summary className="cursor-pointer">View data</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                {formatJson(event.data)}
                              </pre>
                            </details>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Hook Status Tab */}
        <TabsContent value="hooks">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex-grow relative">
                <Input
                  type="text"
                  placeholder="Enter route path to check (e.g., /community)"
                  value={pathToCheck}
                  onChange={(e) => setPathToCheck(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkPathHooks()}
                />
              </div>
              <Button 
                onClick={checkPathHooks}
                disabled={hookLoading || !pathToCheck}
              >
                Check Path
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchPageHooks}
                disabled={hookLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${hookLoading ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
            </div>
            
            {hookError && (
              <Alert variant="destructive">
                <AlertDescription>{hookError}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Path
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page Tracking
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Component Tracking
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Form Tracking
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Event
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hookLoading && pageHooks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                          </div>
                        </td>
                      </tr>
                    ) : pageHooks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No page hooks found
                        </td>
                      </tr>
                    ) : (
                      pageHooks.map((page, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {page.path}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {page.hasPageTracking ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {page.hasComponentTracking ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {page.hasFormTracking ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {page.lastTrackingEvent ? (
                              new Date(page.lastTrackingEvent).toLocaleString()
                            ) : (
                              'Never'
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Query Analyzer Tab */}
        <TabsContent value="queries">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setShowCustomQuery(!showCustomQuery)}
              >
                {showCustomQuery ? 'Hide Custom Query' : 'Show Custom Query'}
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchQueryHistory}
                disabled={queryLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${queryLoading ? 'animate-spin' : ''}`} />
                Refresh History
              </Button>
            </div>
            
            {showCustomQuery && (
              <div className="bg-white rounded-lg shadow p-4 space-y-2">
                <textarea
                  className="w-full h-32 p-2 border border-gray-300 rounded"
                  placeholder="Enter SQL query..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={executeCustomQuery}
                    disabled={queryLoading || !customQuery}
                  >
                    {queryLoading ? 'Executing...' : 'Execute Query'}
                  </Button>
                </div>
              </div>
            )}
            
            {queryError && (
              <Alert variant="destructive">
                <AlertDescription>{queryError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Query History</h3>
              
              {queryLoading && queryHistory.length === 0 ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : queryHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No query history found</p>
              ) : (
                queryHistory.map((result, index) => (
                  <Card key={index} className={result.success ? '' : 'border-red-300'}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Terminal className="h-4 w-4 mr-2" />
                          Query {index + 1}
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
                          )}
                        </CardTitle>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <CardDescription className="text-xs mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Execution time: {result.executionTime}ms
                        <Database className="h-3 w-3 ml-3 mr-1" />
                        Rows: {result.rowCount}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-100 rounded p-2 overflow-auto text-xs font-mono">
                        <pre>{result.query}</pre>
                      </div>
                      
                      {result.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          {result.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Clock component used in the Query Analyzer
const Clock: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
};

// Database component used in the Query Analyzer
const Database: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
};

export default AnalyticsDiagnosticTool;
