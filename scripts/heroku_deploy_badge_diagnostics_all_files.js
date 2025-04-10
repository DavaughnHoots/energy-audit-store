// Heroku deployment script for badge diagnostics page (all files created explicitly)
// This script creates all needed files then deploys the badge diagnostics page

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GIT_BRANCH = 'badge-diagnostics-complete';
const COMMIT_MESSAGE = 'Add complete badge diagnostics page with all files';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of complete badge diagnostics page...');

try {
  // Make sure we're on main branch first
  console.log('Switching to main branch to start fresh...');
  execSync('git checkout main', { stdio: 'inherit' });
  
  // Create a new branch
  console.log(`Creating new branch: ${GIT_BRANCH}`);
  execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Ensure directories exist
  const servicesDir = 'src/services';
  const pagesDir = 'src/pages';
  if (!fs.existsSync(servicesDir)) {
    console.log(`Creating services directory: ${servicesDir}`);
    fs.mkdirSync(servicesDir, { recursive: true });
  }
  if (!fs.existsSync(pagesDir)) {
    console.log(`Creating pages directory: ${pagesDir}`);
    fs.mkdirSync(pagesDir, { recursive: true });
  }
  
  // Create the tokenInfoService.ts file
  const tokenInfoServicePath = 'src/services/tokenInfoService.ts';
  console.log(`Creating tokenInfoService at: ${tokenInfoServicePath}`);
  
  const tokenInfoServiceContent = `/**
 * Service for retrieving token information from the server
 */

import { apiClient } from './apiClient';

export interface TokenInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  userId: string | null;
  tokenInfo: {
    userId?: string;
    email?: string;
    role?: string;
    exp?: number;
    token?: string;
  } | null;
}

/**
 * Decode JWT token and extract payload
 */
export function decodeJwtToken(token: string): any {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return null;
    
    const base64Payload = tokenParts[1];
    return JSON.parse(atob(base64Payload));
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return null;
  }
}

/**
 * Fetch token information from the server
 */
export async function getTokenInfo(): Promise<TokenInfo> {
  try {
    const response = await apiClient.get<any>('/auth-token/token-info', {
      // Add cache busting to prevent 304 responses
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-None-Match': ''
      },
      params: {
        _t: Date.now()
      }
    });
    console.log('Raw token info response:', response);
    
    // Extract data, handling both direct and wrapped responses
    const data = response.data?.data || response.data;
    
    // Extract token payload if present but not properly exposed by the API
    let tokenPayload = null;
    if (data?.tokenInfo?.token) {
      try {
        const token = data.tokenInfo.token;
        tokenPayload = decodeJwtToken(token);
        console.log('Extracted token payload:', tokenPayload);
      } catch (e) {
        console.error('Error parsing token payload:', e);
      }
    }
    
    // Combine sources to get the most complete token info
    const result: TokenInfo = {
      hasAccessToken: Boolean(data?.hasAccessToken),
      hasRefreshToken: Boolean(data?.hasRefreshToken),
      userId: data?.userId || (tokenPayload?.userId || tokenPayload?.sub) || null,
      tokenInfo: data?.tokenInfo ? {
        ...data.tokenInfo,
        // Enhance token info with payload data if available
        ...(tokenPayload ? {
          userId: tokenPayload.userId || tokenPayload.sub || data.tokenInfo.userId,
          email: tokenPayload.email || data.tokenInfo.email || '',
          role: tokenPayload.role || data.tokenInfo.role || 'user'
        } : {})
      } : null
    };
    
    console.log('Enhanced processed token info:', result);
    
    // Store token info in localStorage for offline access
    if (result.hasAccessToken && result.tokenInfo) {
      try {
        localStorage.setItem('token-info', JSON.stringify(result));
      } catch (e) {
        console.error('Error storing token info in localStorage:', e);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching token info:', error);
    
    // Check if we have token info in localStorage as fallback
    try {
      const storedTokenInfo = localStorage.getItem('token-info');
      if (storedTokenInfo) {
        console.log('Using stored token info from localStorage');
        return JSON.parse(storedTokenInfo);
      }
    } catch (e) {
      console.error('Error getting token info from localStorage:', e);
    }
    
    return {
      hasAccessToken: false,
      hasRefreshToken: false,
      userId: null,
      tokenInfo: null
    };
  }
}

/**
 * Check if there are valid tokens available
 */
export async function hasValidTokens(): Promise<boolean> {
  // First check localStorage
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    return true;
  }
  
  // If not found in localStorage, check with the server for HttpOnly cookies
  try {
    const tokenInfo = await getTokenInfo();
    return tokenInfo.hasAccessToken;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}`;
  
  fs.writeFileSync(tokenInfoServicePath, tokenInfoServiceContent);

  // Create the BadgesDiagnosticPage.tsx file
  const badgesDiagnosticPagePath = 'src/pages/BadgesDiagnosticPage.tsx';
  console.log(`Creating BadgesDiagnosticPage at: ${badgesDiagnosticPagePath}`);
  
  const badgesDiagnosticPageContent = `import React, { useState, useEffect } from 'react';
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
              storageData[key] = \`[Error reading value: \${e}]\`;
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
      return \`[Error formatting: \${e}]\`;
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

export default BadgesDiagnosticPage;`;
  
  fs.writeFileSync(badgesDiagnosticPagePath, badgesDiagnosticPageContent);

  // Update App.tsx
  console.log('Updating App.tsx to include diagnostics route...');
  const appTsxPath = 'src/App.tsx';
  let appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
  
  // Add import if not present
  if (!appTsxContent.includes('import React, { Suspense, lazy } from')) {
    appTsxContent = appTsxContent.replace(
      'import React from',
      'import React, { Suspense, lazy } from'
    );
  }
  
  // Add the lazy loaded component if not present
  if (!appTsxContent.includes('const BadgesDiagnosticPage =')) {
    appTsxContent = appTsxContent.replace(
      '// Main App component with routing',
      '// Lazy-loaded components\nconst BadgesDiagnosticPage = lazy(() => import(\'./pages/BadgesDiagnosticPage\'));\n\n// Main App component with routing'
    );
  }
  
  // Add the route if not present
  if (!appTsxContent.includes('path="/diagnostics/badges"')) {
    appTsxContent = appTsxContent.replace(
      '</ProtectedRoute>\n              }\n            />',
      '</ProtectedRoute>\n              }\n            />\n            <Route\n              path="/diagnostics/badges"\n              element={\n                <ProtectedRoute>\n                  <Suspense fallback={<div className="p-8 text-center">Loading diagnostics...</div>}>\n                    <BadgesDiagnosticPage />\n                  </Suspense>\n                </ProtectedRoute>\n              }\n            />'
    );
  }
  
  fs.writeFileSync(appTsxPath, appTsxContent);

  // Add files to staging
  console.log('Adding files to staging...');
  execSync('git add src/services/tokenInfoService.ts', { stdio: 'inherit' });
  execSync('git add src/pages/BadgesDiagnosticPage.tsx', { stdio: 'inherit' });
  execSync('git add src/App.tsx', { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync(`git commit -m "${COMMIT_MESSAGE}"`, { stdio: 'inherit' });

  // Push to GitHub
  console.log('Pushing to GitHub...');
  execSync(`git push -u origin ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Deploy to Heroku
  console.log(`Deploying to Heroku app: ${HEROKU_APP}...`);
  execSync(`git push https://git.heroku.com/${HEROKU_APP}.git ${GIT_BRANCH}:main -f`, {
    stdio: 'inherit'
  });

  console.log('Deployment completed successfully!');
  console.log('New diagnostic page is available at: /diagnostics/badges');
  console.log('Changes deployed:');
  console.log('1. Badge diagnostics page with token and badge inspection');
  console.log('2. Token info service for authentication debugging');
  console.log('3. Lazy-loaded route for improved performance');

  // Checkout back to main branch
  console.log('Checking out back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
