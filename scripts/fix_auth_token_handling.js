/**
 * This script fixes issues with token handling in the authentication flow:
 * 1. Enhances setCookie to handle cases when undefined, null, or 'undefined' is passed
 * 2. Fixes token extraction in the API client
 */

const fs = require('fs');
const path = require('path');

// Paths to files that need updating
const cookieUtilsPath = path.join(process.cwd(), 'src', 'utils', 'cookieUtils.ts');
const apiClientPath = path.join(process.cwd(), 'src', 'services', 'apiClient.ts');
const authContextPath = path.join(process.cwd(), 'src', 'context', 'AuthContext.tsx');

// Create a backup function
const createBackup = (filePath) => {
  const backupDir = path.join(process.cwd(), '.backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  const filename = path.basename(filePath);
  const backupPath = path.join(backupDir, `${filename.split('.')[0]}-token-fix-${Date.now()}.${filename.split('.').slice(1).join('.')}`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup at ${backupPath}`);
};

// Fix cookie utils
const fixCookieUtils = () => {
  console.log('Fixing cookieUtils.ts...');
  createBackup(cookieUtilsPath);
  
  let content = fs.readFileSync(cookieUtilsPath, 'utf-8');
  
  // Find the setCookie function
  const setCookieFuncRegex = /export function setCookie\([^\)]+\)[\s\S]+?(?=(\/\/|\n\n|export|function))/g;
  const setCookieFunc = content.match(setCookieFuncRegex)[0];
  
  // Update the function to handle undefined/'undefined' better
  const updatedSetCookieFunc = `export function setCookie(name, value, opts = {}) {
  // treat undefined/null/empty/"undefined"/"null" as **remove**
  if (!value || value === 'undefined' || value === 'null') {
    document.cookie = serialize(name, '', { ...opts, maxAge: -1, path: '/' });
    console.log("Removed invalid cookie value for " + name);
    return false;
  }
  document.cookie = serialize(name, value, { path: '/', ...opts });
  return true;
}`;
  
  // Replace the function
  content = content.replace(setCookieFuncRegex, updatedSetCookieFunc);
  
  fs.writeFileSync(cookieUtilsPath, content, 'utf-8');
  console.log('Fixed cookieUtils.ts');
};

// Fix API client
const fixApiClient = () => {
  console.log('Fixing apiClient.ts...');
  createBackup(apiClientPath);
  
  let content = fs.readFileSync(apiClientPath, 'utf-8');
  
  // Find the request interceptor
  const requestInterceptorRegex = /axiosInstance\.interceptors\.request\.use\([\s\S]+?\([^\)]+\)[\s\S]+?return config;[\s\S]+?\([^\)]+\)[\s\S]+?\)/g;
  const requestInterceptor = content.match(requestInterceptorRegex)[0];
  
  // Find the section that sets the Authorization header
  const authHeaderRegex = /if\s*\([^\)]+\)\s*\{[\s\S]+?config\.headers\.Authorization[\s\S]+?\}/g;
  const authHeaderSection = requestInterceptor.match(authHeaderRegex)[0];
  
  // Update the section with stronger validation
  const updatedAuthHeaderSection = `if (token && token.trim() && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = \`Bearer \${token}\`;
      console.log(\`[auth] Added Authorization header with valid token: Bearer \${token.substring(0, 10)}...\`);
    } else {
      // ALWAYS remove Authorization header in the invalid token case
      delete config.headers.Authorization;
      
      // Track and log when we prevent a "Bearer" only header
      if (token) {
        console.warn(\`[auth] Invalid token value, header stripped: "\${token}". Prevented Bearer-only header.\`);
        window.__authBearerOnly = (window.__authBearerOnly || 0) + 1;
      }
    }`;
  
  // Replace the section
  content = content.replace(authHeaderRegex, updatedAuthHeaderSection);
  
  fs.writeFileSync(apiClientPath, content, 'utf-8');
  console.log('Fixed apiClient.ts');
};

// Fix AuthContext.tsx
const fixAuthContext = () => {
  console.log('Fixing AuthContext.tsx...');
  createBackup(authContextPath);
  
  let content = fs.readFileSync(authContextPath, 'utf-8');
  
  // Fix token handling in refresh token endpoint
  const refreshTokenRegex = /const data = await refreshResponse\.json\(\);[\s\S]+?if \(data\?.token[\s\S]+?localStorage\.setItem\([^;]+;/g;
  const refreshTokenSection = content.match(refreshTokenRegex)[0];
  
  // Update to handle both token & accessToken fields
  const updatedRefreshTokenSection = `const data = await refreshResponse.json();
      console.log('Token refresh response structure:', Object.keys(data).join(', '));
      
      // Handle access token - check if token or accessToken field exists and is valid
      let tokensStored = false;
      const accessTokenValue = data?.accessToken || data?.token;
      if (accessTokenValue && isValidToken(accessTokenValue)) {
        console.log('Received valid access token, storing it');
        
        // Try to set the cookie - synchronous operation
        const cookieSet = setCookie('accessToken', accessTokenValue, { maxAge: 15 * 60 });
        
        // Also store in localStorage as backup
        try {
          localStorage.setItem('accessToken', accessTokenValue);
          console.log('Access token stored in localStorage');
          tokensStored = true;
        } catch (e) {
          console.error('Failed to store access token in localStorage:', e);
        }
      } else {
        // Log what we received for debugging
        console.warn('Invalid or missing token in refresh response');
      }`;
  
  content = content.replace(refreshTokenRegex, updatedRefreshTokenSection);
  
  fs.writeFileSync(authContextPath, content, 'utf-8');
  console.log('Fixed AuthContext.tsx');
};

try {
  // Perform all fixes
  fixCookieUtils();
  fixApiClient();
  fixAuthContext();
  
  console.log('\nAll auth token handling fixes have been applied!');
  console.log('Deploy these changes to resolve authentication cookie issues.');
} catch (error) {
  console.error('Error fixing files:', error);
  process.exit(1);
}