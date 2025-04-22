/**
 * Deploy script for product estimation signal fix
 * 
 * This script applies the fix for the requestCache.createSignal issue
 * in the productEstimationService.ts file and deploys it to Heroku.
 * 
 * Usage: node scripts/heroku_deploy_product_estimation_signal_fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a build trigger to force a deployment
function createBuildTrigger() {
  console.log('Creating build trigger...');
  
  const triggerFilePath = '.build-trigger';
  const timestamp = new Date().toISOString();
  
  fs.writeFileSync(triggerFilePath, `Build triggered at ${timestamp} for Product Estimation Signal Fix\n`, { flag: 'a' });
  
  console.log(`✅ Build trigger created at ${timestamp}`);
}

// Apply the fix by running the fix script
function applyFix() {
  console.log('Applying product estimation service fix...');
  
  try {
    execSync('node scripts/fix_product_estimation_remove_signal.js', { stdio: 'inherit' });
    console.log('✅ Fix applied successfully!');
    return true;
  } catch (error) {
    console.error('Error applying fix:', error.message);
    return false;
  }
}

// Commit changes
function commitChanges() {
  console.log('Committing changes...');
  
  try {
    // Add modified files
    execSync('git add src/services/productEstimationService.ts .build-trigger');
    
    // Commit with descriptive message
    execSync('git commit -m "Fix product estimation service - remove requestCache.createSignal dependency"');
    
    console.log('✅ Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('You may need to manually commit the changes:');
    console.log('git add src/services/productEstimationService.ts .build-trigger');
    console.log('git commit -m "Fix product estimation service - remove requestCache.createSignal dependency"');
    return false;
  }
}

// Deploy to Heroku
function deployToHeroku() {
  console.log('Deploying to Heroku...');
  
  try {
    // Push to Heroku
    execSync('git push heroku HEAD:main', { stdio: 'inherit' });
    
    console.log('✅ Deployment to Heroku completed successfully!');
    return true;
  } catch (error) {
    console.error('Error deploying to Heroku:', error.message);
    console.log('Please follow the manual deployment procedure:');
    console.log('git push heroku HEAD:main');
    return false;
  }
}

// Main function
function main() {
  console.log('Starting deployment process for Product Estimation Signal Fix...');
  
  // Apply the fix
  const fixApplied = applyFix();
  if (!fixApplied) {
    console.error('Failed to apply fix. Deployment aborted.');
    process.exit(1);
  }
  
  // Create build trigger and deploy
  createBuildTrigger();
  
  // Deploy
  const committed = commitChanges();
  if (committed) {
    deployToHeroku();
  }
  
  console.log('\n✅ Product Estimation Signal Fix deployment process completed!');
}

// Execute the main function
main();
