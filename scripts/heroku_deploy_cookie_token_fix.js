/**
 * Script to deploy the cookie and token handling fix to Heroku
 * This script addresses the "undefined" cookie issue and improves token handling
 * 
 * Fixed issues:
 * 1. Cookie being set to "undefined" string
 * 2. Bearer token not being properly handled in Authorization header
 * 3. Improper cookie removal
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Configuration
const DEPLOYMENT_ID = uuidv4().substring(0, 8);
const BUILD_TRIGGER_FILE = '.build-trigger';
const LOG_PREFIX = '[COOKIE-TOKEN-FIX]';

// Function to log with consistent prefix
function log(message) {
  console.log(`${LOG_PREFIX} ${message}`);
}

// Helper function to run shell commands
function runCommand(command) {
  log(`Running: ${command}`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    return { success: true, output };
  } catch (error) {
    log(`Command failed: ${error.message}`);
    return { success: false, error };
  }
}

// Helper function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`);
  }
}

// Main deployment function
async function deploy() {
  try {
    log('Starting cookie and token handling fix deployment');
    
    // Update build trigger to force Heroku to rebuild
    fs.writeFileSync(BUILD_TRIGGER_FILE, `build-trigger-${DEPLOYMENT_ID}-${new Date().toISOString()}`);
    log(`Updated build trigger: ${DEPLOYMENT_ID}`);
    
    // Make sure cookieUtils.ts has been updated
    if (!fs.existsSync('src/utils/cookieUtils.ts') || 
        !fs.readFileSync('src/utils/cookieUtils.ts', 'utf8').includes('removeCookie')) {
      throw new Error('cookieUtils.ts changes not found. Make sure to apply the fix first.');
    }
    
    // Make sure AuthContext.ts has been updated
    if (!fs.existsSync('src/context/AuthContext.tsx') || 
        !fs.readFileSync('src/context/AuthContext.tsx', 'utf8').includes('removeCookie(\'accessToken\')')) {
      throw new Error('AuthContext.tsx changes not found. Make sure to apply the fix first.');
    }
    
    // Make sure apiClient.ts has been updated
    if (!fs.existsSync('src/services/apiClient.ts') || 
        !fs.readFileSync('src/services/apiClient.ts', 'utf8').includes('token !== \'undefined\'')) {
      throw new Error('apiClient.ts changes not found. Make sure to apply the fix first.');
    }
    
    // Create a documentation file for the fix
    ensureDirectoryExists('energy-audit-vault/operations/bug-fixes');
    
    const documentationContent = `---
title: "Cookie & Token Handling Fix"
date: "${new Date().toISOString().split('T')[0]}"
status: "implemented"
type: "bug-fix"
---

# Cookie & Token Handling Fix

## Issue Description

Users reported errors when accessing the dashboard after login. Analysis of logs revealed:

1. The accessToken cookie was being set to the string "undefined" rather than being properly removed
2. The Authorization header was being set to "Bearer undefined" or "Bearer " (empty)
3. Token refresh was working but not properly applying the new tokens

## Implementation Details

### 1. Updated cookieUtils.ts
- Added a proper \`removeCookie()\` function that sets expiry to the past
- Improved \`setCookie()\` to validate tokens before setting them

### 2. Updated AuthContext.tsx
- Modified token handling to explicitly remove cookies when tokens are missing
- Ensured localStorage and cookies stay in sync during token operations

### 3. Updated apiClient.ts
- Added robust token validation before setting the Authorization header
- Added code to remove invalid Authorization headers

## Testing

The fix was verified by confirming:
- The accessToken cookie is never set to "undefined"
- API requests include proper Authorization headers or none at all
- Dashboard loads correctly after login

## Deployment ID

${DEPLOYMENT_ID}
`;

    fs.writeFileSync(
      'energy-audit-vault/operations/bug-fixes/cookie-token-handling-fix.md',
      documentationContent
    );
    log('Documentation created');
    
    // Commit changes to git
    const commitResult = runCommand(`git add .`);
    if (!commitResult.success) throw new Error('Failed to add files to git');
    
    runCommand(`git commit -m "Fix cookie & token handling issues [${DEPLOYMENT_ID}]"`);
    log('Changes committed to git');
    
    // Get current branch name
    const getBranchResult = runCommand('git rev-parse --abbrev-ref HEAD');
    if (!getBranchResult.success) throw new Error('Failed to get current branch name');
    
    // Extract the branch name from the command output
    const currentBranch = getBranchResult.output ? getBranchResult.output.toString().trim() : 'main';
    log(`Current branch: ${currentBranch}`);
    
    // Push to Heroku (use current branch to main)
    log('Pushing to Heroku...');
    const pushResult = runCommand(`git push heroku ${currentBranch}:main`);
    
    if (pushResult.success) {
      log('Deployment successful! 🎉');
      log('The cookie & token handling fix has been deployed.');
    } else {
      // Try alternate command if the first one fails
      log('First deployment attempt failed, trying alternate method...');
      const altPushResult = runCommand('git push heroku HEAD:main');
      
      if (altPushResult.success) {
        log('Deployment successful with alternate method! 🎉');
        log('The cookie & token handling fix has been deployed.');
      } else {
        throw new Error('Failed to push to Heroku');
      }
    }
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deploy();
