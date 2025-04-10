// Script to fix token user data extraction issue in auth and badge systems
// This version directly creates the tokenInfoService.ts file

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GIT_BRANCH = 'fix-token-user-data-extraction';
const COMMIT_MESSAGE = 'Fix token user data extraction for auth and badge systems';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of token user data extraction fix...');

try {
  // Create a new branch - if we're already on it, this will fail gracefully
  console.log(`Creating/checking branch: ${GIT_BRANCH}`);
  try {
    execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: 'inherit' });
  } catch (e) {
    console.log(`Branch may already exist, trying to check it out`);
    execSync(`git checkout ${GIT_BRANCH}`, { stdio: 'inherit' });
  }

  // Create directory if it doesn't exist
  const serviceDir = 'src/services';
  if (!fs.existsSync(serviceDir)) {
    console.log(`Creating directory: ${serviceDir}`);
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  
  // Create the file directly with our enhanced implementation
  const tokenInfoServicePath = 'src/services/tokenInfoService.ts';
  console.log(`Creating enhanced token info service at: ${tokenInfoServicePath}`);
  
  const tokenInfoServiceContent = `/**
 * Service for retrieving token information from the server
 * Used to access HttpOnly cookies that can't be directly accessed by JavaScript
 */

import { apiClient } from './apiClient';

export interface TokenInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  userId: string | null;
  tokenInfo: {
    userId: string;
    email: string;
    role: string;
    exp: number;
    token?: string;
  } | null;
}

/**
 * Decode JWT token and extract payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
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
 * This allows JavaScript to see information about HttpOnly cookies
 * that would otherwise be invisible to the frontend
 */
export async function getTokenInfo(): Promise<TokenInfo> {
  try {
    const response = await apiClient.get<any>('/auth-token/token-info', {
      // Add cache busting to prevent 304 responses
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-None-Match': '' // Prevents 304 responses based on ETag
      },
      params: {
        _t: Date.now() // Add timestamp to bust cache
      }
    });
    console.log('Raw token info response:', response);
    
    // Extract data, handling both direct and wrapped responses
    const data = response.data?.data || response.data;
    
    // Debugging to help identify what's actually in the response
    console.log('Full token data structure:', JSON.stringify(data, null, 2));
    
    // Extract token payload if present but not properly exposed by the API
    let tokenPayload = null;
    if (data?.tokenInfo?.token) {
      try {
        // Try to extract user info from JWT token if present
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
 * Check if there are valid tokens available (either in localStorage or HttpOnly cookies)
 * @returns True if valid tokens are available
 */
export async function hasValidTokens(): Promise<boolean> {
  // First check localStorage
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    return true;
  }
  
  // If not found in localStorage, check with the server (for HttpOnly cookies)
  try {
    const tokenInfo = await getTokenInfo();
    return tokenInfo.hasAccessToken;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}
`;
  
  // Write the file
  fs.writeFileSync(tokenInfoServicePath, tokenInfoServiceContent);
  
  // Add files to staging
  console.log('Adding files to staging...');
  execSync('git add src/services/tokenInfoService.ts', { stdio: 'inherit' });
  
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
  console.log('Changes deployed:');
  console.log('1. Enhanced token info extraction with JWT payload decoding');
  console.log('2. Added cache-busting headers to prevent 304 responses');
  console.log('3. Added localStorage persistence for token info');

  // Checkout back to main branch
  console.log('Checking out back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
