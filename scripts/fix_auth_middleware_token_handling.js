/**
 * Script to fix authentication middleware token handling issues
 * This addresses the issue where 'undefined' tokens are causing authentication failures
 * 
 * Problem: 
 * - When Authorization header is 'Bearer' with no token, req.headers.authorization?.split(' ')[1] returns undefined
 * - Undefined is passed to verifyToken() causing an error
 * - Also fixes frontend API client and token refresh handling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/auth-middleware-token-handling';
const COMMIT_MESSAGE = 'Fix auth middleware token handling to prevent dashboard errors';

// File paths
const AUTH_MIDDLEWARE_PATH = 'backend/src/middleware/auth.ts';
const COOKIE_UTILS_PATH = 'src/utils/cookieUtils.ts';
const API_CLIENT_PATH = 'src/services/apiClient.ts';
const AUTH_CONTEXT_PATH = 'src/context/AuthContext.tsx';

console.log('Starting auth middleware token handling fix...');

// Create new branch if it doesn't exist
try {
  console.log(`Creating branch: ${BRANCH_NAME}`);
  execSync(`git checkout -b ${BRANCH_NAME}`);
} catch (error) {
  console.log(`Branch ${BRANCH_NAME} might already exist, continuing...`);
  try {
    execSync(`git checkout ${BRANCH_NAME}`);
  } catch (checkoutError) {
    console.error(`Failed to switch to branch ${BRANCH_NAME}:`, checkoutError.message);
    process.exit(1);
  }
}

// Install required dependencies
console.log('Installing required dependencies...');
try {
  execSync('npm install cookie @types/cookie --save');
} catch (error) {
  console.warn('Failed to install dependencies. You may need to install them manually.', error.message);
}

// Read and update AUTH_MIDDLEWARE_PATH
console.log(`Updating ${AUTH_MIDDLEWARE_PATH}...`);
try {
  let authMiddlewareContent = fs.readFileSync(AUTH_MIDDLEWARE_PATH, 'utf8');
  
  // Replace token extraction
  const oldTokenExtraction = /const accessToken = req\.cookies\.accessToken \|\| req\.headers\.authorization\?\.(split\('\s+')\[1\]|split\(' '\)\[1\]);/;
  const newTokenExtraction = `// Parse the Authorization header only if it truly is "Bearer <token>"
  let accessToken: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[1].trim()) {
      accessToken = parts[1].trim();
    }
  }

  // Fallback to cookie if header gave nothing
  if (!accessToken && req.cookies.accessToken) {
    accessToken = req.cookies.accessToken;
  }`;
  
  // Update file content
  authMiddlewareContent = authMiddlewareContent.replace(oldTokenExtraction, newTokenExtraction);
  
  // Write updated content back to file
  fs.writeFileSync(AUTH_MIDDLEWARE_PATH, authMiddlewareContent);
  console.log(`✅ Updated ${AUTH_MIDDLEWARE_PATH}`);
} catch (error) {
  console.error(`Failed to update ${AUTH_MIDDLEWARE_PATH}:`, error.message);
}

// Update COOKIE_UTILS_PATH
console.log(`Updating ${COOKIE_UTILS_PATH}...`);
try {
  let cookieUtilsContent = fs.readFileSync(COOKIE_UTILS_PATH, 'utf8');
  
  // Check if setCookie function already exists
  if (!cookieUtilsContent.includes('setCookie')) {
    // Add the serialize import if needed
    if (!cookieUtilsContent.includes('import { serialize')) {
      cookieUtilsContent = cookieUtilsContent.replace(
        /^import/,
        'import { serialize, CookieSerializeOptions } from \'cookie\';\nimport'
      );
    }
    
    // Add setCookie function
    const setCookieFunction = `
/**
 * Set a cookie with proper serialization and guards against falsy values
 * @param name - Cookie name
 * @param value - Cookie value (will be skipped if falsy)
 * @param opts - Cookie options
 */
