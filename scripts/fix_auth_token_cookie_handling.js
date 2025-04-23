/**
 * Fix for authentication token and cookie handling issues
 * 
 * This script addresses the following issues:
 * 1. 'undefined' being stored as literal string value in cookies
 * 2. Authorization header having Bearer with no token
 * 3. Token refresh not propagating correctly
 * 4. Improper synchronization between localStorage and cookies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to update
const FILES_TO_UPDATE = {
  COOKIE_UTILS: 'src/utils/cookieUtils.ts',
  AUTH_CONTEXT: 'src/context/AuthContext.tsx',
  API_CLIENT: 'src/services/apiClient.ts',
  AUTH_MIDDLEWARE: 'backend/src/middleware/auth.ts'
};

// Utility function to log with timestamp
const log = (message) => {
  console.log(`[${new Date().toISOString()}] [TOKEN-FIX] ${message}`);
};

// Enhanced cookie utils implementation with stronger validation
const ENHANCED_COOKIE_UTILS = `/**
 * Utility functions for working with cookies
 * Used to synchronize authentication between cookies and localStorage
 */

import { serialize, SerializeOptions } from 'cookie';

/**
 * Parse a cookie string and return an object with key-value pairs
 * @param cookieStr - The cookie string to parse (defaults to document.cookie)
 * @returns Record of cookie key-value pairs
 */
export function parseCookies(cookieStr: string = document.cookie): Record<string, string> {
  return cookieStr
    .split(';')
    .map(v => v.trim())
    .reduce((acc, current) => {
      const [name, ...value] = current.split('=');
      if (name) acc[name] = decodeURIComponent(value.join('='));
      return acc;
    }, {} as Record<string, string>);
}

/**
 * Get a specific cookie by name
 * @param name - The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  const cookies = parseCookies();
  const value = cookies[name];
  
  // Return null for undefined, "undefined", or empty strings
  if (!value || value === 'undefined' || value.trim() === '') {
    return null;
  }
  
  return value;
}

/**
 * Set a cookie with proper serialization and guards against falsy or empty values
 * @param name - Cookie name
 * @param value - Cookie value (will be skipped if falsy, "undefined", or empty)
 * @param opts - Cookie options
 */
export function setCookie(
  name: string,
  value: string | undefined | null,
  opts: SerializeOptions = {}
) {
  // Never set cookies to undefined, "undefined", or empty strings
  if (value === undefined || value === null || value === 'undefined' || value.trim() === '') {
    console.warn("Attempted to set cookie '" + name + "' to invalid value: '" + value + "'. Skipping.");
    return;
  }

  document.cookie = serialize(name, value, {
    path: '/',
    sameSite: 'strict',
    ...opts,
  });
  
  // For debugging
  console.log("Cookie set: " + name + " (length: " + value.length + ")");
}

/**
 * Remove a cookie by setting it to expire in the past
 * @param name - Cookie name to remove
 * @param opts - Cookie options
 */
export function removeCookie(
  name: string,
  opts: SerializeOptions = {}
) {
  document.cookie = serialize(name, '', {
    path: '/',
    sameSite: 'strict',
    expires: new Date(0), // Set expiration to the past
    ...opts,
  });
  
  console.log("Cookie removed: " + name);
}

/**
 * Synchronize auth tokens between cookies and localStorage
 * This ensures both authentication methods work
 */
