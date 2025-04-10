#!/usr/bin/env node

/**
 * Energy Audit Form Auto-Population Fix Deployment Script
 * 
 * This script automates the deployment of the energy audit form auto-population
 * fix to the Heroku production environment.
 * 
 * Usage: node scripts/heroku_deploy_energy_audit_form_autopopulation_fix.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\x1b[36m%s\x1b[0m', '========================================');
console.log('\x1b[36m%s\x1b[0m', '  ENERGY AUDIT FORM AUTO-POPULATION FIX');
console.log('\x1b[36m%s\x1b[0m', '  DEPLOYMENT TO HEROKU');
console.log('\x1b[36m%s\x1b[0m', '========================================');
console.log('');

// Helper function to run a command and print its output
function runCommand(command, errorMessage) {
  try {
    console.log(`\x1b[33m> ${command}\x1b[0m`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`\x1b[31mError: ${errorMessage}\x1b[0m`);
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

// Check if the current directory is the project root
if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
  console.error('\x1b[31mError: Please run this script from the project root directory.\x1b[0m');
  process.exit(1);
}

// Check if we have the ReportDataService.ts file
const reportDataServicePath = path.join(process.cwd(), 'backend/src/services/ReportDataService.ts');
if (!fs.existsSync(reportDataServicePath)) {
  console.error('\x1b[31mError: Could not find backend/src/services/ReportDataService.ts\x1b[0m');
  process.exit(1);
}

// Verify git status - ensure we don't have uncommitted changes
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.error('\x1b[31mError: You have uncommitted changes. Please commit or stash them before deployment.\x1b[0m');
    console.error(gitStatus);
    process.exit(1);
  }
} catch (error) {
  console.error('\x1b[31mError: Failed to check git status.\x1b[0m');
  console.error(error.message);
  process.exit(1);
}

console.log('\x1b[32m✓ Git status clean\x1b[0m');

// Step 1: Switch to main branch and pull latest changes
console.log('\n\x1b[36m1. Updating main branch...\x1b[0m');
runCommand('git checkout main', 'Failed to checkout main branch');
runCommand('git pull origin main', 'Failed to pull latest changes');

// Step 2: Build the project to ensure there are no compilation errors
console.log('\n\x1b[36m2. Building project...\x1b[0m');
runCommand('npm run build', 'Build failed');

// Step 3: Deploy to Heroku
console.log('\n\x1b[36m3. Deploying to Heroku...\x1b[0m');
runCommand('git push heroku main', 'Failed to deploy to Heroku');

// Step 4: Verify deployment
console.log('\n\x1b[36m4. Verifying deployment...\x1b[0m');
try {
  const herokuAppName = 'energy-audit-store-e66479ed4f2b';
  console.log(`Opening logs for ${herokuAppName}...`);
  execSync(`heroku logs --tail --app ${herokuAppName}`, { 
    stdio: 'inherit',
    timeout: 10000 // Show logs for 10 seconds max
  });
} catch (error) {
  // Ignore timeout error, it's expected
  console.log('\nLog preview finished.');
}

console.log('\n\x1b[32m✅ Deployment completed successfully!\x1b[0m');
console.log('\n\x1b[36mVerification Steps:\x1b[0m');
console.log('1. Navigate to the energy audit form with recommendations');
console.log('2. Mark a recommendation as implemented and add actual savings value');
console.log('3. Verify the value appears correctly');
console.log('4. Refresh the page');
console.log('5. Verify the actual savings value persists and shows correctly after refresh');
console.log('6. Test with different values, including decimals');

console.log('\n\x1b[36mMonitoring:\x1b[0m');
console.log('Check the Heroku logs for any warnings or errors:');
console.log('heroku logs --tail --app energy-audit-store-e66479ed4f2b');
console.log('Watch specifically for:');
console.log('- "Error normalizing audit data"');
console.log('- "Failed to parse JSON data"');
console.log('- "Error fetching user profile data"');
