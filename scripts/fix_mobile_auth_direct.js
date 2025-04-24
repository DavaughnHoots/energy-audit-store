/**
 * fix_mobile_auth_direct.js
 * 
 * Script to implement Mobile Authentication Fixes directly
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
let cookieUtilsContent = fs.readFileSync(cookieUtilsPath, 'utf8');
let apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
let authMiddlewareContent = fs.readFileSync(authMiddlewarePath, 'utf8');

// Make backups
fs.writeFileSync(`${cookieUtilsPath}.backup`, cookieUtilsContent);
fs.writeFileSync(`${apiClientPath}.backup`, apiClientContent);
fs.writeFileSync(`${authMiddlewarePath}.backup`, authMiddlewareContent);

console.log('Created backups of all files');

// =====================================================================
// 1. Update cookieUtils.ts with mobile detection and SameSite changes
// =====================================================================

// Add mobile device detection function
const mobileDetectionFunction = `
/**
 * Detect mobile devices based on user agent
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}`;

// Insert after imports
const cookieImportIndex = cookieUtilsContent.indexOf("import { serialize, SerializeOptions } from 'cookie';");
const insertionIndex = cookieUtilsContent.indexOf('\n', cookieImportIndex) + 1;

cookieUtilsContent = cookieUtilsContent.slice(0, insertionIndex) + mobileDetectionFunction + cookieUtilsContent.slice(insertionIndex);

// Update setCookie function with mobile SameSite detection
let setCookieStart = cookieUtilsContent.indexOf('export function setCookie(name, value, opts = {}, retryCount = 0) {');
let setCookieDeclarationEnd = cookieUtilsContent.indexOf('{', setCookieStart) + 1;
let tryCatchStart = cookieUtilsContent.indexOf('try {', setCookieStart);

// Construct new setCookie function with mobile detection
const mobileCookieCheck = `
  // Check for mobile and adjust SameSite accordingly
  const isMobile = isMobileDevice();
  const sameSiteValue = isMobile ? 'lax' : 'strict';
  console.log(\`📱 Device is \${isMobile ? 'mobile' : 'desktop'}, using SameSite=\${sameSiteValue}\`);
`;

cookieUtilsContent = cookieUtilsContent.slice(0, tryCatchStart) + mobileCookieCheck + cookieUtilsContent.slice(tryCatchStart);

// Update cookie serialization to use dynamic sameSite value
cookieUtilsContent = cookieUtilsContent.replace(
  "sameSite: 'strict',",
  "sameSite: sameSiteValue,"
);

// =====================================================================
// 2. Update apiClient.ts with improved token retrieval
// =====================================================================

// Find the request interceptor
const requestInterceptorStart = apiClientContent.indexOf('axiosInstance.interceptors.request.use(');
const tokenHandlingStart = apiClientContent.indexOf('// Get token from localStorage if available', requestInterceptorStart);
const tokenHandlingEnd = apiClientContent.indexOf('return config;', tokenHandlingStart);

// New token handling code
const newTokenHandling = `    // Get token with enhanced validation and fallbacks
    let token = null;
    
    // Try localStorage first
    const lsToken = localStorage.getItem('accessToken');
    if (lsToken && lsToken !== 'undefined' && lsToken.trim() !== '') {
      token = lsToken;
      console.log('Retrieved valid access token from localStorage');
    } else {
      // Fallback to cookies
      try {
        const cookieToken = getCookie('accessToken');
        if (cookieToken && cookieToken !== 'undefined' && cookieToken.trim() !== '') {
          token = cookieToken;
          // Store valid cookie token in localStorage
          localStorage.setItem('accessToken', token);
          console.log('Retrieved access token from cookies and saved to localStorage');
        } else {
          console.log('No valid token found in cookies');
        }
      } catch (error) {
        console.error('Error accessing cookies:', error);
      }
    }
    
    // Only add authorization header if token exists and is not "undefined"
    if (token && token !== 'undefined' && token.trim() !== '') {
      config.headers.Authorization = \`Bearer \${token}\`;
      console.log(\`Added Authorization header with valid token: Bearer \${token.substring(0, 10)}...\`);
    } else {
      // Remove Authorization header if it exists
      if (config.headers.Authorization) {
        delete config.headers.Authorization;
        console.log('Removed invalid Authorization header');
      }
    }
    `;

// Replace token handling
apiClientContent = apiClientContent.slice(0, tokenHandlingStart) + newTokenHandling + apiClientContent.slice(tokenHandlingEnd);

// =====================================================================
// 3. Update auth.ts with better token extraction from headers
// =====================================================================

// Find auth header processing
const authHeaderStart = authMiddlewareContent.indexOf('if (authHeader && authHeader.startsWith(\'Bearer \'))'); 
const authHeaderEnd = authMiddlewareContent.indexOf('} else {', authHeaderStart) + authMiddlewareContent.slice(authHeaderStart).indexOf('}')+1;

// New auth header processing logic
const newAuthHeaderProcessing = `if (authHeader && authHeader.startsWith('Bearer ')) {
      const parts = authHeader.split(' ');
      console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Auth header parts length: \${parts.length}\`);
      if (parts.length === 2 && parts[1] && parts[1].trim()) {
        accessToken = parts[1].trim();
        console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Extracted token from header (first 10 chars): \${accessToken.substring(0, 10)}...\`);
      } else {
        console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Invalid auth header format or empty token. Parts: \${JSON.stringify(parts)}\`);
      }
    }`;

// Replace auth header processing
authMiddlewareContent = authMiddlewareContent.slice(0, authHeaderStart) + newAuthHeaderProcessing + authMiddlewareContent.slice(authHeaderEnd);

// =====================================================================
// Write updated files
// =====================================================================

fs.writeFileSync(cookieUtilsPath, cookieUtilsContent);
fs.writeFileSync(apiClientPath, apiClientContent);
fs.writeFileSync(authMiddlewarePath, authMiddlewareContent);

console.log('Mobile authentication fix applied successfully!');
console.log('Modified files:');
console.log(` - ${cookieUtilsPath}`);
console.log(` - ${apiClientPath}`);
console.log(` - ${authMiddlewarePath}`);
console.log('\nTest on staging before deploying to production.');