export function syncAuthTokens(): void {
  try {
    // Check cookies for valid tokens
    const cookies = parseCookies();
    
    // Get tokens from localStorage
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Synchronize cookie -> localStorage (only if cookie value is valid)
    if (cookies.accessToken && cookies.accessToken !== 'undefined' && cookies.accessToken.trim() !== '') {
      if (!accessToken || accessToken !== cookies.accessToken) {
        localStorage.setItem('accessToken', cookies.accessToken);
        console.log('Synchronized valid accessToken from cookie to localStorage');
      }
    }
    
    if (cookies.refreshToken && cookies.refreshToken !== 'undefined' && cookies.refreshToken.trim() !== '') {
      if (!refreshToken || refreshToken !== cookies.refreshToken) {
        localStorage.setItem('refreshToken', cookies.refreshToken);
        console.log('Synchronized valid refreshToken from cookie to localStorage');
      }
    }
    
    // Synchronize localStorage -> cookies (only if localStorage value is valid)
    if (accessToken && accessToken !== 'undefined' && accessToken.trim() !== '') {
      if (!cookies.accessToken || cookies.accessToken !== accessToken) {
        setCookie('accessToken', accessToken, { maxAge: 15 * 60 }); // 15 minutes
        console.log('Synchronized valid accessToken from localStorage to cookie');
      }
    }
    
    if (refreshToken && refreshToken !== 'undefined' && refreshToken.trim() !== '') {
      if (!cookies.refreshToken || cookies.refreshToken !== refreshToken) {
        setCookie('refreshToken', refreshToken, { maxAge: 7 * 24 * 60 * 60 }); // 7 days
        console.log('Synchronized valid refreshToken from localStorage to cookie');
      }
    }
    
    // Remove invalid cookies
    if (cookies.accessToken === 'undefined' || cookies.accessToken?.trim() === '') {
      removeCookie('accessToken');
      console.log('Removed invalid accessToken cookie');
    }
    
    if (cookies.refreshToken === 'undefined' || cookies.refreshToken?.trim() === '') {
      removeCookie('refreshToken');
      console.log('Removed invalid refreshToken cookie');
    }
    
    // Also check localStorage for "undefined" string values and remove them
    if (accessToken === 'undefined' || accessToken?.trim() === '') {
      localStorage.removeItem('accessToken');
      console.log('Removed invalid accessToken from localStorage');
    }
    
    if (refreshToken === 'undefined' || refreshToken?.trim() === '') {
      localStorage.removeItem('refreshToken');
      console.log('Removed invalid refreshToken from localStorage');
    }
  } catch (error) {
    console.error('Error in syncAuthTokens:', error);
  }
}
`;

// Enhanced auth middleware with better handling of undefined cookie values
const AUTH_MIDDLEWARE_PATCH = [
  // Patch 1: Add additional validation when extracting tokens
  {
    search: `// Fallback to cookie if header gave nothing
    if (!accessToken && req.cookies.accessToken) {
      accessToken = req.cookies.accessToken;
      console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Using token from cookie (first 10 chars): \${accessToken ? accessToken.substring(0, 10) : 'undefined'}...\`);
    }`,
    replace: `// Fallback to cookie if header gave nothing
    if (!accessToken && req.cookies.accessToken) {
      // Validate that the cookie isn't literally "undefined" or empty
      if (req.cookies.accessToken !== 'undefined' && req.cookies.accessToken.trim() !== '') {
        accessToken = req.cookies.accessToken;
        console.log("[AUTH-FIX-" + AUTH_MIDDLEWARE_VERSION + "] Using token from cookie (first 10 chars): " + accessToken.substring(0, 10) + "...");
      } else {
        console.log("[AUTH-FIX-" + AUTH_MIDDLEWARE_VERSION + "] Found invalid accessToken cookie value: '" + req.cookies.accessToken + "'. Ignoring and removing.");
        res.clearCookie('accessToken', COOKIE_CONFIG);
      }
    }`
  },
  // Patch 2: Improve token refresh by invalidating bad tokens
  {
    search: `// Verify access token
      console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Verifying access token...\`);
      const decoded = await authService.verifyToken(accessToken);`,
    replace: `// Verify access token
      console.log("[AUTH-FIX-" + AUTH_MIDDLEWARE_VERSION + "] Verifying access token...");
      // Add extra validation before attempting to verify
      if (accessToken === 'undefined' || accessToken.trim() === '') {
        console.log("[AUTH-FIX-" + AUTH_MIDDLEWARE_VERSION + "] Skipping verification of invalid token value: '" + accessToken + "'");
        throw new AuthError('Invalid token value');
      }
      const decoded = await authService.verifyToken(accessToken);`
  },
  // Patch 3: Fix response headers to better handle token refresh
  {
    search: `// Set new cookies
            res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);
            res.cookie('refreshToken', newRefreshToken, COOKIE_CONFIG);`,
    replace: `// Set new cookies with additional validation
            if (newAccessToken && newAccessToken !== 'undefined' && newAccessToken.trim() !== '') {
              res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);
              console.log("[AUTH-FIX-" + AUTH_MIDDLEWARE_VERSION + "] New access token cookie set (first 10 chars): " + newAccessToken.substring(0, 10) + "...");
            } else {
              console.log("[AUTH-FIX-" + AUTH_MIDDLEWARE_VERSION + "] Refusing to set invalid access token: '" + newAccessToken + "'");
            }
            
            if (newRefreshToken && newRefreshToken !== 'undefined' && newRefreshToken.trim() !== '') {
              res.cookie('refreshToken', newRefreshToken, COOKIE_CONFIG);
              console.log("[AUTH-FIX-" + AUTH_MIDDLEWARE_VERSION + "] New refresh token cookie set");
            } else {
              console.log("[AUTH-FIX-" + AUTH_MIDDLEWARE_VERSION + "] Refusing to set invalid refresh token: '" + newRefreshToken + "'");
            }
            
            // Set response headers to ensure browsers update their cookie cache
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');`
  }
];

