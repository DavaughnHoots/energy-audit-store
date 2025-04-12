/**
 * Deploy script for CORS middleware fix
 * 
 * This script deploys an improved CORS configuration using the cors middleware
 * to fix issues with cross-origin requests, particularly for the auth-token endpoints.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Files that have been modified
const modifiedFiles = [
  'backend/src/server.ts'
  // Note: We're keeping auth-token-cors.js as-is for backward compatibility
];

// Branch name for this deployment
const branchName = 'fix-cors-middleware-implementation';

try {
  console.log('\n=== STARTING DEPLOYMENT OF CORS MIDDLEWARE FIX ===\n');
  
  // Check that all modified files exist
  for (const file of modifiedFiles) {
    if (!fs.existsSync(path.join(currentDir, file))) {
      console.error(`Error: File ${file} does not exist, aborting deployment`);
      process.exit(1);
    }
  }
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Stage modified files
  console.log('Staging modified files...');
  execSync(`git add ${modifiedFiles.join(' ')}`, { stdio: 'inherit' });
  
  // Try to add documentation files
  try {
    execSync('git add energy-audit-vault/operations/bug-fixes/achievements-tab-cors-fix-plan.md', { stdio: 'inherit' });
    execSync('git add energy-audit-vault/operations/deployment/achievements-tab-cors-fix-deployment.md', { stdio: 'inherit' });
    console.log('Added documentation files to commit');
  } catch (error) {
    console.log('Note: Could not add some documentation files (they may not exist or already be staged)');
  }
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Implement improved CORS handling with cors middleware"', { stdio: 'inherit' });
  
  // Push to GitHub
  console.log('Pushing to GitHub...');
  try {
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
    console.log('Successfully pushed to GitHub');
  } catch (error) {
    console.error('Failed to push to GitHub. You may need to push manually.');
    console.error(`Error: ${error.message}`);
  }
  
  // Deploy to Heroku
  console.log('\n=== DEPLOYING TO HEROKU ===\n');
  try {
    execSync(`git push heroku ${branchName}:main -f`, { stdio: 'inherit' });
    console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
    console.log('The CORS middleware fix has been deployed to Heroku.');
    console.log('The achievements tab should now work correctly with proper CORS handling.');
  } catch (error) {
    console.error('\n=== DEPLOYMENT FAILED ===\n');
    console.error('Failed to deploy to Heroku. Error:');
    console.error(error.message);
    console.error('\nYou may need to deploy manually using:');
    console.error(`git push heroku ${branchName}:main -f`);
  }
  
  // Deployment verification instructions
  console.log('\n=== VERIFICATION STEPS ===\n');
  console.log('1. Open the application in your browser');
  console.log('2. Navigate to the achievements tab');
  console.log('3. Check browser console (F12) for any CORS errors');
  console.log('4. Check the network tab to verify auth-token/token-info requests are successful');
  console.log('5. Verify the achievements tab loads correctly\n');
  
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error('An error occurred during deployment:');
  console.error(error.message);
  process.exit(1);
}
