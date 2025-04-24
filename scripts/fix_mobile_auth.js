/**
 * fix_mobile_auth.js
 * 
 * Script to implement Mobile Authentication Fixes
 * Fixes issues with authentication on mobile browsers by:
 * 1. Adding mobile device detection
 * 2. Using more permissive SameSite cookie settings on mobile
 * 3. Improving token validation
 * 4. Enhancing token extraction in auth middleware
 */

const fs = require('fs');
const path = require('path');

// File paths
const cookieUtilsPath = 'src/utils/cookieUtils.ts';
const apiClientPath = 'src/services/apiClient.ts';
const authMiddlewarePath = 'backend/src/middleware/auth.ts';

// Read files
const cookieUtilsContent = fs.readFileSync(cookieUtilsPath, 'utf8');
const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
const authMiddlewareContent = fs.readFileSync(authMiddlewarePath, 'utf8');

// Make backups
fs.writeFileSync(`${cookieUtilsPath}.backup`, cookieUtilsContent);
fs.writeFileSync(`${apiClientPath}.backup`, apiClientContent);
fs.writeFileSync(`${authMiddlewarePath}.backup`, authMiddlewareContent);

console.log('Created backups of all files');

// =====================================================================
// 1. Update cookieUtils.ts with mobile detection and SameSite changes
// =====================================================================

