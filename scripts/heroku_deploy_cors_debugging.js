/**
 * CORS Debugging Deployment Script
 * 
 * This script deploys enhanced CORS debugging middleware and routes to help diagnose
 * the auth-token CORS issues. It includes ultra-detailed logging and permissive
 * CORS settings for debugging purposes.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const HEROKU_APP_NAME = 'energy-audit-store';
const BRANCH_NAME = 'cors-enhanced-debugging';

// Utility functions
function executeCommand(command) {
  console.log(`\n> ${command}\n`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout || error.message);
    console.error(error.stderr || '');
    throw error;
  }
}

// Create a backup of files
function createBackup(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup at ${backupPath}`);
}

// Check if all required files exist
function checkFilesExist() {
  const requiredFiles = [
    'backend/src/middleware/auth-token-cors.ts',
    'backend/src/server.ts',
    'backend/src/routes/auth-token.enhanced.ts'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file ${file} does not exist`);
    }
  }
  console.log('All required files exist.');
}

// Add environment variables to Heroku
function setCorsDebugEnvVars() {
  try {
    console.log('Setting CORS_DEBUG=true environment variable...');
    executeCommand(`heroku config:set CORS_DEBUG=true --app ${HEROKU_APP_NAME}`);
    console.log('Environment variable set.');
  } catch (error) {
    console.error('Warning: Failed to set environment variables. Continuing deployment anyway.');
  }
}

// Main deployment function
async function deploy() {
  try {
    console.log('=== Starting CORS debugging deployment ===');
    
    // Check if all required files exist
    checkFilesExist();
    
    // Create backups
    createBackup('backend/src/middleware/auth-token-cors.ts');
    createBackup('backend/src/routes/auth-token.enhanced.ts');
    
    // Create a new branch for the deployment
    executeCommand(`git checkout -b ${BRANCH_NAME}`);
    
    // Set CORS_DEBUG environment variable
    setCorsDebugEnvVars();
    
    // Stage the modified files
    executeCommand('git add backend/src/middleware/auth-token-cors.ts');
    executeCommand('git add backend/src/routes/auth-token.enhanced.ts');
    
    // Commit the changes
    executeCommand('git commit -m "Add enhanced debugging for auth-token CORS"');
    
    // Push directly to Heroku
    console.log('\nPushing to Heroku...');
    executeCommand(`git push heroku ${BRANCH_NAME}:main -f`);
    
    console.log('\n=== CORS debugging deployment completed successfully ===');
    console.log(`\nCheck logs with: heroku logs --tail --app ${HEROKU_APP_NAME}`);
    console.log('Look for "AUTH-TOKEN CORS" log entries in the output.');
    console.log('\nAfter testing, the CORS_DEBUG mode can be disabled with:');
    console.log(`heroku config:unset CORS_DEBUG --app ${HEROKU_APP_NAME}`);
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
deploy();
