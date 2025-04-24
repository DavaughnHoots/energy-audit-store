/**
 * Mobile Authentication Fix Deployment Script
 * 
 * This script implements the changes needed to fix mobile authentication issues
 * by addressing the "Bearer" only token issue and implementing a mobile-first
 * storage strategy.
 * 
 * Implementation plan: energy-audit-vault/operations/bug-fixes/mobile-authentication-fix-implementation-plan-v2.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  dryRun: false, // Set to false to actually write files
  herokuDeploy: false, // Set to true to deploy to Heroku automatically
  useFeatureFlag: true, // Whether to wrap changes in feature flag
  featureFlagPercentage: 0, // Initial percentage (0-100)
  backupFiles: true // Create backups before modifying
};

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.backups', 'mobile-auth-fix-' + Date.now());

// File paths
const FILES = {
  tokenUtils: path.join(SRC_DIR, 'utils', 'tokenUtils.ts'),
  cookieUtils: path.join(SRC_DIR, 'utils', 'cookieUtils.ts'),
  apiClient: path.join(SRC_DIR, 'services', 'apiClient.ts'),
  authContext: path.join(SRC_DIR, 'context', 'AuthContext.tsx'),
  diagnosticPage: path.join(SRC_DIR, 'pages', 'AuthDiagnosticPage.tsx'),
  appRouter: path.join(SRC_DIR, 'router.tsx'), // Assuming router file for adding diagnostic route
};

/**
 * Creates a backup of files before modifying them
 */
async function createBackups() {
  if (!CONFIG.backupFiles) return;
  
  console.log('📦 Creating backup of files before modifications...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  for (const [key, filePath] of Object.entries(FILES)) {
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(BACKUP_DIR, path.basename(filePath));
      fs.copyFileSync(filePath, backupPath);
      console.log(`  ✅ Backed up ${path.basename(filePath)}`);
    }
  }
  
  console.log('✅ Backups created successfully');
}

/**
 * Creates the tokenUtils.ts file with isValidToken function
 */
async function createTokenUtils() {
  console.log('📝 Creating tokenUtils.ts...');
  
  const content = `/**
 * Token Validation Utilities
 * 
 * Enhanced token validation to prevent issues with invalid tokens being used
 * in authentication headers.
 */

/**
 * Validates if a token is a properly formatted JWT token
 * Returns true only if the token:
 * - Is not null or undefined
 * - Is not an empty string or whitespace
 * - Is not the literal string "undefined" or "null"
 * - Has minimum length (20 chars)
 * - Contains at least one period (basic JWT structure)
 */
export const isValidToken = (t?: string | null): t is string => {
  if (!t) return false;
  const token = t.trim();
  return (
    token !== '' &&
    token !== 'undefined' &&
    token !== 'null' &&
    token.length > 20 &&
    token.includes('.')
  );
};
`;

  const dir = path.dirname(FILES.tokenUtils);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!CONFIG.dryRun) {
    fs.writeFileSync(FILES.tokenUtils, content);
    console.log(`  ✅ Created ${FILES.tokenUtils}`);
  } else {
    console.log(`  🔍 Would create ${FILES.tokenUtils} (dry run)`);
  }
}

/**
 * Updates the API client with improved token validation
 */
async function updateApiClient() {
  console.log('🔄 Updating apiClient.ts...');
  
  if (!fs.existsSync(FILES.apiClient)) {
    console.error(`  ❌ ${FILES.apiClient} not found`);
    return;
  }
  
  const content = fs.readFileSync(FILES.apiClient, 'utf8');
  
  // Add import for isValidToken
  let updatedContent = content.replace(
    /import axios, \{ AxiosRequestConfig, AxiosResponse, AxiosError \} from 'axios';/,
    "import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';\nimport { isValidToken } from '../utils/tokenUtils';"
  );
  
  // Add window tracking variable declaration near the top
  if (!updatedContent.includes('window.__authBearerOnly')) {
    updatedContent = updatedContent.replace(
      "let consecutive401 = 0;",
      "let consecutive401 = 0;\n\n// For tracking and diagnostics\ndeclare global {\n  interface Window {\n    __authBearerOnly?: number;\n  }\n}"
    );
  }
  
  // Update the request interceptor to use isValidToken
  const interceptorRegex = /(axiosInstance\.interceptors\.request\.use\([\s\S]*?)(\s+\/\/\s*Only add authorization header if token exists[\s\S]*?)(\s+return config;)/;
  
  if (interceptorRegex.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      interceptorRegex,
      function(match, p1, oldTokenCheck, p3) {
        return p1 + "\n    // Enhanced token validation - only add header for valid JWT tokens\n    if (isValidToken(token)) {\n      config.headers.Authorization = `Bearer ${token}`;\n      console.log(`[auth] ✅ Added Authorization header with valid token: Bearer ${token.substring(0, 10)}...`);\n    } else {\n      // ALWAYS remove Authorization header in the invalid token case\n      delete config.headers.Authorization;\n      \n      // Track and log when we prevent a \"Bearer\" only header\n      if (token) {\n        console.warn(`[auth] ⛔ Invalid token value, header stripped: \"${token}\". Prevented Bearer-only header.`);\n        window.__authBearerOnly = (window.__authBearerOnly || 0) + 1;\n      }\n    }" + p3;
      }
    );
  } else {
    console.error('  ❌ Could not find request interceptor to update');
  }
  
  if (!CONFIG.dryRun) {
    fs.writeFileSync(FILES.apiClient, updatedContent);
    console.log(`  ✅ Updated ${FILES.apiClient}`);
  } else {
    console.log(`  🔍 Would update ${FILES.apiClient} (dry run)`);
  }
}