export const setCookie = (
  name: string,
  value: string | undefined | null,
  opts: CookieSerializeOptions = {}
) => {
  if (!value) return;  // Skip falsy values (null, undefined, empty string)
  document.cookie = serialize(name, value, {
    path: '/',
    sameSite: 'strict',
    ...opts,
  });
};
`;
    
    // Append the function to the end of the file
    cookieUtilsContent += setCookieFunction;
    
    // Write updated content back to file
    fs.writeFileSync(COOKIE_UTILS_PATH, cookieUtilsContent);
    console.log(`✅ Updated ${COOKIE_UTILS_PATH}`);
  } else {
    console.log(`setCookie function already exists in ${COOKIE_UTILS_PATH}, skipping.`);
  }
} catch (error) {
  console.error(`Failed to update ${COOKIE_UTILS_PATH}:`, error.message);
}

// Update API_CLIENT_PATH
console.log(`Updating ${API_CLIENT_PATH}...`);
try {
  let apiClientContent = fs.readFileSync(API_CLIENT_PATH, 'utf8');
  
  // Add consecutive401 counter if not exists
  if (!apiClientContent.includes('consecutive401')) {
    apiClientContent = apiClientContent.replace(
      /const axiosInstance = axios\.create\(/,
      '// Counter for consecutive 401 errors to prevent infinite loops\nlet consecutive401 = 0;\n\nconst axiosInstance = axios.create('
    );
  }
  
  // Update authorization header setting
  const oldHeaderSetting = /config\.headers\.Authorization = `Bearer \${token}`;/;
  const newHeaderSetting = '// Only add authorization header if token exists\n    if (token) {\n      config.headers.Authorization = `Bearer ${token}`;\n    }';
  
  // Replace header setting
  apiClientContent = apiClientContent.replace(oldHeaderSetting, newHeaderSetting);
  
  // Add loop protection in response interceptor
  const responseInterceptorPattern = /if \(error\.response\?\.status === 401 && !originalRequest\._retry\) {/;
  const loopProtection = 'if (error.response?.status === 401 && !originalRequest._retry) {\n    originalRequest._retry = true;\n    consecutive401++;\n    \n    // If we\'ve had too many consecutive 401s, redirect to login instead of retrying\n    if (consecutive401 >= 2) {\n      consecutive401 = 0; // Reset counter\n      \n      // Redirect to login\n      if (typeof window !== \'undefined\') {\n        console.log(\'Too many consecutive auth failures, redirecting to login\');\n        localStorage.setItem(\'authRedirect\', window.location.pathname);\n        window.location.href = \'/sign-in\';\n        return Promise.reject(error);\n      }\n    }';
  
  apiClientContent = apiClientContent.replace(responseInterceptorPattern, loopProtection);
  
  // Add counter reset for non-401 errors
  const elsePattern = /} else {/;
  const resetCounter = '} else if (error.response?.status !== 401) {\n    // Reset counter for non-401 errors\n    consecutive401 = 0;\n  } else {';
  
  apiClientContent = apiClientContent.replace(elsePattern, resetCounter);
  
  // Write updated content back to file
  fs.writeFileSync(API_CLIENT_PATH, apiClientContent);
  console.log(`✅ Updated ${API_CLIENT_PATH}`);
} catch (error) {
  console.error(`Failed to update ${API_CLIENT_PATH}:`, error.message);
}

// Update AUTH_CONTEXT_PATH
console.log(`Updating ${AUTH_CONTEXT_PATH}...`);
try {
  let authContextContent = fs.readFileSync(AUTH_CONTEXT_PATH, 'utf8');
  
  // Update the refreshToken function to use setCookie
  const importPattern = /import \{[^}]+\} from '\@\/utils\/cookieUtils';/;
  
  if (authContextContent.match(importPattern)) {
    // Update existing import
    authContextContent = authContextContent.replace(
      importPattern,
      "import { getCookie, setCookie } from '@/utils/cookieUtils';"
    );
  } else {
    // Add new import
    authContextContent = authContextContent.replace(
      /import .+ from /,
      "import { getCookie, setCookie } from '@/utils/cookieUtils';\nimport "
    );
  }
  
  // Update the token handling in refreshToken function
  const refreshFuncPattern = /const refreshToken = async \(\) => \{[\s\S]+?\};/;
  const updatedRefreshFunc = `const refreshToken = async () => {\n    if (isRefreshing) return false;\n    isRefreshing = true;\n\n    try {\n      console.log('Attempting token refresh');\n      const refreshResponse = await fetchWithRetry(\n        API_ENDPOINTS.AUTH.REFRESH,\n        {\n          method: 'POST',\n        }\n      );\n\n      if (!refreshResponse.ok) {\n        throw new Error('Token refresh failed');\n      }\n\n      // Parse the response to get the new tokens\n      const data = await refreshResponse.json();\n\n      // Update cookies with the new token if present\n      if (data?.accessToken) {\n        setCookie('accessToken', data.accessToken, { maxAge: 15 * 60 }); // 15 minutes\n        localStorage.setItem('accessToken', data.accessToken);\n        \n        if (data.refreshToken) {\n          setCookie('refreshToken', data.refreshToken, { maxAge: 7 * 24 * 60 * 60 }); // 7 days\n          localStorage.setItem('refreshToken', data.refreshToken);\n        }\n        \n        console.log('Updated tokens in both cookies and localStorage');\n      }\n\n      console.log('Token refresh successful');\n      return true;\n    } catch (error) {\n      console.error('Token refresh failed:', error);\n      return false;\n    } finally {\n      isRefreshing = false;\n    }\n  };`;
  
  // Replace the refreshToken function
  authContextContent = authContextContent.replace(refreshFuncPattern, updatedRefreshFunc);
  
  // Write updated content back to file
  fs.writeFileSync(AUTH_CONTEXT_PATH, authContextContent);
  console.log(`✅ Updated ${AUTH_CONTEXT_PATH}`);
} catch (error) {
  console.error(`Failed to update ${AUTH_CONTEXT_PATH}:`, error.message);
}

console.log('\nChanges complete. Next steps:');
console.log('1. Review the changes to ensure they match your codebase');
console.log('2. Test the changes locally');
console.log('3. Commit and push the changes:');
console.log(`   git add .`);
console.log(`   git commit -m "${COMMIT_MESSAGE}"`);
console.log(`   git push origin ${BRANCH_NAME}`);
console.log('4. Create a pull request');
console.log('5. Deploy to Heroku:');
console.log(`   git push heroku ${BRANCH_NAME}:main`);
console.log('\nFor detailed deployment instructions, see:');
console.log('energy-audit-vault/operations/deployment/auth-middleware-token-handling-fix-deployment.md');