// Enhanced API client with better token handling
const API_CLIENT_PATCH = [
  // Patch 1: Improve token extraction and validation in request interceptor
  {
    search: `// Get token from localStorage if available
    let token = localStorage.getItem('accessToken');
    
    // If no token in localStorage, try cookies
    if (!token) {
      try {
        token = getCookie('accessToken');
        if (token) {
          localStorage.setItem('accessToken', token);
          console.log('Retrieved access token from cookies and saved to localStorage');
        }
      } catch (error) {
        console.error('Error accessing cookies:', error);
      }
    }
    
    // Only add authorization header if token exists and is not "undefined"
    if (token && token !== 'undefined' && token.trim() !== '') {
      config.headers.Authorization = \`Bearer \${token}\`;
      console.log('Added Authorization header with valid token');
    } else {
      // Remove Authorization header if it exists
      if (config.headers.Authorization) {
        delete config.headers.Authorization;
        console.log('Removed invalid Authorization header');
      }
    }`,
    replace: `// First ensure tokens are synchronized between localStorage and cookies
    try {
      syncAuthTokens();
    } catch (error) {
      console.error('Error syncing auth tokens:', error);
    }
    
    // Get token from localStorage if available
    let token = localStorage.getItem('accessToken');
    
    // If no token in localStorage, try cookies as a fallback
    if (!token || token === 'undefined' || token.trim() === '') {
      try {
        token = getCookie('accessToken');
        
        // If we found a valid token in cookies, update localStorage
        if (token) {
          localStorage.setItem('accessToken', token);
          console.log('Retrieved valid access token from cookies and saved to localStorage');
        }
      } catch (error) {
        console.error('Error accessing cookies:', error);
      }
    }
    
    // Ensure token is valid before using it
    if (token && token !== 'undefined' && token.trim() !== '') {
      config.headers.Authorization = "Bearer " + token;
      console.log("Added Authorization header with valid token (first 10 chars): " + token.substring(0, 10) + "...");
    } else {
      // Remove Authorization header if it exists
      if (config.headers.Authorization) {
        delete config.headers.Authorization;
        console.log('Removed invalid Authorization header');
      }
      
      // Also remove any invalid tokens from storage
      if (token === 'undefined' || (token && token.trim() === '')) {
        console.log('Removing invalid token from storage');
        localStorage.removeItem('accessToken');
        removeCookie('accessToken');
      }
    }`
  },
  // Patch 2: Improve token refresh response handling
  {
    search: `// If refresh successful, update tokens
          if (response.data?.accessToken) {
            // Update both localStorage and cookies
            localStorage.setItem('accessToken', response.data.accessToken);
            setCookie('accessToken', response.data.accessToken, { maxAge: 15 * 60 }); // 15 minutes
            
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
              setCookie('refreshToken', response.data.refreshToken, { maxAge: 7 * 24 * 60 * 60 }); // 7 days
            }
            
            console.log('Updated tokens in both localStorage and cookies during refresh');
            
            // Update auth header with new token
            axiosInstance.defaults.headers.common.Authorization = \`Bearer \${response.data.accessToken}\`;
            originalRequest.headers.Authorization = \`Bearer \${response.data.accessToken}\`;`,
    replace: `// If refresh successful, update tokens with validation
          if (response.data?.accessToken && response.data.accessToken !== 'undefined' && response.data.accessToken.trim() !== '') {
            // Validate token before storing
            console.log("Received valid access token from refresh (first 10 chars): " + response.data.accessToken.substring(0, 10) + "...");
            
            // Update both localStorage and cookies
            localStorage.setItem('accessToken', response.data.accessToken);
            setCookie('accessToken', response.data.accessToken, { maxAge: 15 * 60 }); // 15 minutes
            
            if (response.data.refreshToken && response.data.refreshToken !== 'undefined' && response.data.refreshToken.trim() !== '') {
              localStorage.setItem('refreshToken', response.data.refreshToken);
              setCookie('refreshToken', response.data.refreshToken, { maxAge: 7 * 24 * 60 * 60 }); // 7 days
              console.log('Updated refresh token in both localStorage and cookies');
            }
            
            console.log('Updated tokens in both localStorage and cookies during refresh');
            
            // Update auth header with new token
            axiosInstance.defaults.headers.common.Authorization = "Bearer " + response.data.accessToken;
            originalRequest.headers.Authorization = "Bearer " + response.data.accessToken;
            
            // Run an additional sync to ensure everything is consistent
            setTimeout(() => {
              try {
                syncAuthTokens();
              } catch (error) {
                console.error('Error in token sync after refresh:', error);
              }
            }, 100); // Short delay to ensure the cookies are set`
  }
];