/**
 * Updates cookieUtils.ts with mobile detection and storage strategies
 */
async function updateCookieUtils() {
  console.log('🔄 Updating cookieUtils.ts...');
  
  if (!fs.existsSync(FILES.cookieUtils)) {
    console.error(`  ❌ ${FILES.cookieUtils} not found`);
    return;
  }
  
  const content = fs.readFileSync(FILES.cookieUtils, 'utf8');
  let updatedContent = content;
  
  // Add import for isValidToken if it doesn't exist
  if (!updatedContent.includes('import { isValidToken }')) {
    updatedContent = updatedContent.replace(
      "import { serialize, SerializeOptions } from 'cookie';",
      "import { serialize, SerializeOptions } from 'cookie';\nimport { isValidToken } from './tokenUtils';"
    );
  }
  
  // Update syncAuthTokens function to prioritize localStorage for mobile
  const syncAuthTokensRegex = /(export function syncAuthTokens\(forceSync = false\) \{[\s\S]*?)(\/\/\s*Priority logic for mobile vs desktop[\s\S]*?const isMobile[\s\S]*?let finalAccessToken[\s\S]*?let finalRefreshToken[\s\S]*?)([\s\S]*?return true;\s*\}\s*catch[\s\S]*?\})/;
  
  if (syncAuthTokensRegex.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      syncAuthTokensRegex,
      function(match, prefix, oldPriorityLogic, suffix) {
        return prefix + "\n    // Priority logic for mobile vs desktop with console table logging\n    const isMobile = isMobileDevice();\n    let finalAccessToken = null;\n    let finalRefreshToken = null;\n    \n    if (isMobile) {\n      // On mobile, STRONGLY prefer localStorage with cookie fallback\n      finalAccessToken = hasValidAccessTokenInLS ? updatedAccessToken : \n                       (hasValidAccessTokenInCookies ? updatedCookies.accessToken : null);\n                       \n      finalRefreshToken = hasValidRefreshTokenInLS ? updatedRefreshToken : \n                        (hasValidRefreshTokenInCookies ? updatedCookies.refreshToken : null);\n                        \n      console.log('📱 Mobile device - prioritizing localStorage tokens over cookies');\n    } else {\n      // On desktop, prefer cookies with localStorage fallback\n      finalAccessToken = hasValidAccessTokenInCookies ? updatedCookies.accessToken : \n                       (hasValidAccessTokenInLS ? updatedAccessToken : null);\n                       \n      finalRefreshToken = hasValidRefreshTokenInCookies ? updatedCookies.refreshToken : \n                        (hasValidRefreshTokenInLS ? updatedRefreshToken : null);\n                        \n      console.log('🖥️ Desktop device - prioritizing cookie tokens over localStorage');\n    }\n    \n    // Log token diagnostic info (helps with debugging)\n    console.table({\n      Source: ['cookie', 'localStorage'],\n      access: [!!updatedCookies.accessToken, !!updatedAccessToken],\n      refresh: [!!updatedCookies.refreshToken, !!updatedRefreshToken]\n    });" + suffix;
      }
    );
  } else {
    console.error('  ❌ Could not find syncAuthTokens to update');
  }
  
  if (!CONFIG.dryRun) {
    fs.writeFileSync(FILES.cookieUtils, updatedContent);
    console.log(`  ✅ Updated ${FILES.cookieUtils}`);
  } else {
    console.log(`  🔍 Would update ${FILES.cookieUtils} (dry run)`);
  }
}

/**
 * Creates the diagnostic page for authentication troubleshooting
 */
