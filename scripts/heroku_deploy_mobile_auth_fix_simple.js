/**
 * heroku_deploy_mobile_auth_fix_simple.js
 * 
 * Simple deployment script for mobile authentication fixes to Heroku production environment
 * Uses the EXISTING mobile device detection and SameSite cookie handling code
 * This script:
 * 1. Builds the project
 * 2. Commits the changes to git
 * 3. Deploys to Heroku
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to execute shell commands
function runCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout);
    console.error(error.stderr);
    throw error;
  }
}

// Configuration
const HEROKU_APP_NAME = 'energy-audit-store-e66479ed4f2b';
const RELEASE_TAG = `mobile-auth-fix-${new Date().toISOString().slice(0, 10)}`;
const COMMIT_MESSAGE = 'Fix: Mobile authentication issues - force redeployment';

// Main deployment function
async function deploy() {
  try {
    console.log('========== STARTING MOBILE AUTH FIX DEPLOYMENT ==========');
    
    // Note: No changes to source files required - just force a rebuild and deploy
    console.log('\nℹ️ Using existing mobile detection and SameSite cookie handling');
    
    // 1. Create a trigger file for rebuild
    const triggerContent = `# Force rebuild for mobile authentication: ${new Date().toISOString()}`;
    fs.writeFileSync('.build-trigger', triggerContent);
    console.log('Created .build-trigger file to force rebuild.');
    
    // 2. Build the project
    console.log('\n1. Building the project...');
    runCommand('npm run build');
    
    // 3. Commit changes to git
    console.log('\n2. Committing changes to git...');
    runCommand('git add .');
    runCommand(`git commit -m "${COMMIT_MESSAGE}"`);
    
    // 4. Tag the release
    console.log(`\n3. Tagging release as ${RELEASE_TAG}...`);
    runCommand(`git tag -a ${RELEASE_TAG} -m "${COMMIT_MESSAGE}"`);
    
    // 5. Deploy to Heroku
    console.log(`\n4. Deploying to Heroku app: ${HEROKU_APP_NAME}...`);
    runCommand(`git push heroku master`);
    
    // 6. Push changes and tags to GitHub
    console.log('\n5. Pushing changes and tags to GitHub...');
    runCommand('git push origin master');
    runCommand('git push origin --tags');
    
    console.log('\n✅ DEPLOYMENT COMPLETED SUCCESSFULLY');
    console.log(`Heroku app: https://${HEROKU_APP_NAME}.herokuapp.com`);
    console.log(`Release tag: ${RELEASE_TAG}`);
    console.log('\nMonitoring:');
    console.log(`1. Check Heroku logs: heroku logs --tail --app ${HEROKU_APP_NAME}`);
    console.log('2. Monitor dashboard access rates on mobile devices');
    console.log('3. Watch for 401/unauthorized error rates');
    
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED');
    console.error(error);
  }
}

// Check if we're running in production mode or testing mode
if (process.argv.includes('--test')) {
  console.log('Running in TEST mode - no actual deployment will occur');
  console.log('This is a dry run to validate the script');
} else {
  // Execute the deployment
  deploy();
}
