import React, { useState, useEffect } from "react";
import { badgeService } from '../services/badgeService';
import { BADGES } from '../data/badges';
import { getTokenInfo } from '../services/tokenInfoService';
import { Loader2, RefreshCw, AlertCircle, Check, HelpCircle } from "lucide-react";
import useAuth from "../context/AuthContext";

/**
 * Diagnostic page for testing badge functionality
 * This page will help debug issues with the badge system
 */
const BadgesDiagnosticPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userBadges, setUserBadges] = useState<any>(null);
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [localStorageData, setLocalStorageData] = useState<{[key: string]: string}>({});
  
  // State for badge evaluation and refresh
  const [refreshing, setRefreshing] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  
  // Badge statistics derived from userBadges
  const [badgeStats, setBadgeStats] = useState({
    earned: 0,
    inProgress: 0,
    locked: 0
  });

  // Load token and badge data
  useEffect(() => {
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
      
      // Get user badges
      await refreshBadges();
      
      setLoading(false);
    };
    
    loadDiagnosticData();
  }, [user]);
  
  // Refresh badges from the server
  const refreshBadges = async () => {
    if (!user?.id) return;
    
    try {
      setRefreshing(true);
      const badges = await badgeService.getUserBadges(user.id);
      setUserBadges(badges);
      
      // Calculate badge statistics
      if (badges) {
        const earnedCount = Object.values(badges).filter((b: any) => b.earned).length;
        const inProgressCount = Object.values(badges).filter((b: any) => !b.earned && (b.progress || 0) > 0).length;
        const lockedCount = Object.values(badges).filter((b: any) => !b.earned && (!b.progress || b.progress === 0)).length;
        
        setBadgeStats({
          earned: earnedCount,
          inProgress: inProgressCount,
          locked: lockedCount
        });
      }
      
      setBadgeError(null);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      setBadgeError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  };
  
  // Force evaluation of badges
  const handleForceEvaluation = async () => {
    if (!user?.id) {
      setEvaluationError('No user ID available');
      return;
    }
    
    try {
      setEvaluationResult(null);
      setEvaluationError(null);
      setRefreshing(true);
      
      // Just manually update a sample badge for testing
      const testBadge = 'savings-bronze';
      
      // Try to update a badge directly as a test
      await badgeService.updateBadgeProgress(user.id, testBadge, 100, true);
      
      setEvaluationResult({
        message: "Direct badge update attempted for: " + testBadge
      });
      
      // Refresh badges after update
      await refreshBadges();
    } catch (error) {
      console.error('Error updating badges:', error);
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
    alert(`Cleared ${keysToRemove.length} badge-related items from localStorage`);
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
          <h1 className="text-2xl font-bold">Badges Diagnostic Page</h1>
          <div className="flex gap-2">
            <button
              onClick={refreshBadges}
              disabled={loading || refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
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
              disabled={loading || refreshing}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Force Evaluation
            </button>
            <button
              onClick={handleClearLocalStorage}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
            >
              Clear Local Storage
            </button>
          </div>
        </div>

        {/* User authentication status */}
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

        {/* Badge loading status */}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Total Badge Types:</strong> {BADGES.length}
                  </p>
                  <p>
                    <strong>Earned Badges:</strong> {badgeStats.earned}
                  </p>
                  <p>
                    <strong>In-Progress Badges:</strong> {badgeStats.inProgress}
                  </p>
                  <p>
                    <strong>Locked Badges:</strong> {badgeStats.locked}
                  </p>
                </div>
              </div>

              {evaluationResult && (
                <div className="p-2 bg-green-50 text-green-700 rounded border border-green-200">
                  Badge evaluation completed successfully!
                </div>
              )}

              {evaluationError && (
                <div className="p-2 bg-red-50 text-red-700 rounded border border-red-200">
                  {evaluationError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Available Badges */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">
            Available Badges ({BADGES.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BADGES.map(badge => {
              if (!badge || !badge.id) return null;
              const userBadge = userBadges?.[badge.id];
              return (
                <div key={badge.id} className="border rounded p-4 bg-white">
                  <div className="flex items-center mb-2">
                    <span className="text-3xl mr-3">{badge.icon}</span>
                    <h3 className="font-medium">{badge.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                  <div className="text-sm">
                    <div>ID: <code>{badge.id}</code></div>
                    <div>Category: {badge.category}</div>
                    <div>
                      Status: {userBadge?.earned ? (
                        <span className="text-green-600 font-medium">Earned ✓</span>
                      ) : (
                        <span>Not earned ({userBadge?.progress || 0}%)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

export default BadgesDiagnosticPage;