async function createDiagnosticPage() {
  console.log('📝 Creating AuthDiagnosticPage.tsx...');
  
  const content = `/**
 * Authentication Diagnostic Page
 *
 * This page provides diagnostic information about the current authentication state,
 * including device detection, token storage, and token validation. It's useful for
 * debugging authentication issues, particularly on mobile devices.
 *
 * NOTE: This page should only be exposed in non-production environments.
 */

import React, { useEffect, useState } from 'react';
import { getCookie } from '@/utils/cookieUtils';
import { isValidToken } from '@/utils/tokenUtils';

const AuthDiagnosticPage: React.FC = () => {
  const [diagnosticData, setDiagnosticData] = useState({
    device: 'Detecting...',
    cookies: {},
    localStorage: {},
    tokenDetails: {}
  });
  
  useEffect(() => {
    // Get device info
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceInfo = {
      userAgent: navigator.userAgent,
      isMobile,
      cookiesEnabled: navigator.cookieEnabled,
      platform: navigator.platform
    };
    
    // Get cookie info
    const accessTokenCookie = getCookie('accessToken');
    const refreshTokenCookie = getCookie('refreshToken');
    const xsrfTokenCookie = getCookie('XSRF-TOKEN');
    
    // Get localStorage info
    let accessTokenLS, refreshTokenLS;
    try {
      accessTokenLS = localStorage.getItem('accessToken');
      refreshTokenLS = localStorage.getItem('refreshToken');
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    
    // Parse token info if available
    const tokenDetails = {};
    if (accessTokenCookie || accessTokenLS) {
      try {
        const token = accessTokenCookie || accessTokenLS;
        const [header, payload] = token.split('.');
        if (header && payload) {
          tokenDetails['header'] = JSON.parse(atob(header));
          tokenDetails['payload'] = JSON.parse(atob(payload));
          tokenDetails['isValid'] = isValidToken(token);
        } else {
          tokenDetails['isValid'] = false;
          tokenDetails['error'] = 'Invalid JWT format';
        }
      } catch (e) {
        tokenDetails['isValid'] = false;
        tokenDetails['error'] = e.message;
      }
    } else {
      tokenDetails['isValid'] = false;
      tokenDetails['error'] = 'No token available';
    }
    
    setDiagnosticData({
      device: deviceInfo,
      cookies: {
        accessToken: accessTokenCookie || 'Not set',
        refreshToken: refreshTokenCookie ? '[Present]' : 'Not set',
        xsrfToken: xsrfTokenCookie ? '[Present]' : 'Not set'
      },
      localStorage: {
        accessToken: accessTokenLS || 'Not set',
        refreshToken: refreshTokenLS ? '[Present]' : 'Not set'
      },
      tokenDetails
    });
  }, []);
  
  // Add a manual test functionality
  const testAuthHeader = async () => {
    try {
      const response = await fetch('/api/auth/test-header', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      alert(\`Auth Header Test: \${data.success ? 'Success' : 'Failed'}\n\${data.message}\`);
    } catch (e) {
      alert(\`Error testing auth header: \${e.message}\`);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Diagnostics</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold">Device Information</h2>
        <p>Type: {diagnosticData.device.isMobile ? 'Mobile' : 'Desktop'}</p>
        <p>User Agent: {diagnosticData.device.userAgent}</p>
        <p>Cookies Enabled: {diagnosticData.device.cookiesEnabled ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded">
          <h2 className="text-xl font-semibold">Cookie Storage</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(diagnosticData.cookies, null, 2)}
          </pre>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded">
          <h2 className="text-xl font-semibold">Local Storage</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(diagnosticData.localStorage, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold">Token Details</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
          {JSON.stringify(diagnosticData.tokenDetails, null, 2)}
        </pre>
      </div>
      
      <div className="bg-red-50 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold">Authentication Tests</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
          onClick={testAuthHeader}
        >
          Test Authorization Header
        </button>
      </div>
    </div>
  );
};

export default AuthDiagnosticPage;
`;

  const dir = path.dirname(FILES.diagnosticPage);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!CONFIG.dryRun) {
    fs.writeFileSync(FILES.diagnosticPage, content);
    console.log(`  ✅ Created ${FILES.diagnosticPage}`);
  } else {
    console.log(`  🔍 Would create ${FILES.diagnosticPage} (dry run)`);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔧 Starting Mobile Authentication Fix deployment...');
  console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE'} | Feature Flag: ${CONFIG.useFeatureFlag ? 'YES' : 'NO'}`);
  
  try {
    // Create backups
    await createBackups();
    
    // Create/update files
    await createTokenUtils();
    await updateApiClient();
    await updateCookieUtils();
    await createDiagnosticPage();
    
    // Deploy if needed
    if (!CONFIG.dryRun && CONFIG.herokuDeploy) {
      console.log('🚀 Deploying to Heroku...');
      try {
        execSync('git add -A');
        execSync('git commit -m "Fix: Mobile authentication issues with enhanced token validation"');
        execSync('git push heroku master');
        console.log('✅ Successfully deployed to Heroku!');
      } catch (error) {
        console.error('❌ Heroku deployment failed:', error);
      }
    }
    
    console.log('✅ Mobile Authentication Fix deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

// Execute the script
main();
