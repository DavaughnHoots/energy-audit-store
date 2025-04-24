/**
 * Mobile Authentication Fix Deployment Script
 * 
 * This script builds and deploys the fixed mobile authentication code,
 * focusing specifically on the apiClient.ts and cookieUtils.ts fixes
 * to resolve mobile authentication issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_BRANCH = 'fix/user-dashboard';
const LOG_FILE = path.join(process.cwd(), 'mobile_auth_deploy.log');

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

try {
  // Step 1: Verify we can build successfully with our fixes
  log('Verifying build with fixes...');
  execSync('npm run build', { stdio: 'inherit' });
  log('✅ Build successful! Syntax errors have been fixed.');
  
  // Step 2: Add the changes to git
  log('Adding changes to git...');
  execSync('git add -A', { stdio: 'inherit' });
  
  // Step 3: Commit the changes
  log('Committing changes...');
  execSync('git commit -m "Fix: Resolve mobile authentication issues by fixing syntax errors and improving token handling"', { stdio: 'inherit' });
  
  // Step 4: Deploy to Heroku
  log('Deploying to Heroku...');
  execSync(`git push heroku ${DEPLOYMENT_BRANCH}:master -f`, { stdio: 'inherit' });
  
  log('\n✅ Mobile authentication fix successfully deployed to Heroku!');
  log('The following issues have been fixed:')
  log('1. Syntax errors in cookieUtils.ts and apiClient.ts');
  log('2. Improved token validation to prevent sending empty Bearer tokens');
  log('3. Enhanced mobile detection and storage strategy');
  log('\nMonitor the application for any further issues and test on multiple mobile devices.');
} catch (error) {
  log(`\n❌ Deployment failed: ${error.message}`);
  log('Check the error message above and fix any remaining issues before trying again.');
  process.exit(1);
}
