/**
 * Token Naming Adapter Fix
 * 
 * This script updates the frontend code to handle both token naming conventions:
 * - 'token' (used in backend response)
 * - 'accessToken' (expected by frontend)
 */

const fs = require('fs');
const path = require('path');

// Create backups directory if it doesn't exist
const rootDir = process.cwd();
const backupsDir = path.join(rootDir, '.backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

// ==========================================
// 1. Update AuthContext.tsx
// ==========================================
const authContextPath = path.join(rootDir, 'src/context/AuthContext.tsx');
const authContextBackupPath = path.join(backupsDir, `AuthContext-token-fix-${Date.now()}.tsx`);

// Create backup
console.log('✅ Creating backup of AuthContext.tsx...');
fs.copyFileSync(authContextPath, authContextBackupPath);

// Read the file
let authContextContent = fs.readFileSync(authContextPath, 'utf8');

// Update the login function to handle both token and accessToken
const oldLoginCode = `  // Enhanced login function that ensures token storage
  const login = async (userData: User) => {
    console.log('Login called with user data:', userData);
    
    // Debug logs for iOS Chrome issue
    console.log('[debug] signin response JSON →', JSON.stringify(userData).slice(0, 120));
    console.log('[debug] document.cookie →', document.cookie);
    console.log('[debug] LS access →', localStorage.getItem('accessToken'));
    
    // Use setTimeout to delay localStorage writes to bypass iOS ITP restrictions
    setTimeout(() => {
      try {
        console.log('[debug] Delayed localStorage write attempt');
        if (userData.accessToken) {
          localStorage.setItem('accessToken', userData.accessToken);
          console.log('[debug] accessToken written to localStorage');
        }
        if (userData.refreshToken) {
          localStorage.setItem('refreshToken', userData.refreshToken);
          console.log('[debug] refreshToken written to localStorage');
        }
      } catch (error) {
        console.error('[debug] Failed delayed localStorage write:', error);
      }
    }, 100);`;

const newLoginCode = `  // Enhanced login function that ensures token storage
  const login = async (userData: User) => {
    console.log('Login called with user data:', userData);
    
    // Debug logs for iOS Chrome issue
    console.log('[debug] signin response JSON →', JSON.stringify(userData).slice(0, 120));
    console.log('[debug] document.cookie →', document.cookie);
    console.log('[debug] LS access →', localStorage.getItem('accessToken'));
    
    // Handle both token naming conventions (accessToken or token)
    const actualAccessToken = userData.accessToken || userData.token;
    console.log('[debug] actual token value:', actualAccessToken ? 'present' : 'missing', 
      'source:', userData.accessToken ? 'accessToken' : (userData.token ? 'token' : 'none'));
    
    // Use setTimeout to delay localStorage writes to bypass iOS ITP restrictions
    setTimeout(() => {
      try {
        console.log('[debug] Delayed localStorage write attempt');
        if (actualAccessToken) {
          localStorage.setItem('accessToken', actualAccessToken);
          console.log('[debug] accessToken written to localStorage');
        }
        if (userData.refreshToken) {
          localStorage.setItem('refreshToken', userData.refreshToken);
          console.log('[debug] refreshToken written to localStorage');
        }
      } catch (error) {
        console.error('[debug] Failed delayed localStorage write:', error);
      }
    }, 100);`;

// Replace the old login code with the new one
if (authContextContent.includes(oldLoginCode)) {
  authContextContent = authContextContent.replace(oldLoginCode, newLoginCode);
  console.log('✅ Updated login function in AuthContext.tsx');
} else {
  console.warn('⚠️ Could not find exact login function code in AuthContext.tsx');
  console.log('Searching for approximate login function pattern...');
  
  // Try a more flexible pattern match
  const loginFunctionPattern = /const login = async \(userData: User\) => \{[\s\S]*?if \(userData\.accessToken\)[\s\S]*?localStorage\.setItem\('accessToken', userData\.accessToken\);[\s\S]*?\}, \d+\);/;
  const match = authContextContent.match(loginFunctionPattern);
  
  if (match) {
    const oldCode = match[0];
    const newCode = oldCode.replace(
      /if \(userData\.accessToken\)[\s\S]*?localStorage\.setItem\('accessToken', userData\.accessToken\);/,
      "const actualAccessToken = userData.accessToken || userData.token;\n        if (actualAccessToken) {\n          localStorage.setItem('accessToken', actualAccessToken);"
    );
    
    authContextContent = authContextContent.replace(oldCode, newCode);
    console.log('✅ Updated login function in AuthContext.tsx (using pattern matching)');
  } else {
    console.error('❌ Failed to find login function pattern in AuthContext.tsx');
    process.exit(1);
  }
}

