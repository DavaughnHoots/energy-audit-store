/**
 * CORS and Authentication Fix Deployment Script
 * 
 * This script deploys fixes for CORS and authentication issues between
 * our two Heroku domains:
 * - energy-audit-store.herokuapp.com
 * - energy-audit-store-e66479ed4f2b.herokuapp.com
 * 
 * The fixes include:
 * 1. Enhanced CORS configuration in the backend
 * 2. Fixed API client to properly use ES modules for importing cookieUtils
 * 3. Improved dynamic API URL handling based on the current domain
 * 4. Enhanced error handling for cross-domain requests
 * 
 * Usage: node scripts/heroku_deploy_cors_auth_fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'cors-auth-fix';
const FILES_TO_DEPLOY = [
  { source: 'backend/src/server.ts.updated', target: 'backend/src/server.ts' },
  { source: 'src/services/apiClient.ts.updated', target: 'src/services/apiClient.ts' }
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
    
    log(`Copying ${file.source} to ${file.target}`, colors.cyan);
    
    // Ensure directory exists
    const targetDir = path.dirname(file.target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.copyFileSync(file.source, file.target);
  });
}

// Main deployment script
async function deploy() {
  try {
    log('Starting CORS and Authentication Fix deployment', colors.green);
    
    // Check if the terminal is in the correct directory
    if (!fs.existsSync('src') || !fs.existsSync('backend')) {
      log('Error: Please run this script from the project root directory', colors.red);
      return;
    }
    
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
    execCommand(`git commit -m "Fix CORS and authentication issues between domains"`);
    
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
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Execute the deployment
deploy();
