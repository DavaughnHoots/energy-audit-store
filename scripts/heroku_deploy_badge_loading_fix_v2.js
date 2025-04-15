/**
 * Badge Loading Fix Deployment Script v2
 * 
 * This script deploys fixes for:
 * 1. Achievements tab gets stuck in loading state
 * 2. Adds a force-render fallback after 5 seconds
 * 3. Provides better error diagnostics and feedback
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-loading-timeout';
const COMMIT_MESSAGE = 'Add force rendering timeout for badge loading';

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

async function applyFix() {
  try {
    // First, make sure our fix script exists
    const fixScriptPath = path.join(process.cwd(), 'scripts/fix_badge_loading_render.js');
    if (!fs.existsSync(fixScriptPath)) {
      throw new Error('Fix script not found at ' + fixScriptPath);
    }
    
    // Run the fix script
    log('Applying badge loading fix...', 'blue');
    const result = execSync(`node ${fixScriptPath}`, { encoding: 'utf8' });
    log(result, 'green');
    log('✓ Fix applied successfully!', 'green');
    return true;
  } catch (error) {
    log('✗ Failed to apply fix:', 'red');
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
    
    // Apply the fix
    const fixApplied = await applyFix();
    if (!fixApplied) {
      throw new Error('Failed to apply loading fix');
    }
    
    // Stage the changed files
    executeCommand('git add src/components/badges/SynchronizedBadgesTab.tsx', 'Staging changes');
    
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