/**
 * Heroku Badge Level Display Fix Deployment Helper
 * 
 * This script prepares for deployment of fixes for the badge level display issues:
 * - Fixes incorrect level title display
 * - Fixes incorrect max level status
 * - Adds level data to debug view
 * 
 * IMPORTANT: Per project requirements, this script does NOT automatically deploy.
 * It prepares the changes and provides manual deployment instructions.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-level-display';
const COMMIT_MESSAGE = 'Fix achievement level display: respect API level data';

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  log(`\n→ ${description}`, 'blue');
  log(`$ ${command}`, 'yellow');
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    if (output.trim()) {
      log(output, 'green');
    }
    log(`✓ Success: ${description}`, 'green');
    return output;
  } catch (error) {
    log(`✗ Error: ${description}`, 'red');
    log(error.message, 'red');
    throw error;
  }
}

async function deploy() {
  try {
    log('\n========== BADGE LEVEL DISPLAY FIX DEPLOYMENT ==========', 'magenta');
    log('Preparing deployment for badge level display fixes...', 'cyan');
    
    // Step 1: Check current git status
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      log('\nDetected changes in working directory:', 'yellow');
      log(gitStatus);
      log('These changes will be included in the deployment.', 'yellow');
    }
    
    // Step 2: Check if branch exists and create/switch to it
    try {
      executeCommand(`git checkout ${BRANCH_NAME}`, 'Switch to existing branch');
      log('Branch already exists, continuing with existing branch', 'yellow');
    } catch (error) {
      executeCommand(`git checkout -b ${BRANCH_NAME}`, 'Create new branch');
    }
    
    // Step 3: Stage and commit changes
    executeCommand('git add src/components/badges/SynchronizedBadgesTab.tsx', 'Stage changes');
    executeCommand(`git commit -m "${COMMIT_MESSAGE}"`, 'Commit changes');
    
    // Step 4: Push to GitHub
    executeCommand(`git push -u origin ${BRANCH_NAME}`, 'Push to GitHub');
    
    // Step 5: Provide manual deployment instructions
    log('\n========== MANUAL DEPLOYMENT STEPS ==========', 'magenta');
    log('Per project requirements, every deploy must be done manually.', 'yellow');
    log('Follow these steps to deploy to Heroku:', 'yellow');
    log('\n1. Push to Heroku with:', 'cyan');
    log(`   git push heroku ${BRANCH_NAME}:main`, 'blue');
    log('\n2. Verify the deployment with:', 'cyan');
    log('   heroku logs --tail', 'blue');
    log('\n3. Test the achievements tab in the browser:', 'cyan');
    log('   - Verify the correct level title appears ("Energy Master" instead of "Energy User")', 'blue');
    log('   - Confirm progress bar shows correct level and points needed for next level', 'blue');
    log('   - Check that "Maximum level reached" is no longer incorrectly shown', 'blue');
    log('================================================', 'magenta');
    
    log('\nDeployment preparation complete!', 'green');
    log('Please follow the manual steps above to complete deployment to Heroku.', 'green');
  } catch (error) {
    log('\nDeployment preparation failed!', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Execute deployment preparation
deploy();
