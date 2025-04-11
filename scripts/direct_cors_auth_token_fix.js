/**
 * Direct CORS Auth Token Fix Deployment Script
 * 
 * This script directly deploys the CORS fixes for auth-token routes to Heroku.
 * It uses a minimalist approach to ensure the critical CORS changes are applied
 * without modifying other aspects of the application.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const FILES_TO_DEPLOY = [
  'backend/src/server.ts',
  'backend/src/routes/auth-token.enhanced.ts',
  'backend/src/middleware/auth-token-cors.js'
];

const HEROKU_APP_NAME = 'energy-audit-store';
const BRANCH_NAME = 'cors-auth-token-fix';

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

// Check if all required files exist
function checkFilesExist() {
  for (const file of FILES_TO_DEPLOY) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file ${file} does not exist`);
    }
  }
  console.log('All required files exist.');
}

// Main deployment function
async function deploy() {
  try {
    console.log('=== Starting direct CORS auth token fix deployment ===');
    
    // Check if all required files exist
    checkFilesExist();
    
    // Create a new branch for the deployment
    executeCommand(`git checkout -b ${BRANCH_NAME}`);
    
    // Stage the modified files
    for (const file of FILES_TO_DEPLOY) {
      executeCommand(`git add ${file}`);
    }
    
    // Commit the changes
    executeCommand(`git commit -m "Fix CORS issues with auth-token endpoint"`);
    
    // Push directly to Heroku
    console.log('\nPushing to Heroku...');
    executeCommand(`git push heroku ${BRANCH_NAME}:main -f`);
    
    console.log('\n=== CORS auth token fix deployment completed successfully ===');
    console.log('\nView logs with: heroku logs --tail --app energy-audit-store');
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
deploy();
