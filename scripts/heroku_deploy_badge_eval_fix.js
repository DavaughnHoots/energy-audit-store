/**
 * Badge Evaluation Fix Deployment Script
 * 
 * This script deploys a fix for the badge evaluation issues causing:
 * 1. Incorrectly categorizing badges as earned despite 0% progress
 * 2. Audit badges showing incorrect requirements (e.g., platinum badge for users with only 18 audits)
 * 3. Level progress incorrectly showing "Maximum level reached" for all users
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-evaluation-issues';
const COMMIT_MESSAGE = 'Fix badge evaluation issues with progress verification and level calculation';

// Files that have been modified
const FILES_TO_STAGE = [
  'src/hooks/useBadgeProgress.badge-fix.ts',
  'src/components/badges/RealBadgesTab.badge-eval-fix.tsx',
  'src/components/badges/BadgesTab.tsx'
];

// Utility function for colored console output
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
    // Check git status
    log('Checking git status...', 'blue');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim()) {
      log('Warning: You have uncommitted changes. These will be included in the deployment.', 'yellow');
      log(gitStatus, 'yellow');
      log('Continuing in 5 seconds... Press Ctrl+C to abort.', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Verify required files exist
    for (const file of FILES_TO_STAGE) {
      if (!fs.existsSync(file)) {
        log(`Warning: File ${file} does not exist. Skipping verification.`, 'yellow');
      }
    }
    
    // Create and switch to new branch
    try {
      executeCommand(`git checkout -b ${BRANCH_NAME}`, 'Creating new branch');
    } catch (error) {
      // Branch might already exist, try switching to it
      executeCommand(`git checkout ${BRANCH_NAME}`, 'Switching to existing branch');
    }
    
    // Stage the changed files
    const filesToStage = FILES_TO_STAGE.filter(file => fs.existsSync(file));
    if (filesToStage.length === 0) {
      throw new Error('No files to stage, aborting deployment');
    }
    
    executeCommand(`git add ${filesToStage.join(' ')}`, 'Staging changes');
    
    // Commit changes
    executeCommand(`git commit -m "${COMMIT_MESSAGE}"`, 'Committing changes');
    
    // Push to GitHub
    executeCommand(`git push -u origin ${BRANCH_NAME}`, 'Pushing to GitHub');
    
    log('\n======== MANUAL HEROKU DEPLOYMENT STEPS ========', 'magenta');
    log('1. Deploy to Heroku with:', 'blue');
    log(`   git push heroku ${BRANCH_NAME}:main`, 'cyan');
    log('2. Verify the deployment with:', 'blue');
    log('   heroku logs --tail', 'cyan');
    log('3. Check the badges display with user accounts:', 'blue');
    log('   - Verify badges are now correctly categorized as earned/locked', 'cyan');
    log('   - Check that progress reflects actual user metrics (audits, etc.)', 'cyan');
    log('   - Verify level progress bar shows correct status', 'cyan');
    log('=================================================', 'magenta');
    
    log('\nGitHub branch has been created and pushed.', 'green');
    log('Please follow the manual Heroku deployment steps above.', 'green');
    
  } catch (error) {
    log('Deployment failed!', 'red');
    log(error.stack || error.message, 'red');
    process.exit(1);
  }
}

deploy();