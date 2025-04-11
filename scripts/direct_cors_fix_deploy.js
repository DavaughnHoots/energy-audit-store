/**
 * Direct CORS Fix Deployment Script
 * 
 * This script takes a more direct approach to deploying the CORS fix:
 * 1. Directly rename files instead of copying
 * 2. Add deployment verification markers
 * 3. Push to Heroku with clear logging
 * 
 * Usage: node scripts/direct_cors_fix_deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'cors-auth-fix-v4-direct';
const SERVER_FILE = 'backend/src/server.ts';
const FIX_FILE = 'backend/src/server.ts.cors-fix-v4';
const BACKUP_FILE = 'backend/src/server.ts.old';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
  return execSync(command, { ...defaultOptions, ...options });
}

// Perform file operations
function setupFiles() {
  // Check if files exist
  if (!fs.existsSync(FIX_FILE)) {
    log(`Error: Fix file not found: ${FIX_FILE}`, colors.red);
    process.exit(1);
  }
  
  if (!fs.existsSync(SERVER_FILE)) {
    log(`Error: Server file not found: ${SERVER_FILE}`, colors.red);
    process.exit(1);
  }
  
  log(`Backing up current server file to ${BACKUP_FILE}`, colors.yellow);
  fs.renameSync(SERVER_FILE, BACKUP_FILE);
  
  log(`Renaming fix file to ${SERVER_FILE}`, colors.green);
  fs.renameSync(FIX_FILE, SERVER_FILE);
  
  // Add a deployment verification marker to the file
  log('Adding deployment verification markers to server file', colors.magenta);
  let serverContent = fs.readFileSync(SERVER_FILE, 'utf8');
  
  // Add a timestamp marker that will be visible in Heroku logs when the server starts
  const timestamp = new Date().toISOString();
  const marker = `\n// DIRECT DEPLOYMENT MARKER (v4): ${timestamp}\n`;
  
  // Add marker near the server start logs
  serverContent = serverContent.replace(
    'server.listen(PORT, () => {',
    `server.listen(PORT, () => {\n  console.log('********************************************');\n  console.log('CORS FIX V4 DIRECT DEPLOYMENT ACTIVE: ${timestamp}');\n  console.log('********************************************');`
  );
  
  // Additional marker at the top of the file for visual confirmation
  serverContent = marker + serverContent;
  
  fs.writeFileSync(SERVER_FILE, serverContent);
  log('Deployment verification markers added successfully', colors.green);
}

// Store information about the current branch before deployment
function storeCurrentBranchInfo() {
  try {
    const currentBranch = execCommand('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' }).toString().trim();
    const currentCommit = execCommand('git rev-parse HEAD', { stdio: 'pipe' }).toString().trim();
    
    return {
      branch: currentBranch,
      commit: currentCommit
    };
  } catch (error) {
    log('Unable to get current branch information', colors.yellow);
    return {
      branch: 'unknown',
      commit: 'unknown'
    };
  }
}

// Main deployment script
async function deploy() {
  try {
    log('Starting DIRECT CORS Fix Deployment', colors.green);
    log('This approach uses direct file renaming for more reliable deployment', colors.cyan);
    
    // Check if the terminal is in the correct directory
    if (!fs.existsSync('src') || !fs.existsSync('backend')) {
      log('Error: Please run this script from the project root directory', colors.red);
      return;
    }
    
    // Store original branch information
    const originalBranch = storeCurrentBranchInfo();
    log(`Current branch: ${originalBranch.branch}`, colors.blue);
    
    // Step 1: Directly rename files and add verification markers
    log('Setting up files...', colors.yellow);
    setupFiles();
    
    // Step 2: Create new branch or checkout existing one
    try {
      execCommand(`git checkout -b ${BRANCH_NAME}`);
      log(`Created new branch: ${BRANCH_NAME}`, colors.green);
    } catch (error) {
      log(`Branch ${BRANCH_NAME} already exists, checking it out...`, colors.yellow);
      execCommand(`git checkout ${BRANCH_NAME}`);
    }
    
    // Step 3: Add and commit changes
    log('Adding modified server file to git...', colors.blue);
    execCommand(`git add ${SERVER_FILE}`);
    
    log('Committing changes...', colors.blue);
    execCommand(`git commit -m "Implement direct CORS fix with verification markers"`);
    
    // Step 4: Push to Heroku
    log('Deploying to Heroku...', colors.green);
    execCommand('git push heroku ' + BRANCH_NAME + ':main -f');
    
    log('\nDeployment completed successfully!', colors.green);
    log('CORS and Authentication fixes have been deployed WITH VERIFICATION MARKERS.', colors.green);
    
    log('\nTo verify deployment:', colors.cyan);
    log('1. Check Heroku logs for the marker:', colors.reset);
    log('   heroku logs --tail --app energy-audit-store', colors.reset);
    log('2. Look for: "CORS FIX V4 DIRECT DEPLOYMENT ACTIVE: [timestamp]"', colors.reset);
    log('3. Visit the website and check if the CORS errors are resolved', colors.reset);
    
    log('\nTo rollback if needed:', colors.yellow); 
    log(`1. Copy the backup: cp ${BACKUP_FILE} ${SERVER_FILE}`, colors.reset);
    log('2. Commit the change: git add backend/src/server.ts', colors.reset);
    log('3. Push to Heroku: git push heroku cors-auth-fix-v4-direct:main -f', colors.reset);
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, colors.red);
    log('Attempting to restore original files...', colors.yellow);
    
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        fs.renameSync(BACKUP_FILE, SERVER_FILE);
        log('Restored original server file', colors.green);
      }
    } catch (restoreError) {
      log(`Error during restoration: ${restoreError.message}`, colors.red);
    }
    
    process.exit(1);
  }
}

// Execute the deployment
deploy();
