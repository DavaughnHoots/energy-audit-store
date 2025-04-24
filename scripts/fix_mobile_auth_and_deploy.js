/**
 * Mobile Authentication Fix and Deployment Script
 * 
 * This script implements the changes outlined in the enhanced mobile authentication fix plan
 * and deploys them to Heroku. It addresses the issue of mobile devices experiencing authentication
 * failures when accessing the dashboard.
 * 
 * The fixes include:
 * 1. Improved token validation in apiClient.ts
 * 2. Enhanced mobile cookie strategy in cookieUtils.ts
 * 3. Better token synchronization between localStorage and cookies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_CLIENT_PATH = path.join(process.cwd(), 'src/services/apiClient.ts');
const COOKIE_UTILS_PATH = path.join(process.cwd(), 'src/utils/cookieUtils.ts');
const DEPLOYMENT_BRANCH = 'fix/user-dashboard';
const LOG_FILE = path.join(process.cwd(), 'mobile_auth_fix_deployment.log');

// Setup logging
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
};

// Initialize log file
fs.writeFileSync(LOG_FILE, `Mobile Authentication Fix Deployment Log (${new Date().toISOString()})\n\n`);

log('Starting mobile authentication fix deployment');

// Function to backup a file before making changes
const backupFile = (filePath) => {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  log(`Backed up ${filePath} to ${backupPath}`);
  return backupPath;
};

// Function to update the API client with improved token validation
const updateApiClient = () => {
  log('Updating API client with improved token validation...');
  
  // Backup the file
  const backupPath = backupFile(API_CLIENT_PATH);
  
  try {
    // Read the file
    let content = fs.readFileSync(API_CLIENT_PATH, 'utf8');
    
    // Replace the authorization header setting logic
    // Original pattern includes conditional logic for setting auth header
    const authHeaderPattern = /\/\/\s*Only add authorization header if token exists[\s\S]*?config\.headers\.Authorization[\s\S]*?\}/;
    const improvedAuthHeaderLogic = `// Only add authorization header if token exists and is not "undefined"
    if (token && token !== 'undefined' && token.trim() !== '') {
      config.headers.Authorization = \`Bearer \${token}\`;
      console.log(\`Added Authorization header with valid token: Bearer \${token.substring(0, 10)}...\`);
    } else {
      // Remove Authorization header if it exists (prevents sending "Bearer " with no token)
      if (config.headers.Authorization) {
        delete config.headers.Authorization;
        console.log('Removed invalid Authorization header');
      }
    }`;
    
    // Apply the replacement
    content = content.replace(authHeaderPattern, improvedAuthHeaderLogic);
    
    // Write the updated content back to the file
    fs.writeFileSync(API_CLIENT_PATH, content);
    log('Successfully updated API client with improved token validation');
  } catch (error) {
    log(`Error updating API client: ${error.message}`);
    log('Restoring from backup...');
    fs.copyFileSync(backupPath, API_CLIENT_PATH);
    throw error;
  }
};

// Function to update cookie utils with improved mobile handling
const updateCookieUtils = () => {
  log('Updating cookie utils with improved mobile handling...');
  
  // Backup the file
  const backupPath = backupFile(COOKIE_UTILS_PATH);
  
  try {
    // Read the file
    let content = fs.readFileSync(COOKIE_UTILS_PATH, 'utf8');
    
    // Update the setCookie function
    const setCookiePattern = /export function setCookie\([^{]*{[\s\S]*?return false;\s*}\s*}/;
    const improvedSetCookieFunc = `export function setCookie(name, value, opts = {}, retryCount = 0) {
  // Never set cookies to undefined or empty values
  if (!isValidToken(value)) {
    console.warn("⚠️ Invalid cookie value for " + name + ", not setting");
    return false;
  }

  // Check for mobile and adjust strategy
  const isMobile = isMobileDevice();
  
  // On mobile, ALWAYS try localStorage first as primary storage
  if (isMobile) {
    try {
      localStorage.setItem(name, value);
      console.log(\`📱 Mobile detected, stored \${name} in localStorage\`);
    } catch (lsError) {
      console.error('📱 Mobile localStorage storage failed:', lsError);
    }
  }
  
  // Set sameSite value based on device type
  const sameSiteValue = isMobile ? 'none' : 'lax';
  // Add secure flag for 'none' SameSite
  const secureFlag = sameSiteValue === 'none';
  
  console.log(\`📱 Device is \${isMobile ? 'mobile' : 'desktop'}, using SameSite=\${sameSiteValue}, secure=\${secureFlag}\`);

  try {
    document.cookie = serialize(name, value, {
      path: '/',
      sameSite: sameSiteValue,
      secure: secureFlag || opts.secure,
      ...opts,
    });
    
    // Verify the cookie was actually set
    const cookies = parseCookies();
    if (cookies[name] === value) {
      console.log("✅ Cookie set successfully: " + name);
      return true;
    } else {
      console.warn("⚠️ Cookie verification failed for " + name);
      
      // For mobile, consider localStorage success as overall success
      if (isMobile && localStorage.getItem(name) === value) {
        console.log("📱 Using localStorage fallback on mobile as primary");
        return true;
      }
      
      // Retry up to 2 times if setting failed
      if (retryCount < 2) {
        console.log(\`🔄 Retrying cookie set (attempt \${retryCount + 1})...\`);
        // Wait a bit and retry
        setTimeout(() => {
          setCookie(name, value, opts, retryCount + 1);
        }, 100);
      } else {
        console.error(\`❌ Failed to set cookie \${name} after \${retryCount} retries\`);
      }
      return false;
    }
  } catch (error) {
    console.error(\`❌ Error setting cookie \${name}:\`, error);
    return false;
  }
}`;
    
    // Apply the replacement
    content = content.replace(setCookiePattern, improvedSetCookieFunc);
    
    // Update the syncAuthTokens function
    const syncTokensPattern = /export function syncAuthTokens\([^{]*{[\s\S]*?return false;\s*}\s*}/;
    const improvedSyncTokensFunc = `export function syncAuthTokens(forceSync = false) {
  try {
    console.log(\`🔄 Syncing auth tokens\${forceSync ? ' (forced)' : ''}...\`);
    
    // Get tokens from all sources
    const cookies = parseCookies();
    // Use item() to avoid exceptions
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Always check and clean cookie values first
    if (cookies.accessToken && !isValidToken(cookies.accessToken)) {
      console.log('🧹 Removing invalid accessToken cookie:', cookies.accessToken);
      removeCookie('accessToken');
    }
    
    if (cookies.refreshToken && !isValidToken(cookies.refreshToken)) {
      console.log('🧹 Removing invalid refreshToken cookie:', cookies.refreshToken);
      removeCookie('refreshToken');
    }
    
    // Then check localStorage values
    if (accessToken && !isValidToken(accessToken)) {
      console.log('🧹 Removing invalid accessToken from localStorage:', accessToken);
      localStorage.removeItem('accessToken');
    }
    
    if (refreshToken && !isValidToken(refreshToken)) {
      console.log('🧹 Removing invalid refreshToken from localStorage:', refreshToken);
      localStorage.removeItem('refreshToken');
    }
    
    // Re-read values after cleanup
    const updatedCookies = parseCookies();
    const hasValidAccessTokenInCookies = updatedCookies.accessToken && isValidToken(updatedCookies.accessToken);
    const hasValidRefreshTokenInCookies = updatedCookies.refreshToken && isValidToken(updatedCookies.refreshToken);
    
    // Re-read localStorage after cleanup
    const updatedAccessToken = localStorage.getItem('accessToken');
    const updatedRefreshToken = localStorage.getItem('refreshToken');
    const hasValidAccessTokenInLS = updatedAccessToken && isValidToken(updatedAccessToken);
    const hasValidRefreshTokenInLS = updatedRefreshToken && isValidToken(updatedRefreshToken);
    
    // Priority logic for mobile vs desktop
    const isMobile = isMobileDevice();
    let finalAccessToken = null;
    let finalRefreshToken = null;
    
    if (isMobile) {
      // On mobile, prefer localStorage with cookie fallback
      finalAccessToken = hasValidAccessTokenInLS ? updatedAccessToken : 
                        (hasValidAccessTokenInCookies ? updatedCookies.accessToken : null);
                        
      finalRefreshToken = hasValidRefreshTokenInLS ? updatedRefreshToken : 
                         (hasValidRefreshTokenInCookies ? updatedCookies.refreshToken : null);
    } else {
      // On desktop, prefer cookies with localStorage fallback
      finalAccessToken = hasValidAccessTokenInCookies ? updatedCookies.accessToken : 
                        (hasValidAccessTokenInLS ? updatedAccessToken : null);
                        
      finalRefreshToken = hasValidRefreshTokenInCookies ? updatedCookies.refreshToken : 
                         (hasValidRefreshTokenInLS ? updatedRefreshToken : null);
    }
    
    // Apply the final tokens to both storage mechanisms
    console.log('🔄 Synchronizing with final token values:',
      finalAccessToken ? 'Access token present' : 'No valid access token',
      finalRefreshToken ? 'Refresh token present' : 'No valid refresh token',
      isMobile ? '(Mobile strategy)' : '(Desktop strategy)');
    
    // Always set (or clear) both storage mechanisms when doing a force sync
    if (finalAccessToken) {
      localStorage.setItem('accessToken', finalAccessToken);
      setCookie('accessToken', finalAccessToken, { maxAge: 15 * 60 });
    } else {
      localStorage.removeItem('accessToken');
      removeCookie('accessToken');
    }
    
    if (finalRefreshToken) {
      localStorage.setItem('refreshToken', finalRefreshToken);
      setCookie('refreshToken', finalRefreshToken, { maxAge: 7 * 24 * 60 * 60 });
    } else {
      localStorage.removeItem('refreshToken');
      removeCookie('refreshToken');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error syncing tokens:', error);
    return false;
  }
}`;
    
    // Apply the replacement
    content = content.replace(syncTokensPattern, improvedSyncTokensFunc);
    
    // Write the updated content back to the file
    fs.writeFileSync(COOKIE_UTILS_PATH, content);
    log('Successfully updated cookie utils with improved mobile handling');
  } catch (error) {
    log(`Error updating cookie utils: ${error.message}`);
    log('Restoring from backup...');
    fs.copyFileSync(backupPath, COOKIE_UTILS_PATH);
    throw error;
  }
};

// Function to build and deploy the application
const buildAndDeploy = () => {
  log('Building and deploying the application...');
  
  try {
    // Add changes to git
    log('Adding changes to git...');
    execSync('git add -A', { stdio: 'inherit' });
    
    // Commit changes
    log('Committing changes...');
    execSync('git commit -m "Fix: Mobile authentication issues for improved cross-device support"', { stdio: 'inherit' });
    
    // Build the application
    log('Building the application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Deploy to Heroku
    log('Deploying to Heroku...');
    execSync(`git push heroku ${DEPLOYMENT_BRANCH}:master -f`, { stdio: 'inherit' });
    
    log('Successfully deployed the mobile authentication fix to Heroku');
  } catch (error) {
    log(`Error during build and deploy: ${error.message}`);
    throw error;
  }
};

// Main execution
try {
  log('Mobile authentication fix started');
  
  // Step 1: Update API client
  updateApiClient();
  
  // Step 2: Update cookie utils
  updateCookieUtils();
  
  // Step 3: Build and deploy
  buildAndDeploy();
  
  log('Mobile authentication fix completed successfully');
  log('Remember to test on multiple mobile devices and browsers');
  log('Suggested testing matrix:');
  log('1. iOS Safari');
  log('2. Chrome for Android');
  log('3. Samsung Internet');
  log('4. Firefox for Mobile');
} catch (error) {
  log(`Mobile authentication fix failed: ${error.message}`);
  log('Please review the error and try again');
  process.exit(1);
}
