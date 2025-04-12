/**
 * Direct fix for auth.ts file - Simple file copying approach to avoid string escaping issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'emergency-auth-fix-v2';

try {
  console.log('\n=== STARTING DIRECT AUTH FILE REPLACEMENT ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Paths for the files
  const authTsPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts');
  const enhancedPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts.enhanced');
  
  // Check that enhanced file exists
  if (!fs.existsSync(enhancedPath)) {
    console.error('Enhanced auth.ts file not found at:', enhancedPath);
    process.exit(1);
  }
  
  // Make a backup of current auth.ts if not already done
  const backupPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts.bak');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current auth.ts...');
    fs.copyFileSync(authTsPath, backupPath);
  }
  
  // Simple file copy from enhanced to auth.ts
  console.log('Copying enhanced file to auth.ts...');
  fs.copyFileSync(enhancedPath, authTsPath);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${authTsPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Direct replacement of auth.ts with clean version"', { stdio: 'inherit' });
  
  // Push to GitHub
  console.log('Pushing to GitHub...');
  try {
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
    console.log('Successfully pushed to GitHub');
  } catch (error) {
    console.error('Failed to push to GitHub. This is non-critical for the Heroku deployment.');
    console.error(`Error: ${error.message}`);
  }
  
  // Deploy to Heroku
  console.log('\n=== DEPLOYING TO HEROKU ===\n');
  try {
    execSync(`git push heroku ${branchName}:main -f`, { stdio: 'inherit' });
    console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
    console.log('Direct auth.ts replacement has been deployed to Heroku.');
    console.log('The application should now be operational again.');
  } catch (error) {
    console.error('\n=== DEPLOYMENT FAILED ===\n');
    console.error('Failed to deploy to Heroku. Error:');
    console.error(error.message);
    console.error('\nYou may need to deploy manually using:');
    console.error(`git push heroku ${branchName}:main -f`);
  }
  
  // Verification instructions
  console.log('\n=== VERIFICATION STEPS ===\n');
  console.log('1. Open the application in your browser at https://energy-audit-store-e66479ed4f2b.herokuapp.com');
  console.log('2. Verify the application loads without errors');
  console.log('3. Try to log in and check if authentication works properly');
  console.log('4. Verify the achievements tab functions correctly\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the auth.ts replacement:');
  console.error(error.message);
  process.exit(1);
}