// Write the updated file
fs.writeFileSync(authContextPath, authContextContent);
console.log('✅ Saved updated AuthContext.tsx');

// ==========================================
// 2. Update cookieUtils.ts to add getAccessToken function
// ==========================================
const cookieUtilsPath = path.join(rootDir, 'src/utils/cookieUtils.ts');
const cookieUtilsBackupPath = path.join(backupsDir, `cookieUtils-token-fix-${Date.now()}.ts`);

// Create backup
console.log('\n✅ Creating backup of cookieUtils.ts...');
fs.copyFileSync(cookieUtilsPath, cookieUtilsBackupPath);

// Read the file
let cookieUtilsContent = fs.readFileSync(cookieUtilsPath, 'utf8');

// Check if getAccessToken function already exists
if (!cookieUtilsContent.includes('export function getAccessToken()')) {
  // Define the new function to add
  const getAccessTokenFunction = `
/**
 * Get access token from any storage with fallbacks
 * This handles the dual naming convention (accessToken vs token)
 */
export function getAccessToken() {
  // Check localStorage first (most reliable)
  const lsAccessToken = localStorage.getItem('accessToken');
  if (isValidToken(lsAccessToken)) return lsAccessToken;
  
  // Fall back to alternative naming in localStorage
  const lsToken = localStorage.getItem('token');
  if (isValidToken(lsToken)) return lsToken;
  
  // Then try cookies
  const cookieAccessToken = getCookie('accessToken');
  if (isValidToken(cookieAccessToken)) return cookieAccessToken;
  
  // Finally check alternative naming in cookies
  const cookieToken = getCookie('token');
  if (isValidToken(cookieToken)) return cookieToken;
  
  return null;
}
`;

  // Insert the function before export function isValidToken
  const pattern = /export function isValidToken/;
  const position = cookieUtilsContent.search(pattern);
  
  if (position !== -1) {
    cookieUtilsContent = cookieUtilsContent.slice(0, position) + 
                        getAccessTokenFunction + 
                        cookieUtilsContent.slice(position);
    console.log('✅ Added getAccessToken function to cookieUtils.ts');
  } else {
    console.error('❌ Failed to find insertion point in cookieUtils.ts');
    process.exit(1);
  }
}

// Write the updated file
fs.writeFileSync(cookieUtilsPath, cookieUtilsContent);
console.log('✅ Saved updated cookieUtils.ts');

// ==========================================
// 3. Update apiClient.ts to use the new getAccessToken function
// ==========================================
const apiClientPath = path.join(rootDir, 'src/services/apiClient.ts');
const apiClientBackupPath = path.join(backupsDir, `apiClient-token-fix-${Date.now()}.ts`);

// Create backup
console.log('\n✅ Creating backup of apiClient.ts...');
fs.copyFileSync(apiClientPath, apiClientBackupPath);

// Read the file
let apiClientContent = fs.readFileSync(apiClientPath, 'utf8');

// Update imports to include getAccessToken if needed
if (!apiClientContent.includes('getAccessToken')) {
  apiClientContent = apiClientContent.replace(
    "import { getCookie, setCookie, syncAuthTokens } from '../utils/cookieUtils';",
    "import { getCookie, setCookie, syncAuthTokens, getAccessToken } from '../utils/cookieUtils';"
  );
  console.log('✅ Updated imports in apiClient.ts');
}

// Update token retrieval logic in the request interceptor
const oldTokenLogic = `    // Get token with enhanced validation and fallbacks
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
    }`;

