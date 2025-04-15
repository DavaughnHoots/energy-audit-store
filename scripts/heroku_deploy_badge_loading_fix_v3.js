/**
 * Badge Loading Fix Deployment Script v3
 * 
 * This script deploys fixes for:
 * 1. Component getting stuck in loading state
 * 2. Force-render fallback after 5 seconds
 * 3. TypeScript errors in badge components
 * 4. CORS issues with auth token verification
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-loading-timeout-v3';
const COMMIT_MESSAGE = 'Fix badge loading timeout and TypeScript errors';

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

async function applyFixes() {
  try {
    // Run the badge loading fix script
    log('\nStep 1: Running badge loading fix script...', 'blue');
    if (fs.existsSync('./scripts/fix_badge_loading_render.js')) {
      executeCommand('node scripts/fix_badge_loading_render.js', 'Applying badge loading fix');
    } else {
      log('✗ Badge loading fix script not found', 'red');
      log('Skipping this step.', 'yellow');
    }
    
    // Run the TypeScript errors fix script
    log('\nStep 2: Running TypeScript errors fix script...', 'blue');
    if (fs.existsSync('./scripts/fix_badge_errors.js')) {
      executeCommand('node scripts/fix_badge_errors.js', 'Fixing TypeScript errors');
    } else {
      log('✗ TypeScript errors fix script not found', 'red');
      log('Skipping this step.', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('✗ Failed to apply fixes:', 'red');
    log(error.message, 'red');
    return false;
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
    
    // Apply all fixes
    const fixesApplied = await applyFixes();
    if (!fixesApplied) {
      throw new Error('Failed to apply fixes');
    }
    
    // Stage the changed files
    executeCommand('git add src/components/badges/SynchronizedBadgesTab.tsx src/components/badges/LevelProgressBar.tsx', 'Staging changes');
    
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
    log('   - Verify the tab loads within 5 seconds', 'cyan');
    log('   - Check for the fallback warning if data is incomplete', 'cyan');
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