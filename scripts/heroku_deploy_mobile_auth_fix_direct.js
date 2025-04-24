/**
 * heroku_deploy_mobile_auth_fix_direct.js
 * 
 * Deployment script for mobile authentication fixes to Heroku production environment
 * Uses the direct fix approach which avoids string replacement syntax errors
 * This script:
 * 1. Applies the mobile authentication fixes
 * 2. Commits the changes to git
 * 3. Deploys to Heroku
 * 4. Tags the release for tracking
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
const COMMIT_MESSAGE = 'Fix: Mobile authentication issues with token handling and SameSite cookies';

// Main deployment function
async function deploy() {
  try {
    console.log('========== STARTING MOBILE AUTH FIX DEPLOYMENT ==========');
    
    // 1. Run the direct fix script to apply the changes
    console.log('\n1. Applying mobile authentication fixes...');
    runCommand('node scripts/fix_mobile_auth_direct.js');
    
    // 2. Build the project
    console.log('\n2. Building the project...');
    runCommand('npm run build');
    
    // 3. Commit changes to git
    console.log('\n3. Committing changes to git...');
    runCommand('git add .');
    runCommand(`git commit -m "${COMMIT_MESSAGE}"`);
    
    // 4. Tag the release
    console.log(`\n4. Tagging release as ${RELEASE_TAG}...`);
    runCommand(`git tag -a ${RELEASE_TAG} -m "${COMMIT_MESSAGE}"`);
    
    // 5. Deploy to Heroku
    console.log(`\n5. Deploying to Heroku app: ${HEROKU_APP_NAME}...`);
    runCommand(`git push heroku master`);
    
    // 6. Push changes and tags to GitHub
    console.log('\n6. Pushing changes and tags to GitHub...');
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
    
    // Provide rollback instructions
    console.log('\nROLLBACK INSTRUCTIONS:');
    console.log('1. Restore the backup files:');
    console.log('   - src/utils/cookieUtils.ts.backup → src/utils/cookieUtils.ts');
    console.log('   - src/services/apiClient.ts.backup → src/services/apiClient.ts');
    console.log('   - backend/src/middleware/auth.ts.backup → backend/src/middleware/auth.ts');
    console.log('2. Rebuild and redeploy:');
    console.log('   - npm run build');
    console.log('   - git add .');
    console.log('   - git commit -m "Rollback: Revert mobile auth fixes"');
    console.log('   - git push heroku master');
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