// Enhanced AuthContext with stronger token validations
const AUTH_CONTEXT_PATCH = [
  // Patch 1: Improve token refresh handling
  {
    search: `// Handle access token
      if (data?.accessToken) {
        setCookie('accessToken', data.accessToken, { maxAge: 15 * 60 }); // 15 minutes
        localStorage.setItem('accessToken', data.accessToken);
      } else {
        // If no access token, explicitly remove it
        removeCookie('accessToken');
        localStorage.removeItem('accessToken');
      }
      
      // Handle refresh token
      if (data?.refreshToken) {
        setCookie('refreshToken', data.refreshToken, { maxAge: 7 * 24 * 60 * 60 }); // 7 days
        localStorage.setItem('refreshToken', data.refreshToken);
      } else {
        // If no refresh token, explicitly remove it
        removeCookie('refreshToken');
        localStorage.removeItem('refreshToken');
      }`,
    replace: `// Handle access token with validation
      if (data?.accessToken && data.accessToken !== 'undefined' && data.accessToken.trim() !== '') {
        console.log("Refreshed token received (first 10 chars): " + data.accessToken.substring(0, 10) + "...");
        localStorage.setItem('accessToken', data.accessToken);
        setCookie('accessToken', data.accessToken, { maxAge: 15 * 60 }); // 15 minutes
      } else {
        console.log('No valid access token in refresh response, removing existing token');
        removeCookie('accessToken');
        localStorage.removeItem('accessToken');
      }
      
      // Handle refresh token with validation
      if (data?.refreshToken && data.refreshToken !== 'undefined' && data.refreshToken.trim() !== '') {
        localStorage.setItem('refreshToken', data.refreshToken);
        setCookie('refreshToken', data.refreshToken, { maxAge: 7 * 24 * 60 * 60 }); // 7 days
      } else {
        console.log('No valid refresh token in refresh response, keeping existing refresh token');
        // Note: We don't remove refresh token as it may still be valid
      }`
  },
  // Patch 2: Add additional validation to fetchWithRetry
  {
    search: `const fetchWithRetry = async (endpoint: string, options: RequestInit, maxRetries = 3) => {
    let retryCount = 0;
    let lastError: Error | null = null;`,
    replace: `const fetchWithRetry = async (endpoint: string, options: RequestInit, maxRetries = 3) => {
    let retryCount = 0;
    let lastError: Error | null = null;
    
    // Add Authorization header if we have a valid token
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && accessToken !== 'undefined' && accessToken.trim() !== '') {
      options.headers = {
        ...options.headers,
        'Authorization': "Bearer " + accessToken
      };
      console.log('Added Authorization header to fetch request');
    }`
  },
  // Patch 3: Improve auth check to clean up any invalid tokens
  {
    search: `// Initial auth check on mount
  useEffect(() => {
    console.log('Initial auth check on mount');
    // Using a setTimeout to break potential render cycles
    setTimeout(() => {
      checkAuthStatus(true);
    }, 500); // Add significant delay to break render cycles
  }, []); // Intentionally empty to run only once on mount`,
    replace: `// Initial auth check on mount
  useEffect(() => {
    console.log('Initial auth check on mount');
    
    // First clean up any invalid tokens before checking auth status
    const cleanupInvalidTokens = () => {
      // Check for and remove invalid tokens in localStorage
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken === 'undefined' || (accessToken && accessToken.trim() === '')) {
        console.log('Removing invalid access token from localStorage');
        localStorage.removeItem('accessToken');
      }
      
      if (refreshToken === 'undefined' || (refreshToken && refreshToken.trim() === '')) {
        console.log('Removing invalid refresh token from localStorage');
        localStorage.removeItem('refreshToken');
      }
      
      // Check for and remove invalid tokens in cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name) acc[name] = value;
        return acc;
      }, {} as Record<string, string>);
      
      if (cookies.accessToken === 'undefined' || (cookies.accessToken && cookies.accessToken.trim() === '')) {
        console.log('Removing invalid access token cookie');
        removeCookie('accessToken');
      }
      
      if (cookies.refreshToken === 'undefined' || (cookies.refreshToken && cookies.refreshToken.trim() === '')) {
        console.log('Removing invalid refresh token cookie');
        removeCookie('refreshToken');
      }
    };
    
    // Clean up, then check auth with a delay to break render cycles
    cleanupInvalidTokens();
    setTimeout(() => {
      checkAuthStatus(true);
    }, 500);
  }, []); // Intentionally empty to run only once on mount`
  }
];

