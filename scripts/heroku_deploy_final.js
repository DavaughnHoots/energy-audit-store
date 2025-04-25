/**
 * heroku_deploy_final.js
 * 
 * Improved script to deploy fixes for Heroku dependency issues
 * - Windows-compatible
 * - Handles cases with no changes to commit
 * - Better error handling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Print a formatted message
 */
function print(message, color = 'reset', isBright = false) {
  const bright = isBright ? colors.bright : '';
  console.log(`${bright}${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if there are changes to commit
 */
function hasChangesToCommit() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim() !== '';
  } catch (error) {
    print(`Error checking git status: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Get current branch
 */
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (error) {
    print(`Error getting current branch: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Execute a command and return success status
 */
function runCommand(command, description) {
  print(`\n${description}...`, 'blue', true);
  print(`> ${command}`, 'cyan');
  
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    print(`Failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Check if required files exist
 */
function checkRequiredFiles() {
  const requiredFiles = [
    ['backend/package.json', 'Backend package.json'],
    ['package.json', 'Root package.json']
  ];
  
  const missingFiles = [];
  
  for (const [file, desc] of requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(desc);
    }
  }
  
  if (missingFiles.length > 0) {
    print('Warning: The following required files are missing:', 'yellow');
    missingFiles.forEach(file => print(`- ${file}`, 'yellow'));
    return false;
  }
  
  return true;
}

/**
 * Main function
 */
async function main() {
  print('==============================================', 'blue', true);
  print('        HEROKU FINAL DEPLOYMENT UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print('This script deploys fixes to Heroku\n', 'cyan');
  
  // Check required files
  if (!checkRequiredFiles()) {
    print('\nSome required files are missing. Continue anyway? (y/n)', 'yellow');
    // In a real interactive environment, we'd wait for user input here
    // Since this is a non-interactive script, we'll proceed
    print('Proceeding anyway...', 'yellow');
  }
  
  // Check if Heroku CLI is available
  try {
    execSync('heroku --version', { stdio: 'ignore' });
  } catch (error) {
    print('Heroku CLI is not installed or not in PATH', 'red', true);
    print('Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli', 'yellow');
    process.exit(1);
  }
  
  // Get current branch
  const currentBranch = getCurrentBranch();
  if (!currentBranch) {
    print('Could not determine current branch', 'red', true);
    process.exit(1);
  }
  
  print(`Current branch: ${currentBranch}`, 'green');
  
  // 1. Check if there are uncommitted changes
  if (hasChangesToCommit()) {
    print('\nUncommitted changes detected', 'yellow');
    
    // 2. Add files to git
    if (!runCommand('git add backend/package.json Procfile Aptfile package.json', 'Adding files to git')) {
      print('Failed to add files to git', 'red', true);
      process.exit(1);
    }
    
    // 3. Commit changes
    if (!runCommand('git commit -m "Fix Heroku dependency issues"', 'Committing changes')) {
      print('Failed to commit changes', 'red', true);
      process.exit(1);
    }
  } else {
    print('\nNo changes to commit. Proceeding with deployment.', 'yellow');
  }
  
  // 4. Push to Heroku
  if (!runCommand(`git push heroku ${currentBranch}:master -f`, 'Pushing to Heroku')) {
    print('Failed to push to Heroku', 'red', true);
    process.exit(1);
  }
  
  print('\nDeployment completed successfully!', 'green', true);
  print('Check the app status with: heroku logs -tail -a energy-audit-store', 'cyan');
}

// Run the script
main().catch(error => {
  print(`Fatal error: ${error.message}`, 'red', true);
  process.exit(1);
});
