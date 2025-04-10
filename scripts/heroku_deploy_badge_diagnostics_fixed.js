// Heroku deployment script for badge diagnostics page (fixed)
// This script deploys the badge diagnostics page and includes all necessary dependencies

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GIT_BRANCH = 'badge-diagnostics-page-fixed';
const COMMIT_MESSAGE = 'Add badge diagnostics page with all dependencies';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of badge diagnostics page (fixed)...');

try {
  // Make sure we're on main branch first
  console.log('Switching to main branch to start fresh...');
  execSync('git checkout main', { stdio: 'inherit' });
  
  // Create a new branch
  console.log(`Creating new branch: ${GIT_BRANCH}`);
  execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Ensure the services directory exists
  const servicesDir = 'src/services';
  if (!fs.existsSync(servicesDir)) {
    console.log(`Creating services directory: ${servicesDir}`);
    fs.mkdirSync(servicesDir, { recursive: true });
  }
  
  // Create the tokenInfoService.ts file if it doesn't exist
  const tokenInfoServicePath = 'src/services/tokenInfoService.ts';
  if (!fs.existsSync(tokenInfoServicePath)) {
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
  }

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