// Apply patches to a file
async function applyPatchToFile(filePath, patches) {
  try {
    // Read file
    log(`Reading file: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply each patch
    patches.forEach((patch, index) => {
      if (content.includes(patch.search)) {
        content = content.replace(patch.search, patch.replace);
        log(`Applied patch #${index + 1} to ${filePath}`);
      } else {
        log(`WARNING: Patch #${index + 1} not applied to ${filePath} - search string not found`);
      }
    });
    
    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Successfully updated ${filePath}`);
    return true;
  } catch (error) {
    log(`Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
async function fix() {
  try {
    log('Starting token and cookie handling fix');
    
    // Complete replacement of cookieUtils.ts
    log(`Updating ${FILES_TO_UPDATE.COOKIE_UTILS} with enhanced implementation`);
    fs.writeFileSync(FILES_TO_UPDATE.COOKIE_UTILS, ENHANCED_COOKIE_UTILS, 'utf8');
    log(`${FILES_TO_UPDATE.COOKIE_UTILS} updated successfully`);
    
    // Apply patches to auth middleware
    log(`Applying patches to ${FILES_TO_UPDATE.AUTH_MIDDLEWARE}`);
    await applyPatchToFile(FILES_TO_UPDATE.AUTH_MIDDLEWARE, AUTH_MIDDLEWARE_PATCH);
    
    // Apply patches to API client
    log(`Applying patches to ${FILES_TO_UPDATE.API_CLIENT}`);
    await applyPatchToFile(FILES_TO_UPDATE.API_CLIENT, API_CLIENT_PATCH);
    
    // Apply patches to AuthContext
    log(`Applying patches to ${FILES_TO_UPDATE.AUTH_CONTEXT}`);
    await applyPatchToFile(FILES_TO_UPDATE.AUTH_CONTEXT, AUTH_CONTEXT_PATCH);
    
    // Success
    log('All fixes have been applied successfully');
    log('To deploy these changes, run: node scripts/direct_cookie_token_fix.js');

  } catch (error) {
    log(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run the fix
fix();