const updatedCookieUtils = cookieUtilsContent.replace(
  // Find the import statement
  'import { serialize, SerializeOptions } from \'cookie\';',
  'import { serialize, SerializeOptions } from \'cookie\';

/**
 * Detect mobile devices based on user agent
 */
export function isMobileDevice() {
  if (typeof window === \'undefined\') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}'
).replace(
  // Update setCookie function
  'export function setCookie(name, value, opts = {}, retryCount = 0) {\n  // Never set cookies to undefined or empty values\n  if (!isValidToken(value)) {\n    console.warn("⚠️ Invalid cookie value for " + name + ", not setting");\n    return false;\n  }\n\n  try {\n    document.cookie = serialize(name, value, {\n      path: \'/\',\n      sameSite: \'strict\',\n      ...opts,\n    });',
  'export function setCookie(name, value, opts = {}, retryCount = 0) {\n  // Never set cookies to undefined or empty values\n  if (!isValidToken(value)) {\n    console.warn("⚠️ Invalid cookie value for " + name + ", not setting");\n    return false;\n  }\n\n  // Check for mobile and adjust SameSite accordingly\n  const isMobile = isMobileDevice();\n  const sameSiteValue = isMobile ? \'lax\' : \'strict\';\n  console.log(`📱 Device is ${isMobile ? \'mobile\' : \'desktop\'}, using SameSite=${sameSiteValue}`);\n\n  try {\n    document.cookie = serialize(name, value, {\n      path: \'/\',\n      sameSite: sameSiteValue,\n      ...opts,\n    });'
);

// =====================================================================
// 2. Update apiClient.ts with improved token retrieval
// =====================================================================

const updatedApiClient = apiClientContent.replace(
  // Find request interceptor and replace token handling
  'axiosInstance.interceptors.request.use(\n  (config) => {\n    try {\n      // Synchronize tokens between cookies and localStorage\n      syncAuthTokens();\n    } catch (error) {\n      console.error(\'Error syncing auth tokens:\', error);\n    }\n    \n    // Get token from localStorage if available\n    let token = localStorage.getItem(\'accessToken\');\n    \n    // If no token in localStorage, try cookies\n    if (!token) {\n      try {\n        token = getCookie(\'accessToken\');\n        if (token) {\n          localStorage.setItem(\'accessToken\', token);\n          console.log(\'Retrieved access token from cookies and saved to localStorage\');\n        }\n      } catch (error) {\n        console.error(\'Error accessing cookies:\', error);\n      }\n    }\n    \n    // Only add authorization header if token exists and is not "undefined"\n    if (token && token !== \'undefined\' && token.trim() !== \'\') {\n      config.headers.Authorization = `Bearer ${token}`;\n      console.log(\'Added Authorization header with valid token\');\n    } else {\n      // Remove Authorization header if it exists\n      if (config.headers.Authorization) {\n        delete config.headers.Authorization;\n        console.log(\'Removed invalid Authorization header\');\n      }\n    }',
  'axiosInstance.interceptors.request.use(\n  (config) => {\n    try {\n      // Synchronize tokens between cookies and localStorage\n      syncAuthTokens();\n    } catch (error) {\n      console.error(\'Error syncing auth tokens:\', error);\n    }\n    \n    // Get token with enhanced validation and fallbacks\n    let token = null;\n    \n    // Try localStorage first\n    const lsToken = localStorage.getItem(\'accessToken\');\n    if (lsToken && lsToken !== \'undefined\' && lsToken.trim() !== \'\') {\n      token = lsToken;\n      console.log(\'Retrieved valid access token from localStorage\');\n    } else {\n      // Fallback to cookies\n      try {\n        const cookieToken = getCookie(\'accessToken\');\n        if (cookieToken && cookieToken !== \'undefined\' && cookieToken.trim() !== \'\') {\n          token = cookieToken;\n          // Store valid cookie token in localStorage\n          localStorage.setItem(\'accessToken\', token);\n          console.log(\'Retrieved access token from cookies and saved to localStorage\');\n        } else {\n          console.log(\'No valid token found in cookies\');\n        }\n      } catch (error) {\n        console.error(\'Error accessing cookies:\', error);\n      }\n    }\n    \n    // Only add authorization header if token exists and is not "undefined"\n    if (token && token !== \'undefined\' && token.trim() !== \'\') {\n      config.headers.Authorization = `Bearer ${token}`;\n      console.log(`Added Authorization header with valid token: Bearer ${token.substring(0, 10)}...`);\n    } else {\n      // Remove Authorization header if it exists\n      if (config.headers.Authorization) {\n        delete config.headers.Authorization;\n        console.log(\'Removed invalid Authorization header\');\n      }\n    }'
);

// =====================================================================
// 3. Update auth.ts with better token extraction from headers
// =====================================================================

const updatedAuthMiddleware = authMiddlewareContent.replace(
  // Find token extraction logic in auth middleware
  'if (authHeader && authHeader.startsWith(\'Bearer \')) {\n      const parts = authHeader.split(\' \');\n      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Auth header parts length: ${parts.length}`);\n      if (parts.length === 2 && parts[1].trim()) {\n        accessToken = parts[1].trim();\n        console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Extracted token from header (first 10 chars): ${accessToken.substring(0, 10)}...`);\n      } else {\n        console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Invalid auth header format. Parts: ${JSON.stringify(parts)}`);\n      }\n    } else {\n      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Auth header not in Bearer format or missing`);\n    }',
  'if (authHeader && authHeader.startsWith(\'Bearer \')) {\n      const parts = authHeader.split(\' \');\n      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Auth header parts length: ${parts.length}`);\n      if (parts.length === 2 && parts[1] && parts[1].trim()) {\n        accessToken = parts[1].trim();\n        console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Extracted token from header (first 10 chars): ${accessToken.substring(0, 10)}...`);\n      } else {\n        console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Invalid auth header format or empty token. Parts: ${JSON.stringify(parts)}`);\n      }\n    } else {\n      console.log(`[AUTH-FIX-${AUTH_MIDDLEWARE_VERSION}] Auth header not in Bearer format or missing`);\n    }'
);

// =====================================================================
// Write updated files
// =====================================================================

fs.writeFileSync(cookieUtilsPath, updatedCookieUtils);
fs.writeFileSync(apiClientPath, updatedApiClient);
fs.writeFileSync(authMiddlewarePath, updatedAuthMiddleware);

console.log('Mobile authentication fix applied successfully!');
console.log('Modified files:');
console.log(` - ${cookieUtilsPath}`);
console.log(` - ${apiClientPath}`);
console.log(` - ${authMiddlewarePath}`);
console.log('\nTest on staging before deploying to production.');
