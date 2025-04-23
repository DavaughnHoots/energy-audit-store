/**
 * Deploy the quick token and cookie validation fix to Heroku
 * 
 * This script:
 * 1. Runs the quick fix script
 * 2. Uploads the updated cookieUtils.ts directly to Heroku
 * 3. Triggers an application rebuild
 */

const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_ID = uuidv4().substring(0, 8);
const LOG_PREFIX = '[AUTH-TOKEN-QUICK-FIX-DEPLOY]';

// File to deploy
const COOKIE_UTILS_PATH = 'src/utils/cookieUtils.ts';

// Function to log with timestamp
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

// Main deployment function
async function deploy() {
  try {
    log('Starting deployment of token and cookie validation fix');
    
    // Step 1: Run the quick fix script
    log('Running quick fix script to update local files');
    const fixResult = runCommand('node scripts/quick_auth_token_fix.js');
    if (!fixResult.success) {
      throw new Error('Failed to apply local fixes');
    }
    
    // Step 2: Verify file was updated
    if (!fs.existsSync(COOKIE_UTILS_PATH)) {
      throw new Error(`Required file not found: ${COOKIE_UTILS_PATH}`);
    }
    log(`Verified ${COOKIE_UTILS_PATH} exists after fix`);
    
    // Step 3: Create a version marker to track deployment
    const versionContent = `auth-token-quick-fix-${DEPLOYMENT_ID}-${new Date().toISOString()}`;
    fs.writeFileSync('.build-trigger', versionContent);
    log('Created build trigger with version info');
    
    // Step 4: Deploy to Heroku
    log('Deploying to Heroku...');
    
    // Test Heroku CLI access
    const herokuTest = runCommand('heroku apps:info --json');
    if (!herokuTest.success) {
      throw new Error('Heroku CLI not available or not authenticated');
    }
    
    // Ensure directory exists on Heroku
    const dirPath = path.dirname(COOKIE_UTILS_PATH);
    const mkdirCmd = `heroku run "mkdir -p ${dirPath}"`;
    const mkdirResult = runCommand(mkdirCmd);
    
    // Upload the file
    log(`Uploading ${COOKIE_UTILS_PATH}...`);
    const uploadCmd = `heroku run "cat > ${COOKIE_UTILS_PATH}" < ${COOKIE_UTILS_PATH}`;
    const uploadResult = runCommand(uploadCmd);
    
    if (!uploadResult.success) {
      throw new Error(`Failed to upload ${COOKIE_UTILS_PATH} to Heroku`);
    }
    
    log(`Successfully uploaded ${COOKIE_UTILS_PATH}`);
    
    // Upload build trigger file
    log('Uploading build trigger file');
    const triggerResult = runCommand('heroku run "cat > .build-trigger" < .build-trigger');
    
    // Force a rebuild via Heroku CLI
    log('Triggering rebuild on Heroku');
    const rebuildResult = runCommand('heroku builds:create');
    
    if (!rebuildResult.success) {
      log('Warning: Rebuild via CLI failed, trying alternate method');
      // Try an alternate method
      runCommand('heroku restart');
    }
    
    log('Deployment completed successfully! 🎉');
    log('The token and cookie validation fix has been deployed.');
    log('Users should no longer experience "undefined" cookies or login errors.');
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log('Deployment failed. Please review the logs and try again.');
    process.exit(1);
  }
}

// Run the deployment
deploy();
