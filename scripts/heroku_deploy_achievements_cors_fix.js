/**
 * Script to deploy CORS fixes for the achievements tab auth issues
 * 
 * This script deploys the updated server.ts, auth-token-cors.js, and auth-token.enhanced.ts files
 * with proper CORS handling to fix the CORS issues with the auth-token endpoint
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Configure git for Heroku
console.log('Configuring Git for deployment...');

try {
  console.log('\n=== STARTING DEPLOYMENT OF ACHIEVEMENTS CORS FIX ===\n');
  
  // Make sure we're on a clean branch
  const branchName = 'fix-achievements-cors-auth';
  console.log(`Creating branch ${branchName}...`);
  
  try {
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Confirm all the fixed files exist
  const filesToCheck = [
    'backend/src/middleware/auth-token-cors.js',
    'backend/src/routes/auth-token.enhanced.ts',
    'backend/src/server.ts'
  ];
  
  // Check existence of files
  filesToCheck.forEach(file => {
    if (!fs.existsSync(path.join(currentDir, file))) {
      console.error(`Error: File ${file} does not exist, aborting deployment`);
      process.exit(1);
    }
  });
  
  console.log('All required files exist, proceeding with deployment.');
  
  // Add the modified files
  console.log('Adding files to Git...');
  execSync(`git add ${filesToCheck.join(' ')}`, { stdio: 'inherit' });
  
  // Also add the implementation plan document
  try {
    execSync('git add energy-audit-vault/operations/bug-fixes/achievements-tab-cors-fix-plan.md', { stdio: 'inherit' });
    console.log('Added implementation plan document to Git');
  } catch (error) {
    console.log('Note: Could not add implementation plan document (may not exist or already staged)');
  }
  
  // Commit the changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: CORS issues with auth-token endpoint affecting achievements tab"', { stdio: 'inherit' });
  
  // Push to GitHub
  console.log('Pushing to GitHub...');
  try {
    execSync('git push -u origin ' + branchName, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to push to GitHub. You may need to push manually.');
    console.error(error.message);
  }
  
  // Deploy to Heroku
  console.log('\n=== DEPLOYING TO HEROKU ===\n');
  console.log('Note: This deploys the current branch to Heroku. Make sure all changes are committed.');
  console.log('Deploying to Heroku...');
  
  try {
    execSync('git push heroku ' + branchName + ':main -f', { stdio: 'inherit' });
    console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
    console.log('The CORS fixes have been deployed to Heroku.');
    console.log('The achievements tab should now work correctly.');
  } catch (error) {
    console.error('\n=== DEPLOYMENT FAILED ===\n');
    console.error('Failed to deploy to Heroku. Error:');
    console.error(error.message);
    console.error('\nYou may need to deploy manually using:');
    console.error('git push heroku ' + branchName + ':main -f');
  }
  
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error('An error occurred during deployment:');
  console.error(error.message);
}
