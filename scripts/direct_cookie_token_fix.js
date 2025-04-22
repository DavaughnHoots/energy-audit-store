/**
 * Direct deployment script for cookie and token handling fixes
 * This script directly uploads the fixed files to Heroku without relying on git push
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
const LOG_PREFIX = '[COOKIE-TOKEN-FIX-DIRECT]';
const FILES_TO_DEPLOY = [
  'src/utils/cookieUtils.ts',
  'src/context/AuthContext.tsx',
  'src/services/apiClient.ts'
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
    log('Starting direct deployment of cookie & token handling fix');
    
    // Verify required files exist
    FILES_TO_DEPLOY.forEach(file => {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
      log(`Verified file exists: ${file}`);
    });

    // Create a temporary directory for the deployment
    const tempDir = path.join(process.cwd(), `temp_deploy_${DEPLOYMENT_ID}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    log(`Created temporary directory: ${tempDir}`);

    // Prepare specific directory structure
    for (const file of FILES_TO_DEPLOY) {
      const targetDir = path.join(tempDir, path.dirname(file));
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy file to temp directory
      fs.copyFileSync(file, path.join(tempDir, file));
      log(`Copied ${file} to temporary directory`);
    }

    // Create a version marker file
    const versionFile = path.join(tempDir, 'VERSION');
    fs.writeFileSync(versionFile, `cookie-token-fix-${DEPLOYMENT_ID}-${new Date().toISOString()}`);
    log(`Created version marker: ${versionFile}`);

    // Create a direct upload script for Heroku CLI
    log('Preparing to use Heroku CLI for direct upload');
    
    // Test Heroku CLI access
    const herokuTest = runCommand('heroku apps:info --json');
    if (!herokuTest.success) {
      throw new Error('Heroku CLI not available or not authenticated');
    }
    
    // Deploy each file directly using Heroku CLI
    log('Uploading files directly to Heroku...');
    for (const file of FILES_TO_DEPLOY) {
      log(`Deploying file: ${file}`);
      
      // Create command to directly update the source file on Heroku
      const uploadCmd = `heroku run "mkdir -p $(dirname ${file}) && cat > ${file}" < ${file}`;
      const uploadResult = runCommand(uploadCmd);
      
      if (!uploadResult.success) {
        throw new Error(`Failed to upload ${file} to Heroku`);
      }
      
      log(`Successfully uploaded ${file}`);
    }
    
    // Trigger a rebuild on Heroku
    log('Triggering rebuild on Heroku');
    const rebuildResult = runCommand('heroku builds:create');
    
    if (!rebuildResult.success) {
      log('Warning: Failed to trigger rebuild via CLI, attempting alternate method');
      // Try alternate method by touching a file
      const touchResult = runCommand('heroku run "touch .rebuild-trigger"');
      if (!touchResult.success) {
        throw new Error('Failed to trigger rebuild on Heroku');
      }
    }
    
    // Clean up temporary directory
    runCommand(`rm -rf ${tempDir}`);
    log('Cleaned up temporary directory');
    
    log('Direct deployment successful! 🎉');
    log('The cookie & token handling fix has been deployed.');
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deploy();
