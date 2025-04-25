/**
 * fix_missing_dependencies.js
 * 
 * Script to fix missing dependencies in the backend package.json
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
 * Execute a command and return output
 */
function runCommand(command) {
  print(`${colors.dim}> ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    print(`Error: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Add missing dependencies to backend package.json
 */
function addMissingDependencies() {
  print('\nChecking backend package.json for missing dependencies...', 'blue', true);
  
  const backendPackageJsonPath = path.join(__dirname, '..', 'backend', 'package.json');
  
  if (!fs.existsSync(backendPackageJsonPath)) {
    print(`Backend package.json not found at ${backendPackageJsonPath}`, 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(backendPackageJsonPath, 'utf8'));
  let modified = false;
  
  // List of dependencies to add based on the error messages
  const missingDependencies = {
    'papaparse': '^5.4.1',  // For CSV parsing in productDataService
    'dotenv': '^16.3.1'     // Already identified in previous fix
  };
  
  // Check and add missing dependencies
  for (const [dep, version] of Object.entries(missingDependencies)) {
    if (!packageJson.dependencies[dep]) {
      print(`Adding ${dep}@${version} to backend dependencies`, 'yellow');
      packageJson.dependencies[dep] = version;
      modified = true;
    } else {
      print(`${dep} already exists in backend dependencies: ${packageJson.dependencies[dep]}`, 'green');
    }
  }
  
  // Save changes if needed
  if (modified) {
    fs.writeFileSync(backendPackageJsonPath, JSON.stringify(packageJson, null, 2));
    print('Updated backend package.json with missing dependencies', 'green', true);
  }
  
  return modified;
}

/**
 * Suggestion for TypeScript errors
 */
function suggestTsConfigFixes() {
  print('\nTypeScript errors were detected in the build logs.', 'yellow', true);
  print('These can be fixed by adding the following to your tsconfig.json in the backend folder:', 'cyan');
  
  console.log(`{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  }
}`);
  
  print('\nAlternatively, you can temporarily bypass TypeScript errors with:', 'cyan');
  print('heroku config:set TS_NODE_TRANSPILE_ONLY=true -a energy-audit-store', 'dim');
}

/**
 * Create deployment instructions
 */
function printDeploymentInstructions() {
  print('\n==============================================', 'green', true);
  print('            DEPLOYMENT INSTRUCTIONS', 'green', true);
  print('==============================================', 'green', true);
  
  print('\nAfter fixing the missing dependencies, follow these steps:', 'cyan');
  
  print('\n1. Commit the changes:', 'cyan');
  print('   git add backend/package.json', 'dim');
  print('   git commit -m "Fix missing dependencies"', 'dim');
  
  print('\n2. Deploy to Heroku:', 'cyan');
  print('   npm run heroku-deploy-final', 'dim');
  
  print('\n3. Monitor the logs:', 'cyan');
  print('   heroku logs -tail -a energy-audit-store', 'dim');
}

/**
 * Main function
 */
function main() {
  print('==============================================', 'blue', true);
  print('       MISSING DEPENDENCIES FIX UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print('This script fixes missing dependencies based on error logs\n', 'cyan');
  
  // Add missing dependencies
  const dependenciesFixed = addMissingDependencies();
  
  // Suggest TypeScript fixes
  suggestTsConfigFixes();
  
  // Print deployment instructions
  printDeploymentInstructions();
  
  // Summary
  print('\n==============================================', 'green', true);
  print('                  SUMMARY', 'green', true);
  print('==============================================', 'green', true);
  
  if (dependenciesFixed) {
    print('Missing dependencies have been added to backend/package.json.', 'green');
    print('Deploy these changes to fix the "Cannot find package \'papaparse\'" error.', 'green');
  } else {
    print('No changes were made to dependencies.', 'yellow');
  }
  
  print('\nTypeScript errors may still need to be addressed after fixing the dependencies.', 'yellow');
}

// Run the script
main();
