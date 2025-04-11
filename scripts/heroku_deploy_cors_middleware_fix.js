/**
 * CORS Middleware Fix Deployment Script
 * 
 * This script directly deploys fixes for the CORS middleware issue
 * where a JavaScript file wasn't being properly compiled by TypeScript.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const HEROKU_APP_NAME = 'energy-audit-store';
const BRANCH_NAME = 'cors-middleware-fix';

// Utility functions
function executeCommand(command) {
  console.log(`\n> ${command}\n`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout);
    console.error(error.stderr);
    throw error;
  }
}

// Create a backup of server.ts
function createBackup(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup at ${backupPath}`);
}

// Check if all required files exist
function checkFilesExist() {
  const requiredFiles = [
    'backend/src/middleware/auth-token-cors.ts', // The new TypeScript version
    'backend/src/server.ts'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file ${file} does not exist`);
    }
  }
  console.log('All required files exist.');
}

// Main deployment function
async function deploy() {
  try {
    console.log('=== Starting CORS middleware fix deployment ===');
    
    // Check if all required files exist
    checkFilesExist();
    
    // Create backup of server.ts
    createBackup('backend/src/server.ts');
    
    // Create a new branch for the deployment
    executeCommand(`git checkout -b ${BRANCH_NAME}`);
    
    // Stage the modified files
    executeCommand('git add backend/src/middleware/auth-token-cors.ts');
    executeCommand('git add backend/src/server.ts');
    
    // Commit the changes
    executeCommand('git commit -m "Fix: Convert auth-token-cors middleware to TypeScript"');
    
    // Push directly to Heroku
    console.log('\nPushing to Heroku...');
    executeCommand(`git push heroku ${BRANCH_NAME}:main -f`);
    
    console.log('\n=== CORS middleware fix deployment completed successfully ===');
    console.log('\nView logs with: heroku logs --tail --app energy-audit-store');
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
deploy();
