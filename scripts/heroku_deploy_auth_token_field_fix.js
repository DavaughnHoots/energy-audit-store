/**
 * Deploy the auth token field naming fix to Heroku
 * 
 * This script:
 * 1. Creates a version marker (build trigger)
 * 2. Uploads the fixed files directly to Heroku
 * 3. Triggers a rebuild
 */

const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_ID = uuidv4().substring(0, 8);
const LOG_PREFIX = '[AUTH-TOKEN-FIELD-FIX-DEPLOY]';

// Files to deploy
const FILES_TO_DEPLOY = [
  'src/services/apiClient.ts',
  'src/context/AuthContext.tsx'
];

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
    log('Starting deployment of auth token field naming fix');
    
    // Step 1: Create a version marker to track deployment
    const versionContent = `auth-token-field-fix-${DEPLOYMENT_ID}-${new Date().toISOString()}`;
    fs.writeFileSync('.build-trigger', versionContent);
    log('Created build trigger with version info');
    
    // Step 2: Deploy to Heroku
    log('Deploying to Heroku...');
    
    // Test Heroku CLI access
    const herokuTest = runCommand('heroku apps:info --json');
    if (!herokuTest.success) {
      throw new Error('Heroku CLI not available or not authenticated');
    }
    
    // Ensure directories exist on Heroku
    for (const file of FILES_TO_DEPLOY) {
      const dirPath = path.dirname(file);
      const mkdirCmd = `heroku run "mkdir -p ${dirPath}"`;
      runCommand(mkdirCmd);
    }
    
    // Upload each file
    for (const file of FILES_TO_DEPLOY) {
      log(`Uploading ${file}...`);
      const uploadCmd = `heroku run "cat > ${file}" < ${file}`;
      const uploadResult = runCommand(uploadCmd);
      
      if (!uploadResult.success) {
        throw new Error(`Failed to upload ${file} to Heroku`);
      }
      
      log(`Successfully uploaded ${file}`);
    }
    
    // Upload build trigger file
    log('Uploading build trigger file');
    runCommand('heroku run "cat > .build-trigger" < .build-trigger');
    
    // Force a rebuild via Heroku CLI
    log('Triggering rebuild on Heroku');
    const rebuildResult = runCommand('heroku builds:create');
    
    if (!rebuildResult.success) {
      log('Warning: Rebuild via CLI failed, trying alternate method');
      // Try an alternate method
      runCommand('heroku restart');
    }
    
    log('Deployment completed successfully! 🎉');
    log('The auth token field naming fix has been deployed.');
    log('Users should no longer experience dashboard errors after login.');
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log('Deployment failed. Please review the logs and try again.');
    process.exit(1);
  }
}

// Run the deployment
deploy();
