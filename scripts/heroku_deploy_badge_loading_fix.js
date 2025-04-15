/**
 * Badge Loading Fix Deployment Script
 * 
 * This script deploys fixes for:
 * 1. CORS-related badge loading issues (achievements tab stuck in loading state)
 * 2. Uses existing reportService instead of non-existent /api/audits endpoint
 * 3. Adds fallback mechanisms for dashboard data loading
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-loading-resilience';
const COMMIT_MESSAGE = 'Fix achievements loading issue with fallback mechanism';

// Files that need to be deployed
const FILES_TO_STAGE = [
  'src/hooks/useBadgeDashboardSync.ts',
  'src/components/badges/SynchronizedBadgesTab.tsx'
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
    
    // Create and switch to new branch
    try {
      executeCommand(`git checkout -b ${BRANCH_NAME}`, 'Creating new branch');
    } catch (error) {
      // Branch might already exist, try switching to it
      executeCommand(`git checkout ${BRANCH_NAME}`, 'Switching to existing branch');
    }
    
    // Verify required files exist
    const existingFiles = FILES_TO_STAGE.filter(file => fs.existsSync(file));
    
    if (existingFiles.length === 0) {
      throw new Error('No files to stage, aborting deployment');
    }
    
    if (existingFiles.length < FILES_TO_STAGE.length) {
      log(`Warning: Some files are missing. Found ${existingFiles.length}/${FILES_TO_STAGE.length} files.`, 'yellow');
      log(`Missing files: ${FILES_TO_STAGE.filter(file => !existingFiles.includes(file)).join(', ')}`, 'yellow');
    }
    
    // Stage the changed files
    executeCommand(`git add ${existingFiles.join(' ')}`, 'Staging changes');
    
    // Commit changes
    executeCommand(`git commit -m "${COMMIT_MESSAGE}"`, 'Committing changes');
    
    // Push to GitHub
    executeCommand(`git push -u origin ${BRANCH_NAME}`, 'Pushing to GitHub');
    
    log('\n======== MANUAL HEROKU DEPLOYMENT STEPS ========', 'magenta');
    log('1. Deploy to Heroku with:', 'blue');
    log(`   git push heroku ${BRANCH_NAME}:main`, 'cyan');
    log('2. Verify the deployment with:', 'blue');
    log('   heroku logs --tail', 'cyan');
    log('3. Test the achievements tab:', 'blue');
    log('   - Verify the tab loads correctly, not stuck in loading', 'cyan');
    log('   - Verify badges show correct progress', 'cyan');
    log('   - Check for warning banners around estimated data', 'cyan');
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