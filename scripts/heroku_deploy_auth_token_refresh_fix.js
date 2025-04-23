/**
 * Deploy the authentication token refresh fix to Heroku
 * 
 * This script:
 * 1. Applies the token field name fix in userAuthService.ts
 * 2. Commits changes
 * 3. Pushes to Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const branchName = 'fix/auth-token-refresh';
const commitMessage = 'Fix authentication token refresh naming inconsistency';

// Utility function to execute commands
function execute(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log('Command output:', output);
    return output;
  } catch (error) {
    console.error('Error executing command:', error.message);
    console.error('Command stderr:', error.stderr);
    throw error;
  }
}

// Apply the fix
try {
  console.log('\n===== STARTING AUTHENTICATION TOKEN REFRESH FIX DEPLOYMENT =====\n');
  
  // Create new branch
  console.log(`\n----- Creating branch: ${branchName} -----`);
  try {
    execute(`git checkout -b ${branchName}`);
  } catch (error) {
    console.log('Branch may already exist, attempting to checkout...');
    execute(`git checkout ${branchName}`);
  }
  
  // Apply the fix
  console.log('\n----- Applying authentication token refresh fix -----');
  require('./fix_auth_token_refresh');
  
  // Commit changes
  console.log('\n----- Committing changes -----');
  execute('git add backend/src/services/userAuthService.ts');
  execute(`git commit -m "${commitMessage}"`);
  
  // Push to origin
  console.log('\n----- Pushing to origin -----');
  execute(`git push origin ${branchName}`);
  
  // Deploy to Heroku
  console.log('\n----- Deploying to Heroku -----');
  execute(`git push heroku ${branchName}:main`);
  
  console.log('\n===== DEPLOYMENT COMPLETED SUCCESSFULLY =====');
  console.log('\nAuthentication token refresh fix has been deployed to Heroku.');
  console.log('Users should now be able to properly log in and access dashboard functionality.');
  
} catch (error) {
  console.error('\n===== DEPLOYMENT FAILED =====');
  console.error('\nError:', error);
  process.exit(1);
}
