/**
 * Heroku deployment script for energy chart enhancements
 * 
 * This script deploys the improvements to the energy breakdown charts in the dashboard
 * to match the appearance and functionality of the charts in the reports.
 * 
a * Key changes:
 * - Increased chart container heights
 * - Enlarged pie chart radius for better visualization
 * - Improved Y-axis domain calculation for financial data
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Helper for executing commands with proper error handling
function runCommand(command, description) {
  console.log(`\n${colors.bright}${colors.blue}➤ ${description}...${colors.reset}`);
  console.log(`${colors.dim}$ ${command}${colors.reset}`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.green}✓ Done: ${description}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Failed: ${description}${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    return false;
  }
}

// Begin deployment process
console.log(`${colors.bright}${colors.cyan}====================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}  ENERGY CHART ENHANCEMENTS DEPLOY ${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}====================================${colors.reset}`);
console.log(`${colors.yellow}Started at: ${new Date().toLocaleString()}${colors.reset}`);

// 1. Make sure all changes are committed
if (!runCommand('git status --porcelain', 'Checking git status')) {
  process.exit(1);
}

const changes = execSync('git status --porcelain').toString().trim();
if (changes) {
  console.log(`${colors.yellow}⚠ Warning: You have uncommitted changes:${colors.reset}`);
  console.log(changes);
  console.log(`${colors.yellow}Please commit your changes before deploying.${colors.reset}`);
  process.exit(1);
}

// 2. Push to GitHub
if (!runCommand('git push origin feature/unified-recommendation-system', 'Pushing to GitHub')) {
  process.exit(1);
}

// 3. Push to Heroku
if (!runCommand('git push heroku feature/unified-recommendation-system:main', 'Deploying to Heroku')) {
  console.log(`${colors.red}✗ Failed to deploy to Heroku. Attempting to diagnose...${colors.reset}`);
  runCommand('heroku logs --tail', 'Checking Heroku logs');
  process.exit(1);
}

// 4. Display success message
console.log(`\n${colors.bright}${colors.green}✓ DEPLOYMENT SUCCESSFUL!${colors.reset}`);
console.log(`${colors.green}The energy chart enhancements have been deployed to Heroku.${colors.reset}`);
console.log(`${colors.yellow}Completed at: ${new Date().toLocaleString()}${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}====================================${colors.reset}`);

// Open the application in the browser
runCommand('heroku open', 'Opening application in browser');
