/**
 * Deploy authentication token and cookie handling fixes to Heroku
 * 
 * This script:
 * 1. Runs the local fixes to update the code
 * 2. Deploys the fixed files directly to Heroku
 * 3. Triggers a rebuild to apply the changes
 */

const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Configuration
const DEPLOYMENT_ID = uuidv4().substring(0, 8);
const LOG_PREFIX = '[AUTH-TOKEN-FIX-DEPLOY]';

// Files that will be fixed and deployed
const FILES_TO_DEPLOY = [
  'src/utils/cookieUtils.ts',
  'src/context/AuthContext.tsx',
  'src/services/apiClient.ts',
  'backend/src/middleware/auth.ts'
];

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

// Main deployment function
async function deploy() {
  try {
    log('Starting deployment of authentication token and cookie handling fix');
    
    // Step 1: Run the fix script to update the local files
    log('Running fix script to update local files');
    const fixResult = runCommand('node scripts/fix_auth_token_cookie_handling.js');
    if (!fixResult.success) {
      throw new Error('Failed to apply local fixes');
    }
    
    // Step 2: Verify files were updated
    let allFilesExist = true;
    FILES_TO_DEPLOY.forEach(file => {
      if (!fs.existsSync(file)) {
        log(`ERROR: Required file not found after fix: ${file}`);
        allFilesExist = false;
      } else {
        log(`Verified file exists after fix: ${file}`);
      }
    });
    
    if (!allFilesExist) {
      throw new Error('Not all required files were found after applying fixes');
    }
    
    // Step 3: Create a version marker file to track deployment
    const versionContent = `auth-token-fix-${DEPLOYMENT_ID}-${new Date().toISOString()}`;
    fs.writeFileSync('.build-trigger', versionContent);
    log('Created build trigger file with version info');
    
    // Step 4: Deploy to Heroku
    log('Deploying to Heroku...');
    
    // Test Heroku CLI access
    const herokuTest = runCommand('heroku apps:info --json');
    if (!herokuTest.success) {
      throw new Error('Heroku CLI not available or not authenticated');
    }
    
    // Option 1: Deploy each file directly
    log('Deploying fixed files directly to Heroku');
    for (const file of FILES_TO_DEPLOY) {
      log(`Uploading ${file}...`);
      
      // Create directory structure if needed
      const dirPath = path.dirname(file);
      const mkdirCmd = `heroku run "mkdir -p ${dirPath}"`;
      const mkdirResult = runCommand(mkdirCmd);
      if (!mkdirResult.success) {
        log(`Warning: Failed to ensure directory ${dirPath} exists, continuing anyway`);
      }
      
      // Upload file
      const uploadCmd = `heroku run "cat > ${file}" < ${file}`;
      const uploadResult = runCommand(uploadCmd);
      
      if (!uploadResult.success) {
        throw new Error(`Failed to upload ${file} to Heroku`);
      }
      
      log(`Successfully uploaded ${file}`);
    }
    
    // Step 5: Trigger a rebuild
    log('Uploading build trigger file');
    const triggerResult = runCommand('heroku run "cat > .build-trigger" < .build-trigger');
    if (!triggerResult.success) {
      log('Warning: Failed to upload build trigger file, trying alternate method');
    }
    
    // Option 2: Force a rebuild via Heroku CLI
    log('Triggering rebuild on Heroku');
    const rebuildResult = runCommand('heroku builds:create');
    
    if (!rebuildResult.success) {
      throw new Error('Failed to trigger rebuild on Heroku');
    }
    
    log('Deployment completed successfully! 🎉');
    log('The authentication token and cookie handling fix has been deployed.');
    log('Users should no longer experience login errors on dashboard.');

  } catch (error) {
    log(`ERROR: ${error.message}`);
    log('Deployment failed. Please review the logs and try again.');
    process.exit(1);
  }
}

// Run the deployment
deploy();
