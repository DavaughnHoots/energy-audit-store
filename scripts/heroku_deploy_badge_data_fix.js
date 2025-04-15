/**
 * Badge Data Format Fix Deployment Script
 * 
 * This script addresses a data structure issue where badges are not displaying correctly
 * on the Achievements tab for some users despite the API routes working correctly.
 * 
 * The fix includes:
 * 1. Enhanced diagnostic tools for investigating badge data format issues
 * 2. Robust error handling in the badge display components
 * 3. Data structure normalization to ensure consistent format across users
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-data-format';
const COMMIT_MESSAGE = 'Fix badge data format issues with enhanced diagnostics';

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
    checkFileExists('src/components/badges/BadgeDiagnostics.tsx');
    checkFileExists('src/components/badges/RealBadgesTab.tsx');
    checkFileExists('src/hooks/useBadgeProgress.ts');
    checkFileExists('src/pages/BadgesDiagnosticPage.tsx');
    
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
      'git add src/components/badges/BadgeDiagnostics.tsx src/components/badges/RealBadgesTab.tsx src/hooks/useBadgeProgress.ts src/pages/BadgesDiagnosticPage.tsx', 
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
    log('3. Check the badges functionality with both users:', 'blue');
    log('   - Navigate to /badge-diagnostics to see detailed badge info', 'cyan');
    log('   - Access the regular dashboard Achievements tab to verify fixes', 'cyan');
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
