/**
 * Direct Mobile Authentication Fix Deployment Script
 * 
 * This script directly builds and deploys the fixed mobile authentication code,
 * skipping the file modification steps that were already performed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_BRANCH = 'fix/user-dashboard';
const LOG_FILE = path.join(process.cwd(), 'mobile_auth_direct_deploy.log');

// Setup logging
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
};

// Initialize log file
fs.writeFileSync(LOG_FILE, `Mobile Authentication Direct Deployment Log (${new Date().toISOString()})\n\n`);

log('Starting direct mobile authentication fix deployment');

try {
  // Build the application
  log('Building the application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Add any new files to git
  log('Adding any new files to git...');
  execSync('git add -A', { stdio: 'inherit' });
  
  // Commit the fixes
  log('Committing the fixed code...');
  execSync('git commit -m "Fix: Fixed syntax error in cookieUtils.ts for mobile authentication"', { stdio: 'inherit' });
  
  // Deploy to Heroku
  log('Deploying to Heroku...');
  execSync(`git push heroku ${DEPLOYMENT_BRANCH}:master -f`, { stdio: 'inherit' });
  
  log('Successfully deployed the mobile authentication fix to Heroku');
  log('Remember to test on multiple mobile devices and browsers');
} catch (error) {
  log(`Mobile authentication direct deployment failed: ${error.message}`);
  log('Please review the error and try again');
  process.exit(1);
}
