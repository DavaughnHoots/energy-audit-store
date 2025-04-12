/**
 * Deployment script for fixing profile data CORS issue in the auth routes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-auth-profile-cors';

try {
  console.log('\n=== STARTING DEPLOYMENT OF AUTH PROFILE CORS FIX ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Modify the auth-cors.js middleware
  const authCorsPath = path.join(currentDir, 'backend', 'src', 'middleware', 'auth-cors.js');
  let authCorsContent = fs.readFileSync(authCorsPath, 'utf8');
  
  // Fix the isAuthRoute check to always return true since we're already in the /api/auth path
  authCorsContent = authCorsContent.replace(
    "isAuthRoute: req.path.includes('/auth')",
    "isAuthRoute: true // Already in /api/auth path"
  );
  
  // Add more debugging for the profile endpoint
  authCorsContent = authCorsContent.replace(
    "appLogger.info('Auth CORS middleware executing', {",
    "appLogger.info('Auth CORS middleware executing', {\n      fullUrl: req.originalUrl,\n"
  );
  
  // Ensure all auth routes have proper CORS headers
  console.log('Writing updated auth-cors.js middleware...');
  fs.writeFileSync(authCorsPath, authCorsContent);
  
  // Stage the modified file
  console.log('Staging modified files...');
  execSync(`git add ${authCorsPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Update auth-cors middleware to correctly handle profile routes"', { stdio: 'inherit' });
  
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
    console.log('The auth profile CORS fix has been deployed to Heroku.');
    console.log('The achievements tab should now correctly retrieve user profile data.');
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
  console.log('2. Sign in and navigate to the achievements tab');
  console.log('3. Open the browser console (F12) to check for profile data retrieval');
  console.log('4. Verify that there are no "Profile endpoint returned success but no user data" errors');
  console.log('5. You should see your badges load properly\n');
  
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error('An error occurred during deployment:');
  console.error(error.message);
  process.exit(1);
}
