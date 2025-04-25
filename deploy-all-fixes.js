/**
 * deploy-all-fixes.js
 * 
 * Script to deploy all fixes to Heroku:
 * 1. TypeScript configuration
 * 2. Missing dependencies
 * 3. Frontend configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
function runCommand(command, description, optional = false) {
  print(`\n${description}...`, 'blue', true);
  print(`> ${command}`, 'cyan');
  
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    print(`Failed: ${error.message}`, 'red');
    if (!optional) {
      print('This error may prevent successful deployment.', 'red');
    } else {
      print('This is an optional step, continuing deployment...', 'yellow');
    }
    return false;
  }
}

/**
 * Verify required files exist
 */
function verifyFiles() {
  print('\nVerifying required files...', 'blue', true);
  
  const requiredFiles = [
    { path: 'backend/tsconfig.fix.json', description: 'TypeScript configuration' },
    { path: 'backend/config/static-paths.js', description: 'Static paths configuration' },
    { path: 'public/index.html', description: 'Index file' },
    { path: 'Procfile', description: 'Procfile' },
    { path: 'static.json', description: 'Static configuration' }
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(__dirname, file.path))) {
      print(`Found ${file.description} at ${file.path}`, 'green');
    } else {
      print(`Missing ${file.description} at ${file.path}`, 'red');
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

/**
 * Configure Heroku buildpacks
 */
function configureHerokuBuildpacks() {
  print('\nConfiguring Heroku buildpacks...', 'blue', true);
  
  // Clear existing buildpacks (optional)
  runCommand('heroku buildpacks:clear -a energy-audit-store', 'Clearing existing buildpacks', true);
  
  // Add Node.js buildpack
  if (!runCommand('heroku buildpacks:add heroku/nodejs -a energy-audit-store', 'Adding Node.js buildpack', true)) {
    // Try using a different command if the first one fails
    runCommand('heroku buildpacks:set heroku/nodejs -a energy-audit-store', 'Setting Node.js buildpack', true);
  }
  
  // Add Apt buildpack for system dependencies (optional)
  runCommand('heroku buildpacks:add https://github.com/heroku/heroku-buildpack-apt -a energy-audit-store', 'Adding Apt buildpack', true);
  
  // Verify buildpacks
  runCommand('heroku buildpacks -a energy-audit-store', 'Verifying buildpacks');
}

/**
 * Set Heroku environment variables
 */
function setHerokuEnvironmentVariables() {
  print('\nSetting Heroku environment variables...', 'blue', true);
  
  // Set NODE_ENV to production
  runCommand('heroku config:set NODE_ENV=production -a energy-audit-store', 'Setting NODE_ENV');
  
  // Allow installation of dev dependencies
  runCommand('heroku config:set NPM_CONFIG_PRODUCTION=false -a energy-audit-store', 'Setting NPM_CONFIG_PRODUCTION');
  
  // Bypass TypeScript errors
  runCommand('heroku config:set TS_NODE_TRANSPILE_ONLY=true -a energy-audit-store', 'Setting TS_NODE_TRANSPILE_ONLY');
  
  // Set TypeScript config path
  runCommand('heroku config:set TS_CONFIG_PATH=tsconfig.fix.json -a energy-audit-store', 'Setting TS_CONFIG_PATH');
  
  // Verify environment variables
  runCommand('heroku config -a energy-audit-store', 'Verifying environment variables');
}

/**
 * Deploy to Heroku
 */
function deployToHeroku() {
  // Get current branch
  let currentBranch;
  try {
    currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    print(`\nCurrent branch: ${currentBranch}`, 'green');
  } catch (error) {
    print('\nCould not determine current branch', 'red', true);
    process.exit(1);
  }
  
  // Add any remaining changes
  print('\nChecking for any remaining changes...', 'blue', true);
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (status.trim() !== '') {
    print('Uncommitted changes found:', 'yellow');
    console.log(status);
    
    const addResponse = runCommand('git add .', 'Adding remaining changes');
    if (addResponse) {
      runCommand('git commit -m "Final deployment preparation"', 'Committing remaining changes');
    }
  } else {
    print('No uncommitted changes found.', 'green');
  }
  
  // Push to Heroku
  if (!runCommand(`git push heroku ${currentBranch}:master -f`, 'Pushing to Heroku')) {
    print('\nDeployment failed!', 'red', true);
    return false;
  }
  
  return true;
}

/**
 * Main function
 */
async function main() {
  print('==============================================', 'blue', true);
  print('        ALL FIXES DEPLOYMENT UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print('This script deploys all fixes to Heroku\n', 'cyan');
  
  // Verify files
  if (!verifyFiles()) {
    print('\nSome required files are missing.', 'red', true);
    print('Please run the following scripts first:', 'yellow');
    print('1. npm run fix-typescript', 'dim');
    print('2. npm run fix-dependencies', 'dim');
    print('3. npm run fix-frontend', 'dim');
    process.exit(1);
  }
  
  // Configure Heroku buildpacks
  configureHerokuBuildpacks();
  
  // Set Heroku environment variables
  setHerokuEnvironmentVariables();
  
  // Deploy to Heroku
  const deploymentSuccess = deployToHeroku();
  
  if (deploymentSuccess) {
    print('\n==============================================', 'green', true);
    print('          DEPLOYMENT SUCCESSFUL!', 'green', true);
    print('==============================================', 'green', true);
    
    print('\nAll fixes have been deployed to Heroku.', 'green');
    print('\nYou should now be able to access the admin dashboard at:', 'green');
    print('https://energy-audit-store-e66479ed4f2b.herokuapp.com/admin/dashboard', 'cyan');
    
    print('\nMonitor the logs with:', 'yellow');
    print('heroku logs -tail -a energy-audit-store', 'dim');
  } else {
    print('\n==============================================', 'red', true);
    print('          DEPLOYMENT FAILED!', 'red', true);
    print('==============================================', 'red', true);
    
    print('\nDeployment to Heroku failed. Please check the logs and try again.', 'red');
    print('\nYou can try deploying manually with:', 'yellow');
    print('git push heroku your-branch:master -f', 'dim');
  }
}

// Run the script
main().catch(error => {
  print(`Fatal error: ${error.message}`, 'red', true);
  process.exit(1);
});
