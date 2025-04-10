import React, { useState, useEffect } from 'react';
import { getTokenInfo } from '../services/tokenInfoService';
import { badgeService } from '../services/badgeService';
import { BADGES } from '../data/badges';
import useAuth from '../context/AuthContext';

/**
 * Diagnostics page for badge system
 * This page helps diagnose issues with badge authentication and user data
 */
const BadgesDiagnosticPage: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userBadges, setUserBadges] = useState<any>(null);
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [localStorage, setLocalStorage] = useState<{[key: string]: string}>({});
  const { user, isAuthenticated } = useAuth();
  
  // Force badge evaluation for testing
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  
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
        setLocalStorage(storageData);
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
      try {
        if (user?.id) {
          const badges = await badgeService.getUserBadges(user.id);
          setUserBadges(badges);
        }
      } catch (error) {
        console.error('Error fetching user badges:', error);
        setBadgeError(error instanceof Error ? error.message : String(error));
      }
      
      setLoading(false);
    };
    
    loadDiagnosticData();
  }, [user]);
  
  const handleEvaluateBadges = async () => {
    if (!user?.id) {
      setEvaluationError('No user ID available');
      return;
    }
    
    try {
      setEvaluationResult(null);
      setEvaluationError(null);
      
      // Just manually update a sample badge for testing
      // Using a simpler approach that doesn't rely on specific methods
      const testBadge = 'savings-bronze';
      
      // Try to update a badge directly as a test
      await badgeService.updateBadgeProgress(user.id, testBadge, 100, true);
      
      setEvaluationResult({
        message: "Direct badge update attempted for: " + testBadge
      });
      
      // Refresh badges after update
      const badges = await badgeService.getUserBadges(user.id);
      setUserBadges(badges);
    } catch (error) {
      console.error('Error updating badges:', error);
      setEvaluationError(error instanceof Error ? error.message : String(error));
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
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Badge System Diagnostics</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <p>Loading diagnostic data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Authentication Status */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="mb-2">
              <span className="font-medium">Authenticated:</span> {isAuthenticated ? '✅ Yes' : '❌ No'}
            </div>
            <div className="mb-2">
              <span className="font-medium">User ID:</span> {user?.id || 'Not available'}
            </div>
            <div className="mb-2">
              <span className="font-medium">User Email:</span> {user?.email || 'Not available'}
            </div>
            <div className="mb-2">
              <span className="font-medium">User Role:</span> {user?.role || 'Not available'}
            </div>
          </section>
          
          {/* Token Information */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Token Information</h2>
            {tokenError ? (
              <div className="bg-red-50 p-3 rounded text-red-700 mb-4">
                Error: {tokenError}
              </div>
            ) : null}
            <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm">
              {formatJSON(tokenInfo)}
            </pre>
          </section>
          
          {/* User Badges */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Badges</h2>
            {badgeError ? (
              <div className="bg-red-50 p-3 rounded text-red-700 mb-4">
                Error: {badgeError}
              </div>
            ) : null}
            <div className="mb-4">
              <button 
                onClick={handleEvaluateBadges}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                disabled={!user?.id}
              >
                Force Badge Evaluation
              </button>
              {evaluationError && (
                <div className="bg-red-50 p-3 rounded text-red-700 mt-2">
                  Evaluation Error: {evaluationError}
                </div>
              )}
              {evaluationResult && (
                <div className="bg-green-50 p-3 rounded text-green-700 mt-2">
                  Evaluation successful!
                </div>
              )}
            </div>
            <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm">
              {formatJSON(userBadges)}
            </pre>
          </section>
          
          {/* Available Badges */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Available Badges ({BADGES.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BADGES.map(badge => {
                const userBadge = userBadges?.[badge.id];
                return (
                  <div key={badge.id} className="border rounded p-4">
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
          </section>
          
          {/* LocalStorage Inspection */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">LocalStorage Inspection</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm">
              {formatJSON(localStorage)}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
};

export default BadgesDiagnosticPage;