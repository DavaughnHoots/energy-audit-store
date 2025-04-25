/**
 * deploy-typescript-fix.js
 * 
 * Script to commit and deploy the TypeScript configuration fix to Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
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
 * Main function
 */
async function main() {
  print('==============================================', 'blue', true);
  print('       TYPESCRIPT FIX DEPLOYMENT UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print('This script deploys TypeScript fixes to Heroku\n', 'cyan');
  
  // Check if TypeScript fix file exists
  const tsConfigFixPath = path.join(__dirname, 'backend', 'tsconfig.fix.json');
  if (!fs.existsSync(tsConfigFixPath)) {
    print(`TypeScript fix file not found at ${tsConfigFixPath}`, 'red');
    print('Please run node fix-typescript.js first', 'yellow');
    process.exit(1);
  }
  
  // Get current branch
  let currentBranch;
  try {
    currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    print(`Current branch: ${currentBranch}`, 'green');
  } catch (error) {
    print('Could not determine current branch', 'red', true);
    process.exit(1);
  }
  
  // 1. Add the TypeScript fix file
  if (!runCommand('git add backend/tsconfig.fix.json', 'Adding TypeScript fix file to git')) {
    print('Failed to add TypeScript fix file', 'red', true);
    process.exit(1);
  }
  
  // 2. Commit the changes
  if (!runCommand('git commit -m "Add relaxed TypeScript config for Heroku"', 'Committing changes')) {
    print('\nNo changes to commit or commit failed.', 'yellow');
    print('Checking if we can still push existing commits...', 'yellow');
  }
  
  // 3. Push to Heroku
  if (!runCommand(`git push heroku ${currentBranch}:master -f`, 'Pushing to Heroku')) {
    print('Failed to push to Heroku', 'red', true);
    process.exit(1);
  }
  
  print('\nDeployment completed successfully!', 'green', true);
  print('Check the app status with: heroku logs -tail -a energy-audit-store', 'cyan');
  
  // 4. Verify the environment variables
  print('\nVerifying Heroku environment variables...', 'blue');
  try {
    execSync('heroku config:get TS_NODE_TRANSPILE_ONLY -a energy-audit-store', { stdio: 'inherit' });
    execSync('heroku config:get TS_CONFIG_PATH -a energy-audit-store', { stdio: 'inherit' });
  } catch (error) {
    print('Could not verify environment variables', 'yellow');
  }
  
  print('\nYou should now be able to access the admin dashboard at:', 'green');
  print('https://energy-audit-store-e66479ed4f2b.herokuapp.com/admin/dashboard', 'cyan');
}

// Run the script
main().catch(error => {
  print(`Fatal error: ${error.message}`, 'red', true);
  process.exit(1);
});
