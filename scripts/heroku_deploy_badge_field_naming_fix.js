/**
 * Heroku Badge Field Naming Fix Deployment Helper
 * 
 * This script prepares for deployment of fixes for the badge level display issues:
 * - Handles mismatched field names between API and components
 * - Maps between API field names (totalPoints, currentLevel, etc) and component field names (points, level, etc)
 * - Adds robust fallback and logging for debugging field name mismatches
 * 
 * IMPORTANT: Per project requirements, this script does NOT automatically deploy.
 * It prepares the changes and provides manual deployment instructions.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-field-naming';
const COMMIT_MESSAGE = 'Fix achievement display: map between API and component field names';

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
    log('\n========== BADGE FIELD NAMING FIX DEPLOYMENT ==========', 'magenta');
    log('Preparing deployment for badge field naming fixes...', 'cyan');
    
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
    executeCommand('git add src/components/badges/SynchronizedBadgesTab.tsx src/components/badges/LevelProgressBar.tsx', 'Stage changes');
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
    log('   - Verify the correct level information appears (Level 5 "Energy Master")', 'blue');
    log('   - Verify points show correctly (1275 with 1375 needed for next level)', 'blue');
    log('   - Check that the progress bar displays properly', 'blue');
    log('   - Confirm the debug view shows the detailed level information', 'blue');
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
