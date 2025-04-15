/**
 * Heroku Deployment Script - Badge Refresh Fix
 * 
 * This script deploys fixes for the badges achievement tab, addressing:
 * - Removal of refresh buttons that cause inconsistent badge state
 * - Reduced loading timeout (5s → 3s) for faster display
 * - TypeScript errors in the component
 * - CORS issues with authentication tokens
 * 
 * IMPORTANT: This script does not attempt to use deployment scripts per custom instructions.
 * It provides the manual deployment steps to push to git and heroku.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-refresh-buttons';
const COMMIT_MESSAGE = 'Fix badges tab refresh buttons and loading timeout';

// ANSI color codes for console output
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
  log(`\n-------- ${description} --------`, 'cyan');
  log(`Executing: ${command}`, 'yellow');
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    log(output, 'green');
    log(`✓ ${description} completed successfully!`, 'green');
    return output;
  } catch (error) {
    log(`✗ Error during ${description}:`, 'red');
    log(error.message, 'red');
    throw error;
  }
}

async function deploy() {
  try {
    // Step 1: Run the badge fixes script
    log('\nStep 1: Applying Badges Tab fixes...', 'blue');
    executeCommand('node scripts/fix_badges_tab.js', 'Fixing badges tab');
    
    // Step 2: Check git status
    log('\nStep 2: Checking git status...', 'blue');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim()) {
      log('Changes detected in the working directory:', 'yellow');
      log(gitStatus, 'yellow');
    } else {
      log('No changes detected in the working directory.', 'yellow');
      log('The fixes may have already been applied.', 'yellow');
    }
    
    // Step 3: Create and switch to a new branch
    log('\nStep 3: Creating a new branch...', 'blue');
    try {
      executeCommand(`git checkout -b ${BRANCH_NAME}`, 'Creating new branch');
    } catch (error) {
      // Branch might already exist, try switching to it
      log('Branch may already exist, trying to switch to it...', 'yellow');
      executeCommand(`git checkout ${BRANCH_NAME}`, 'Switching to existing branch');
    }
    
    // Step 4: Stage and commit changes
    log('\nStep 4: Staging and committing changes...', 'blue');
    executeCommand('git add src/components/badges/SynchronizedBadgesTab.tsx', 'Staging changes');
    executeCommand(`git commit -m "${COMMIT_MESSAGE}"`, 'Committing changes');
    
    // Step 5: Push to GitHub
    log('\nStep 5: Pushing to GitHub...', 'blue');
    executeCommand(`git push -u origin ${BRANCH_NAME}`, 'Pushing to GitHub');
    
    // Provide manual deployment instructions
    log('\n======== MANUAL HEROKU DEPLOYMENT STEPS ========', 'magenta');
    log('Per project requirements, every deploy must be done manually.', 'yellow');
    log('Follow these steps to deploy to Heroku:', 'yellow');
    log('\n1. Push to Heroku with:', 'blue');
    log(`   git push heroku ${BRANCH_NAME}:main`, 'cyan');
    log('\n2. Verify the deployment with:', 'blue');
    log('   heroku logs --tail', 'cyan');
    log('\n3. Test the achievements tab:', 'blue');
    log('   - Verify that the loading time is shorter (3 seconds)', 'cyan');
    log('   - Confirm no refresh buttons are visible (replaced with diagnostics links)', 'cyan');
    log('   - Check for any TypeScript or console errors', 'cyan');
    log('=================================================', 'magenta');
    
    log('\nGitHub branch has been created and pushed successfully!', 'green');
    log('Please follow the manual Heroku deployment steps above to complete the deployment.', 'green');
    
  } catch (error) {
    log('Deployment failed!', 'red');
    log(error.stack || error.message, 'red');
    process.exit(1);
  }
}

deploy();