/**
 * Heroku Deployment Script for Product Financial Metrics Fix
 * 
 * This script deploys fixes for calculation and display issues in dehumidifier product metrics:
 * 1. Corrects the energy calculation by removing dailyRunHours factor
 * 2. Fixes ROI formatting by removing incorrect division by 100
 * 3. Ensures price calculations are product-specific
 * 4. Fixes energy efficiency label application
 */

const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');

// Configuration
const BRANCH_NAME = 'fix/product-financial-metrics';
const COMMIT_MESSAGE = 'Fix product financial metrics calculation and display issues';

/**
 * Execute a shell command and return its output
 */
function execute(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

/**
 * Check for uncommitted changes (only staged or modified, ignore untracked)
 */
function checkGitStatus() {
  const output = execute('git status --porcelain');
  // Check if there are any staged or modified files (not untracked)
  // Untracked files start with ??, which we'll ignore
  const modifiedFiles = output.split('\n')
    .filter(line => line.trim() !== '' && !line.startsWith('??'));
  
  if (modifiedFiles.length > 0) {
    console.error('⚠️ You have staged or modified changes. Please commit or stash them before running this script.');
    modifiedFiles.forEach(file => console.error(`  - ${file}`));
    process.exit(1);
  }
}

/**
 * Create a new branch for the fixes
 */
function createBranch() {
  try {
    // Check if branch exists locally
    const branches = execute('git branch');
    if (branches.includes(BRANCH_NAME)) {
      console.log(`Branch ${BRANCH_NAME} already exists locally. Checking it out...`);
      execute(`git checkout ${BRANCH_NAME}`);
    } else {
      console.log(`Creating and checking out new branch: ${BRANCH_NAME}`);
      execute(`git checkout -b ${BRANCH_NAME}`);
    }
  } catch (error) {
    console.error('Failed to create or checkout branch:', error.message);
    process.exit(1);
  }
}

/**
 * Apply the financial metrics fixes
 */
function applyFixes() {
  console.log('Applying product financial metrics fixes...');
  try {
    // Run the fix script
    execute('node scripts/fix_product_financial_metrics.js');

    // Update .build-trigger to force a fresh build
    const timestamp = new Date().toISOString();
    fs.writeFileSync('.build-trigger', timestamp);
    console.log(`Updated .build-trigger with timestamp: ${timestamp}`);
    
    return true;
  } catch (error) {
    console.error('Failed to apply fixes:', error.message);
    return false;
  }
}

/**
 * Commit changes
 */
function commitChanges() {
  try {
    // Add modified files
    execute('git add src/services/productEstimation/DehumidifierEstimator.ts .build-trigger');
    
    // Commit the changes
    execute(`git commit -m "${COMMIT_MESSAGE}"`);
    console.log('Changes committed successfully.');
    return true;
  } catch (error) {
    console.error('Failed to commit changes:', error.message);
    return false;
  }
}

/**
 * Deploy to Heroku
 */
function deployToHeroku() {
  try {
    console.log('Deploying to Heroku...');
    execute('git push heroku HEAD:main');
    console.log('✅ Successfully deployed to Heroku!');
    return true;
  } catch (error) {
    console.error('Failed to deploy to Heroku:', error.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting deployment of product financial metrics fixes...');
  
  // Check for uncommitted changes
  checkGitStatus();
  
  // Create or checkout branch
  createBranch();
  
  // Apply fixes
  const fixesApplied = applyFixes();
  if (!fixesApplied) {
    console.error('❌ Failed to apply fixes. Deployment aborted.');
    process.exit(1);
  }
  
  // Commit changes
  const changesCommitted = commitChanges();
  if (!changesCommitted) {
    console.error('❌ Failed to commit changes. Deployment aborted.');
    process.exit(1);
  }
  
  // Deploy to Heroku
  const deploymentSuccessful = deployToHeroku();
  if (!deploymentSuccessful) {
    console.error('❌ Failed to deploy to Heroku.');
    process.exit(1);
  }
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('Please verify the following on the live site:');
  console.log('1. Products display different prices based on capacity');
  console.log('2. Annual savings are in realistic range ($40-$100)');
  console.log('3. ROI percentages are corrected (not inflated by factor of 100)');
  console.log('4. Energy efficiency labels match certification levels');
}

// Run the script
main().catch(error => {
  console.error('An error occurred during deployment:', error);
  process.exit(1);
});
