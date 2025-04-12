import React, { useState, useEffect } from "react";
import { badgeService } from '../services/badgeService';
import { BADGES } from '../data/badges';
import { getTokenInfo } from '../services/tokenInfoService';
import { Loader2, RefreshCw, AlertCircle, Check, HelpCircle, ThumbsUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import axios from 'axios';

/**
 * Enhanced Admin Diagnostic page for badge system
 * Provides additional tools for debugging badge issues
 */
const AdminBadgeDiagnosticsPage: React.FC = () => {
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userBadges, setUserBadges] = useState<any>(null);
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [localStorageData, setLocalStorageData] = useState<{[key: string]: string}>({});
  const [userId, setUserId] = useState<string>("");
  
  // Network request diagnostics
  const [networkRequests, setNetworkRequests] = useState<any[]>([]);
  const [cacheDiagnostics, setCacheDiagnostics] = useState<string>("");
  
  // State for badge evaluation and refresh
  const [refreshing, setRefreshing] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  
  // Badge statistics derived from userBadges
  const [badgeStats, setBadgeStats] = useState({
    earned: 0,
    inProgress: 0,
    locked: 0,
    total: 0
  });

  // Load token and badge data
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
    
    const loadDiagnosticData = async () => {
      setLoading(true);
      
      // Get local storage data
      try {
        const storageData: {[key: string]: string} = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            try {
              const value = window.localStorage.getItem(key);
              storageData[key] = value || '';
            } catch (e) {
              storageData[key] = `[Error reading value: ${e}]`;
            }
          }
        }
        setLocalStorageData(storageData);
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }
      
      // Get token info
      try {
        const info = await getTokenInfo();
        setTokenInfo(info);
      } catch (error) {
        console.error('Error fetching token info:', error);
        setTokenError(error instanceof Error ? error.message : String(error));
      }
      
      // Get user badges if we have a user ID
      if (user?.id) {
        await refreshBadges(user.id);
      }
      
      setLoading(false);
    };
    
    loadDiagnosticData();
  }, [user]);
  
  // Refresh badges from the server
  const refreshBadges = async (id: string) => {
    if (!id) {
      setBadgeError("No user ID provided");
      return;
    }
    
    try {
      setRefreshing(true);
      setBadgeError(null);
      
      // First clear any cache that might exist
      badgeService.invalidateUserCache(id);
      
      const badges = await badgeService.getUserBadges(id);
      setUserBadges(badges);
      
      // Calculate badge statistics
      if (badges) {
        const earnedCount = badges ? Object.values(badges).filter((b: any) => b.earned).length : 0;
        const inProgressCount = badges ? Object.values(badges).filter((b: any) => !b.earned && (b.progress || 0) > 0).length : 0;
        const lockedCount = badges ? Object.values(badges).filter((b: any) => !b.earned && (!b.progress || b.progress === 0)).length : 0;
        
        setBadgeStats({
          earned: earnedCount,
          inProgress: inProgressCount,
          locked: lockedCount,
          total: BADGES.length
        });
      } else {
        setBadgeStats({
          earned: 0,
          inProgress: 0,
          locked: 0,
          total: BADGES.length
        });
      }
    } catch (error) {
      console.error('Error fetching user badges:', error);
      setBadgeError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  };

  // Direct API call to debug caching issues
  const makeDirectApiCall = async () => {
    if (!userId) {
      setEvaluationError('No user ID provided');
      return;
    }
    
    try {
      setRefreshing(true);
      setCacheDiagnostics("");
      setNetworkRequests([]);
      
      // Create a timestamp parameter to bypass cache
      const timestamp = Date.now();
      const urls = [
        `/api/users/${userId}/badges?_t=${timestamp}`,
        `/api/users/${userId}/points?_t=${timestamp}`,
        `/api/badges?_t=${timestamp}`
      ];
      
      // Make direct fetch requests with cache monitoring
      const requests: any[] = [];
      
      // Make direct fetch requests with cache monitoring
      for (const url of urls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Get all headers
          const headers: {[key: string]: string} = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          
          let data;
          try {
            data = await response.json();
          } catch (e) {
            data = { error: "Could not parse JSON response" };
          }
          
          requests.push({
            url,
            status: response.status,
            headers,
            data: data
          });
          
          // Add diagnostics for 304 responses
          if (response.status === 304) {
            setCacheDiagnostics(prev => prev + `\n304 Not Modified detected for ${url}. This indicates the server thinks nothing has changed.\nCheck the ETag and If-None-Match headers.\n`);
          }
        } catch (e) {
          requests.push({
            url,
            error: e instanceof Error ? e.message : String(e)
          });
        }
      }
      
      setNetworkRequests(requests);
    } catch (error) {
      console.error('Error making direct API calls:', error);
      setEvaluationError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  };
  
  // Force badge evaluation
  const handleForceEvaluation = async () => {
    if (!userId) {
      setEvaluationError('No user ID available');
      return;
    }
    
    try {
      setEvaluationResult(null);
      setEvaluationError(null);
      setRefreshing(true);
      
      // Force backend to evaluate all badges
      const result = await badgeService.evaluateAllBadges(userId);
      
      setEvaluationResult({
        message: "Badge evaluation completed",
        result: result
      });
      
      // Refresh badges to show new state
      await refreshBadges(userId);
    } catch (error) {
      console.error('Error evaluating badges:', error);
      setEvaluationError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  };
  
  // Clear localStorage of badge-related data
  const handleClearLocalStorage = () => {
    // Find and remove any badge-related keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('badge') || key.includes('Badge'))) {
        keysToRemove.push(key);
      }
    }

    // Remove the found keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Update the localStorage display
    const storageData: {[key: string]: string} = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        try {
          const value = window.localStorage.getItem(key);
          storageData[key] = value || '';
        } catch (e) {
          storageData[key] = `[Error reading value: ${e}]`;
        }
      }
    }
    setLocalStorageData(storageData);
    
    console.log(`Cleared ${keysToRemove.length} badge-related items from localStorage`);
    return keysToRemove.length;
  };
  
  // Create test badge
  const handleCreateTestBadge = async () => {
    if (!userId) {
      alert('No user ID available');
      return;
    }
    
    const badgeId = "test-badge-" + new Date().getTime().toString().slice(-6);
    
    try {
      setRefreshing(true);
      // Create a test badge
      const progress = Math.floor(Math.random() * 100);
      const earned = progress === 100;
      
      await badgeService.updateBadgeProgress(userId, badgeId, progress, earned);
      
      alert(`Test badge created: ${badgeId} with progress ${progress}%${earned ? ' (earned)' : ''}`);
      
      // Refresh badges
      await refreshBadges(userId);
    } catch (error) {
      console.error('Error creating test badge:', error);
      alert(`Error creating test badge: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Helper function to format JSON
  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return `[Error formatting: ${e}]`;
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Badge Diagnostics</h1>
          <div className="flex gap-2">
            <button
              onClick={() => refreshBadges(userId)}
              disabled={loading || refreshing || !userId}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Badges
            </button>
            <button
              onClick={handleForceEvaluation}
              disabled={loading || refreshing || !userId}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Force Evaluation
            </button>
            <button
              onClick={makeDirectApiCall}
              disabled={refreshing || !userId}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <HelpCircle className="h-4 w-4" />
              )}
              Test API Calls
            </button>
          </div>
        </div>

        {/* User selection */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Selection</h2>
          <div className="flex items-center gap-4">
            <div className="flex-grow">
              <label className="block text-sm font-medium mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.trim())}
                placeholder="Enter user ID"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateTestBadge}
                disabled={!userId}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 h-10 mt-5"
              >
                <ThumbsUp className="h-4 w-4" />
                Create Test Badge
              </button>
              <button
                onClick={() => handleClearLocalStorage() && alert(`Cleared ${handleClearLocalStorage()} items`)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2 h-10 mt-5"
              >
                Clear LocalStorage
              </button>
            </div>
          </div>
          
          {/* Current User Info */}
          {user && (
            <div className="mt-4 p-2 bg-blue-50 rounded border border-blue-200">
              <p className="font-medium text-blue-900">Current User: {user.email} (ID: {user.id})</p>
              <button 
                className="text-blue-700 underline text-sm mt-1"
                onClick={() => setUserId(user.id)}
              >
                Use Current User ID
              </button>
            </div>
          )}
        </div>

        {/* Cache Diagnostic Results */}
        {cacheDiagnostics && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Cache Diagnostic Results
            </h2>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-3 rounded border border-yellow-200">
              {cacheDiagnostics}
            </pre>
          </div>
        )}

        {/* Network Requests */}
        {networkRequests.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Network Request Analysis</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded">
                <thead>
                  <tr>
                    <th className="p-2 border-b">Endpoint</th>
                    <th className="p-2 border-b">Status</th>
                    <th className="p-2 border-b">Headers</th>
                  </tr>
                </thead>
                <tbody>
                  {networkRequests.map((req, index) => (
                    <tr key={index}>
                      <td className="p-2 border-b font-mono text-sm">{req.url}</td>
                      <td className="p-2 border-b text-center">
                        {req.status ? (
                          <span className={`inline-block px-2 py-1 rounded ${req.status === 200 ? 'bg-green-100 text-green-800' : req.status === 304 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {req.status}
                          </span>
                        ) : (
                          <span className="text-red-600">Error</span>
                        )}
                      </td>
                      <td className="p-2 border-b">
                        {req.headers ? (
                          <details>
                            <summary className="cursor-pointer">View Headers</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs font-mono">
                              {formatJSON(req.headers)}
                            </pre>
                          </details>
                        ) : req.error ? (
                          <span className="text-red-600">{req.error}</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <details>
                <summary className="cursor-pointer font-medium text-blue-600">View Response Data</summary>
                <div className="mt-2 grid grid-cols-1 gap-4">
                  {networkRequests.map((req, index) => (
                    <div key={index} className="p-3 bg-white rounded border">
                      <h3 className="font-medium text-sm mb-1">{req.url}</h3>
                      <pre className="p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs font-mono">
                        {formatJSON(req.data)}
                      </pre>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Authentication Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span>User authenticated</span>
              </div>
              <div>
                <p>
                  <strong>User ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong> {user.role || "unknown"}
                </p>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p className="font-medium">Token Information:</p>
                  <p>Access Token: {tokenInfo?.hasAccessToken ? "Present" : "Missing"}</p>
                  <p>Refresh Token: {tokenInfo?.hasRefreshToken ? "Present" : "Missing"}</p>
                  {tokenInfo?.tokenInfo && (
                    <div className="mt-1">
                      <p className="font-medium">Token Payload:</p>
                      <pre className="overflow-x-auto bg-gray-200 p-1 rounded">
                        {formatJSON(tokenInfo.tokenInfo)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>User not authenticated - badges will not load</span>
            </div>
          )}
          
          {tokenError && (
            <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
              <p className="font-medium">Token Error:</p>
              <p>{tokenError}</p>
            </div>
          )}
        </div>

        {/* Badge Loading Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Badge Loading Status</h2>

          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading badges...</span>
            </div>
          ) : badgeError ? (
            <div className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{badgeError}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg shadow text-center">
                  <p className="text-sm text-gray-500">Total Badge Types</p>
                  <p className="text-2xl font-bold">{badgeStats.total}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow text-center">
                  <p className="text-sm text-gray-500">Earned Badges</p>
                  <p className="text-2xl font-bold text-green-600">{badgeStats.earned}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow text-center">
                  <p className="text-sm text-gray-500">In-Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{badgeStats.inProgress}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow text-center">
                  <p className="text-sm text-gray-500">Locked</p>
                  <p className="text-2xl font-bold text-gray-600">{badgeStats.locked}</p>
                </div>
              </div>

              {evaluationResult && (
                <div className="p-3 bg-green-50 text-green-700 rounded border border-green-200">
                  <p className="font-medium">Badge evaluation completed successfully!</p>
                  <details>
                    <summary className="cursor-pointer text-sm mt-1">View details</summary>
                    <pre className="mt-2 p-2 bg-white rounded overflow-auto max-h-60 text-xs">
                      {formatJSON(evaluationResult)}
                    </pre>
                  </details>
                </div>
              )}

              {evaluationError && (
                <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
                  <p className="font-medium">Error during badge evaluation:</p>
                  <p>{evaluationError}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* User Badges (Raw Data) */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Badges (Raw Data)</h2>
          {badgeError ? (
            <div className="bg-red-50 p-3 rounded text-red-700 mb-4">
              Error: {badgeError}
            </div>
          ) : null}
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
            {formatJSON(userBadges)}
          </pre>
        </div>

        {/* LocalStorage Inspection */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">LocalStorage Inspection</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
            {formatJSON(localStorageData)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AdminBadgeDiagnosticsPage;