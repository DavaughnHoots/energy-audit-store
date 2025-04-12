/**
 * Deploy script for CORS domain fix
 * 
 * This script deploys a fix to remove the non-existent domain from 
 * the CORS allowed origins configuration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Files that have been modified
const modifiedFiles = [
  'backend/src/server.ts'
];

// Branch name for this deployment
const branchName = 'fix-cors-domain-config';

try {
  console.log('\n=== STARTING DEPLOYMENT OF CORS DOMAIN FIX ===\n');
  
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
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Remove non-existent domain from CORS allowed origins"', { stdio: 'inherit' });
  
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
    console.log('The CORS domain fix has been deployed to Heroku.');
    console.log('The achievements tab should now work correctly with proper CORS configuration.');
  } catch (error) {
    console.error('\n=== DEPLOYMENT FAILED ===\n');
    console.error('Failed to deploy to Heroku. Error:');
    console.error(error.message);
    console.error('\nYou may need to deploy manually using:');
    console.error(`git push heroku ${branchName}:main -f`);
  }
  
  // Deployment verification instructions
  console.log('\n=== VERIFICATION STEPS ===\n');
  console.log('1. Open the application in your browser at https://energy-audit-store-e66479ed4f2b.herokuapp.com');
  console.log('2. Navigate to the achievements tab');
  console.log('3. Check the browser console (F12) for any CORS errors');
  console.log('4. You can also verify with curl:');
  console.log('   curl -i -X OPTIONS https://energy-audit-store-e66479ed4f2b.herokuapp.com/api/auth-token/token-info');
  console.log('   You should see a 200 OK response with proper CORS headers\n');
  
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error('An error occurred during deployment:');
  console.error(error.message);
  process.exit(1);
}
