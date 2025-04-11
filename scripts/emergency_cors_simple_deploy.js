/**
 * Emergency CORS Fix Deployment Script
 * 
 * This script handles an emergency deployment to fix the CORS issues by:
 * 1. Using the CommonJS require() version for dotenv imports (avoids ESM issues)
 * 2. Using a simplified package.json that only includes runtime dependencies
 * 3. Updating the Procfile to install dependencies before starting
 * 
 * Usage: node scripts/emergency_cors_simple_deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

// Helper function to log with timestamp
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Helper function to execute shell commands
function execCommand(command, options = {}) {
  const defaultOptions = { stdio: 'inherit' };
  log(`Executing: ${command}`, colors.blue);
  try {
    return execSync(command, { ...defaultOptions, ...options });
  } catch (error) {
    log(`Command failed: ${error.message}`, colors.red);
    if (options.continueOnError) {
      log(`Continuing despite error...`, colors.yellow);
      return null;
    }
    throw error;
  }
}

async function deploy() {
  const branchName = 'emergency-cors-fix-simple';
  
  try {
    log(`${colors.bold}${colors.green}EMERGENCY CORS FIX DEPLOYMENT${colors.reset}`, colors.green);
    log('This script will deploy a simplified version focused on fixing the module import issues', colors.cyan);
    
    // 1. Create and checkout new branch
    try {
      log(`Creating new branch: ${branchName}`, colors.blue);
      execCommand(`git checkout -b ${branchName}`, { continueOnError: true });
    } catch (error) {
      log(`Branch may already exist, trying to checkout...`, colors.yellow);
      execCommand(`git checkout ${branchName}`, { continueOnError: true });
    }
    
    // 2. Copy simplified package.json to the main one
    log('Checking for simplified package.json...', colors.blue);
    if (fs.existsSync('backend/package-simplified.json')) {
      log('Backing up original package.json...', colors.yellow);
      if (fs.existsSync('backend/package.json')) {
        fs.copyFileSync('backend/package.json', 'backend/package.json.original');
      }
      
      log('Applying simplified package.json...', colors.green);
      fs.copyFileSync('backend/package-simplified.json', 'backend/package.json');
    } else {
      log('Simplified package.json not found! Using existing package.json.', colors.red);
    }
    
    // 3. Verify Procfile contains npm install
    log('Checking Procfile...', colors.blue);
    if (fs.existsSync('Procfile')) {
      const procfileContent = fs.readFileSync('Procfile', 'utf8');
      if (!procfileContent.includes('npm install')) {
        log('Updating Procfile to include npm install...', colors.yellow);
        fs.writeFileSync('Procfile', 'web: cd backend && npm install && npm start\n');
      } else {
        log('Procfile already includes npm install. Good!', colors.green);
      }
    } else {
      log('Creating Procfile...', colors.yellow);
      fs.writeFileSync('Procfile', 'web: cd backend && npm install && npm start\n');
    }
    
    // 4. Add and commit changes
    log('Adding changed files to git...', colors.blue);
    execCommand(`git add backend/src/server.ts backend/package.json Procfile .build-trigger`);
    
    log('Committing changes...', colors.blue);
    execCommand(`git commit -m "Emergency CORS fix: Simplified server imports and dependencies"`);
    
    // 5. Push to Heroku
    log(`${colors.bold}Pushing to Heroku...${colors.reset}`, colors.magenta);
    execCommand(`git push heroku ${branchName}:main -f`);
    
    log(`${colors.bold}${colors.green}DEPLOYMENT COMPLETED SUCCESSFULLY!${colors.reset}`, colors.green);
    log(`The emergency CORS fix has been deployed to Heroku.`, colors.green);
    
    // 6. Print verification instructions
    log(`\n${colors.bold}${colors.cyan}TO VERIFY THE DEPLOYMENT:${colors.reset}`, colors.cyan);
    log(`1. Check Heroku logs to ensure server started without errors:`, colors.reset);
    log(`   heroku logs --tail --app energy-audit-store`, colors.reset);
    
    log(`\n2. Look for these markers in the logs:`, colors.reset);
    log(`   "STARTING SERVER WITH EMERGENCY SIMPLIFIED CONFIGURATION"`, colors.reset);
    log(`   "dotenv loaded successfully"`, colors.reset);
    
    log(`\n3. Test the basic connectivity:`, colors.reset);
    log(`   Visit: https://energy-audit-store.herokuapp.com/api/ping`, colors.reset);
    log(`   Visit: https://energy-audit-store.herokuapp.com/health`, colors.reset);
    
    log(`\n4. Test the CORS fix by accessing the frontend:`, colors.reset);
    log(`   Visit: https://energy-audit-store-e66479ed4f2b.herokuapp.com`, colors.reset);
    log(`   Navigate to the Badges tab and check for CORS errors in the console (F12)`, colors.reset);
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Execute the deployment
deploy();
