/**
 * Heroku deployment script for the product API request debouncing fix
 * This script will:
 * 1. Run the fix_product_modal_duplicate_requests.js script to apply the fix
 * 2. Commit the changes to a new branch
 * 3. Push the branch to Heroku for deployment
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const APP_NAME = 'energy-audit-store';
const BRANCH_NAME = 'fix/product-api-debounce';
const COMMIT_MESSAGE = 'Fix duplicate API requests in ProductDetailModal with debouncing';

// Helper to run commands and log output
function runCommand(command, options = {}) {
  console.log(`\n> ${command}`);
  try {
    const output = execSync(command, {
      stdio: 'inherit',
      ...options
    });
    return { success: true, output };
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return { success: false, error };
  }
}

// Main deployment function
async function deploy() {
  console.log('\n===== Starting Product API Debouncing Fix Deployment =====');
  
  // 1. Make sure we're in the project root
  const rootDir = path.resolve(__dirname, '..');
  process.chdir(rootDir);
  console.log(`Working directory: ${process.cwd()}`);
  
  // 2. Create a new branch
  console.log('\n----- Creating deployment branch -----');
  runCommand(`git checkout -b ${BRANCH_NAME}`);
  
  // 3. Run the fix script
  console.log('\n----- Applying the product modal fix -----');
  try {
    require('./fix_product_modal_duplicate_requests.js');
  } catch (error) {
    console.error('Error running fix script:', error);
    process.exit(1);
  }
  
  // 4. Stage the changes
  console.log('\n----- Staging changes -----');
  runCommand('git add src/components/products/ProductDetailModal.tsx');
  runCommand('git add .build-trigger');
  
  // 5. Commit the changes
  console.log('\n----- Committing changes -----');
  runCommand(`git commit -m "${COMMIT_MESSAGE}"`);
  
  // 6. Push to GitHub (optional)
  const pushToGithub = false; // Set to true if you want to push to GitHub
  if (pushToGithub) {
    console.log('\n----- Pushing to GitHub -----');
    runCommand(`git push origin ${BRANCH_NAME}`);
  }
  
  // 7. Push to Heroku
  console.log('\n----- Deploying to Heroku -----');
  const herokuResult = runCommand(`git push heroku ${BRANCH_NAME}:main --force`);
  
  if (herokuResult.success) {
    console.log('\n✓✓✓ Deployment completed successfully!');
    
    // 8. Monitor logs
    console.log('\n----- Monitoring Heroku logs -----');
    console.log('Check for reduction in duplicate API requests...');
    console.log(`Run this command to view logs: heroku logs --tail -a ${APP_NAME}`);
    
    // 9. Return to main branch
    console.log('\n----- Returning to main branch -----');
    runCommand('git checkout main');
    
    console.log('\n===== Deployment Complete =====');
    console.log('Next steps:');
    console.log('1. Verify the fix by checking network requests in browser dev tools');
    console.log('2. Monitor server logs for any new errors');
    console.log('3. Check that product details still load correctly');
  } else {
    console.error('\n❌❌❌ Deployment failed!');
    console.log('\nTo rollback, run:');
    console.log(`heroku rollback -a ${APP_NAME}`);
  }
}

// Execute the deployment
deploy().catch(err => {
  console.error('Deployment failed with error:', err);
  process.exit(1);
});
