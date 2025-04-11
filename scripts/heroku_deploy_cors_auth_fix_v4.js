/**
 * CORS and Authentication Fix V4 Deployment Script
 * 
 * This script deploys the direct endpoint CORS fix between our Heroku domains:
 * - energy-audit-store.herokuapp.com
 * - energy-audit-store-e66479ed4f2b.herokuapp.com
 * 
 * The v4 fix takes a different approach focusing on direct route handling:
 * 1. Directly register both GET and OPTIONS handlers for the problem route
 * 2. Bypass the Express router system for this specific endpoint
 * 3. Add enhanced debugging information throughout
 * 4. Explicitly handle headers for OPTIONS preflight requests
 * 
 * Usage: node scripts/heroku_deploy_cors_auth_fix_v4.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'cors-auth-fix-v4';
const FILES_TO_DEPLOY = [
  { source: 'backend/src/server.ts.cors-fix-v4', target: 'backend/src/server.ts' }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

// Helper function to copy updated files to their target locations
function copyFiles() {
  FILES_TO_DEPLOY.forEach(file => {
    if (!fs.existsSync(file.source)) {
      log(`Source file not found: ${file.source}`, colors.red);
      process.exit(1);
    }
    
    // Create a backup of the current file if it exists
    if (fs.existsSync(file.target)) {
      const backupFile = `${file.target}.backup-${Date.now()}`;
      log(`Creating backup: ${backupFile}`, colors.yellow);
      fs.copyFileSync(file.target, backupFile);
    }
    
    log(`Copying ${file.source} to ${file.target}`, colors.cyan);
    
    // Ensure directory exists
    const targetDir = path.dirname(file.target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.copyFileSync(file.source, file.target);
  });
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

// Print rollback instructions
function printRollbackInstructions(originalBranch) {
  log('\n=== ROLLBACK INSTRUCTIONS ===', colors.yellow);
  log('If you need to roll back this deployment, use these commands:', colors.yellow);
  
  if (originalBranch.branch !== 'unknown') {
    log(`\n# Return to original branch:`, colors.cyan);
    log(`git checkout ${originalBranch.branch}`, colors.reset);
  }
  
  log(`\n# Push the previous version to Heroku:`, colors.cyan);
  log(`git push -f heroku main:main`, colors.reset);
  
  log(`\n# Alternatively, use the backup files:`, colors.cyan);
  log(`cp backend/src/server.ts.backup-* backend/src/server.ts`, colors.reset);
  log(`git add backend/src/server.ts`, colors.reset);
  log(`git commit -m "Rollback to previous version"`, colors.reset);
  log(`git push heroku ${BRANCH_NAME}:main`, colors.reset);
  
  log('\n===============================\n', colors.yellow);
}

// Main deployment script
async function deploy() {
  try {
    log('Starting CORS and Authentication Fix v4 deployment', colors.green);
    
    // Check if the terminal is in the correct directory
    if (!fs.existsSync('src') || !fs.existsSync('backend')) {
      log('Error: Please run this script from the project root directory', colors.red);
      return;
    }
    
    // Store original branch information for rollback instructions
    const originalBranch = storeCurrentBranchInfo();
    log(`Current branch: ${originalBranch.branch}`, colors.blue);
    log(`Current commit: ${originalBranch.commit}`, colors.blue);
    
    // Step 1: Copy updated files
    log('Copying updated files to their target locations...', colors.yellow);
    copyFiles();
    
    // Step 2: Create new branch or checkout existing one
    try {
      execCommand(`git checkout -b ${BRANCH_NAME}`);
      log(`Created new branch: ${BRANCH_NAME}`, colors.green);
    } catch (error) {
      log(`Branch ${BRANCH_NAME} already exists, checking it out...`, colors.yellow);
      execCommand(`git checkout ${BRANCH_NAME}`);
    }
    
    // Step 3: Add and commit changes
    log('Adding files to git...', colors.blue);
    FILES_TO_DEPLOY.forEach(file => {
      execCommand(`git add ${file.target}`);
    });
    
    log('Committing changes...', colors.blue);
    execCommand(`git commit -m "Implement direct route handlers for CORS fix v4"`);
    
    // Step 4: Push to remote repository if needed
    log('Pushing to remote repository...', colors.blue);
    try {
      execCommand('git push -u origin ' + BRANCH_NAME);
    } catch (error) {
      log('Could not push to remote repository. If you need to push, please do so manually.', colors.yellow);
    }
    
    // Step 5: Deploy to Heroku
    log('Deploying to Heroku...', colors.green);
    execCommand('git push heroku ' + BRANCH_NAME + ':main');
    
    log('Deployment completed successfully!', colors.green);
    log('CORS and Authentication fixes have been deployed.', colors.green);
    
    // Print rollback instructions
    printRollbackInstructions(originalBranch);
    
    log('To test if the CORS fix is working:', colors.cyan);
    log('1. Visit https://energy-audit-store-e66479ed4f2b.herokuapp.com', colors.reset);
    log('2. Open browser developer tools (F12)', colors.reset);
    log('3. Navigate to the Badges tab', colors.reset);
    log('4. Check the Console tab for any CORS errors', colors.reset);
    log('5. You can also check the network tab for the preflight OPTIONS request and its status code', colors.reset);
    log('6. Visit https://energy-audit-store-e66479ed4f2b.herokuapp.com/api/debug/cors to verify CORS configuration', colors.reset);
    
    log('\nSpecific improvements in this v4 fix:', colors.cyan);
    log('1. Direct route handling (bypassing router) for /api/auth-token/token-info', colors.reset);
    log('2. Explicit OPTIONS and GET handlers for the problematic endpoint', colors.reset);
    log('3. Enhanced debugging with verbose console logging', colors.reset);
    log('4. More comprehensive CORS headers for preflight requests', colors.reset);
    
    log('\nTroubleshooting tips:', colors.cyan);
    log('1. Check heroku logs with: heroku logs --tail --app energy-audit-store', colors.reset);
    log('2. Look for "Direct OPTIONS handler" or "Direct GET handler" messages', colors.reset);
    log('3. Verify that requests are properly handled by checking the network tab', colors.reset);
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Execute the deployment
deploy();
