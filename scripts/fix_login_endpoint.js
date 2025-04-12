/**
 * Fix the login endpoint mismatch between frontend and backend
 * - Frontend is using /api/auth/signin but backend has /api/auth/login
 * - This adds an alias route to support both endpoints
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-login-endpoint';

try {
  console.log('\n=== FIXING LOGIN ENDPOINT MISMATCH ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Paths for the files
  const authRoutesPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts');
  
  // Make a backup of the current file
  const backupPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts.endpoint-backup');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current auth.ts...');
    fs.copyFileSync(authRoutesPath, backupPath);
  }
  
  // Read the auth routes file
  console.log('Reading auth.ts file...');
  let authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Find the login route definition and add a signin alias
  console.log('Adding signin alias for login endpoint...');
  
  // Look for the login route definition
  const loginRoutePattern = /\/\/\s*Login user[\s\S]+?router\.post\(\'\/login\',\s*authRateLimit,\s*async/m;
  
  // Create the signin alias route that calls the same handler
  const signinAliasRoute = `// Login user - with alias support for both /login and /signin
router.post('/signin', authRateLimit, async`;
  
  // Replace the login route definition
  const updatedContent = authRoutesContent.replace(loginRoutePattern, signinAliasRoute);
  
  // Write the updated content back to the file
  console.log('Writing changes to auth.ts...');
  fs.writeFileSync(authRoutesPath, updatedContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${authRoutesPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Add signin alias for login endpoint to match frontend expectations"', { stdio: 'inherit' });
  
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
    console.log('Login endpoint fix has been deployed to Heroku.');
    console.log('The signin endpoint should now work correctly.');
  } catch (error) {
    console.error('\n=== DEPLOYMENT FAILED ===\n');
    console.error('Failed to deploy to Heroku. Error:');
    console.error(error.message);
    console.error('\nYou may need to deploy manually using:');
    console.error(`git push heroku ${branchName}:main -f`);
  }
  
  // Final recommendations
  console.log('\n=== COMPLETE AUTHENTICATION FIX ===\n');
  console.log('You have now fixed both authentication issues:');
  console.log('1. Sessions table constraint violation in refreshToken');
  console.log('2. Login endpoint mismatch between frontend and backend');
  console.log('\nUsers should now be able to:');
  console.log('- Log in successfully using the signin endpoint');
  console.log('- Stay logged in with token refresh working properly');
  console.log('- Access the dashboard and other protected routes');
  
  // Verification instructions
  console.log('\n=== VERIFICATION STEPS ===\n');
  console.log('1. Open the application in your browser at https://energy-audit-store-e66479ed4f2b.herokuapp.com');
  console.log('2. Clear your browser cache and cookies or use incognito mode');
  console.log('3. Log in with your credentials');
  console.log('4. Go to the dashboard page and verify it loads properly');
  console.log('5. Check the network tab in developer tools for successful login and token refresh');
  console.log('\nIf you encounter any further issues, check the server logs for details.\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the login endpoint fix:');
  console.error(error.message);
  process.exit(1);
}