const newTokenLogic = `    // Get token with enhanced validation and fallbacks from any source
    // This handles both naming conventions: 'accessToken' and 'token'
    const token = getAccessToken();
    
    if (token) {
      console.log('Retrieved valid access token');
    } else {
      console.log('No valid token found in any storage');
    }`;

// Replace the old token logic with the new one
if (apiClientContent.includes(oldTokenLogic)) {
  apiClientContent = apiClientContent.replace(oldTokenLogic, newTokenLogic);
  console.log('✅ Updated token retrieval logic in apiClient.ts');
} else {
  console.warn('⚠️ Could not find exact token retrieval logic in apiClient.ts');
  console.log('Attempting approximate pattern match...');
  
  const tokenPattern = /\s+\/\/ Get token with enhanced validation[\s\S]*?No valid token found in cookies/;
  const match = apiClientContent.match(tokenPattern);
  
  if (match) {
    apiClientContent = apiClientContent.replace(match[0], newTokenLogic);
    console.log('✅ Updated token retrieval logic in apiClient.ts (using pattern matching)');
  } else {
    console.error('❌ Failed to find token retrieval logic in apiClient.ts');
    process.exit(1);
  }
}

// Update token refresh logic
const oldRefreshLogic = `          // If refresh successful, update tokens
          if (response.data?.token && isValidToken(response.data.token)) {
            // Update both localStorage and cookies
            const newAccessToken = response.data.token;
            localStorage.setItem('accessToken', newAccessToken);
            setCookie('accessToken', newAccessToken, { maxAge: 15 * 60 }); // 15 minutes`;

const newRefreshLogic = `          // Get the access token from either token or accessToken field
          const responseAccessToken = response.data?.accessToken || response.data?.token;
          
          // If refresh successful, update tokens
          if (responseAccessToken && isValidToken(responseAccessToken)) {
            // Update both localStorage and cookies
            const newAccessToken = responseAccessToken;
            localStorage.setItem('accessToken', newAccessToken);
            setCookie('accessToken', newAccessToken, { maxAge: 15 * 60 }); // 15 minutes`;

// Replace the old refresh logic with the new one
if (apiClientContent.includes(oldRefreshLogic)) {
  apiClientContent = apiClientContent.replace(oldRefreshLogic, newRefreshLogic);
  console.log('✅ Updated token refresh logic in apiClient.ts');
} else {
  console.warn('⚠️ Could not find exact token refresh logic in apiClient.ts');
  console.log('Searching for approximate refresh logic pattern...');
  
  const refreshPattern = /\/\/ If refresh successful, update tokens[\s\S]*?if \(response\.data\?\.token && isValidToken\(response\.data\.token\)\)[\s\S]*?const newAccessToken = response\.data\.token;/;
  const match = apiClientContent.match(refreshPattern);
  
  if (match) {
    const oldCode = match[0];
    const newCode = oldCode.replace(
      /if \(response\.data\?\.token && isValidToken\(response\.data\.token\)\)[\s\S]*?const newAccessToken = response\.data\.token;/,
      "const responseAccessToken = response.data?.accessToken || response.data?.token;\n\n          // If refresh successful, update tokens\n          if (responseAccessToken && isValidToken(responseAccessToken)) {\n            // Update both localStorage and cookies\n            const newAccessToken = responseAccessToken;"
    );
    
    apiClientContent = apiClientContent.replace(oldCode, newCode);
    console.log('✅ Updated token refresh logic in apiClient.ts (using pattern matching)');
  } else {
    console.error('❌ Failed to find token refresh logic pattern in apiClient.ts');
    process.exit(1);
  }
}

// Write the updated file
fs.writeFileSync(apiClientPath, apiClientContent);
console.log('✅ Saved updated apiClient.ts');

// ==========================================
// Final output
// ==========================================
console.log('\n✅ Token naming adapter fix completed successfully!');
console.log('The frontend will now handle both "token" and "accessToken" naming conventions.');
console.log('\n• AuthContext.tsx: Updated login function to handle both token names');
console.log('• cookieUtils.ts: Added getAccessToken helper that checks all possible locations');
console.log('• apiClient.ts: Updated to use new helper for more robust token handling');
