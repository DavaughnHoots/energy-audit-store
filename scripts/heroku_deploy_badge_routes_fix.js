/**
 * Deployment script for badge route handling fix
 * 
 * This script addresses the badge path handling issue where API endpoints were
 * returning 404 errors due to incorrect route registration. The fix includes:
 * 
 * 1. Enhanced badge route handlers that properly handle all paths
 * 2. Improved route registration in server.ts
 * 3. Better error handling and logging for badge-related routes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-route-paths';
const COMMIT_MESSAGE = 'Fix badge route handling to properly handle all badge endpoints';

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

function checkFileExists(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fullPath;
}

async function deploy() {
  try {
    // Verify required files exist
    checkFileExists('backend/src/server.ts');
    checkFileExists('backend/src/routes/badges.enhanced.ts');
    checkFileExists('backend/src/routes/user-badges.enhanced.ts');
    
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
    
    // Stage changed files
    executeCommand(
      'git add backend/src/server.ts backend/src/routes/badges.enhanced.ts backend/src/routes/user-badges.enhanced.ts', 
      'Staging changes'
    );
    
    // Commit changes
    executeCommand(`git commit -m "${COMMIT_MESSAGE}"`, 'Committing changes');
    
    // Push to GitHub
    executeCommand(`git push -u origin ${BRANCH_NAME}`, 'Pushing to GitHub');
    
    log('\n======== MANUAL HEROKU DEPLOYMENT STEPS ========', 'magenta');
    log('1. Deploy to Heroku with:', 'blue');
    log(`   git push heroku ${BRANCH_NAME}:main`, 'cyan');
    log('2. Verify the deployment with:', 'blue');
    log('   heroku logs --tail', 'cyan');
    log('3. Check the debug endpoints:', 'blue');
    log('   - GET /api/debug/badges', 'cyan');
    log('   - GET /api/debug/routes', 'cyan');
    log('4. Verify the badge system:', 'blue');
    log('   - Navigate to the Achievements tab in the dashboard', 'cyan');
    log('   - Check the network tab for requests to the badge endpoints', 'cyan');
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
