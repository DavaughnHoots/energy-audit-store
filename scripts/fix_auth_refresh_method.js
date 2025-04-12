/**
 * Fix the authentication refresh token method name mismatch
 * - Backend tries to call authService.refreshTokens() but the method is named refreshToken
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-auth-refresh-method';

try {
  console.log('\n=== FIXING AUTH REFRESH METHOD NAME MISMATCH ===\n');
  
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
  const backupPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts.method-backup');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current auth.ts...');
    fs.copyFileSync(authRoutesPath, backupPath);
  }
  
  // Read the auth.ts file
  console.log('Reading auth.ts file...');
  let authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Update the method call from refreshTokens to refreshToken
  console.log('Updating method name from refreshTokens() to refreshToken()...');
  const updatedContent = authRoutesContent.replace(
    `const result = await authService.refreshTokens(refreshToken);`,
    `const result = await authService.refreshToken(refreshToken);`
  );
  
  // Write the updated content back to auth.ts
  console.log('Writing changes to auth.ts...');
  fs.writeFileSync(authRoutesPath, updatedContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${authRoutesPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Update auth refresh method name from refreshTokens to refreshToken"', { stdio: 'inherit' });
  
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
    console.log('Auth refresh method name fix has been deployed to Heroku.');
    console.log('The dashboard should now be able to refresh tokens correctly.');
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
  console.log('2. Log in with your credentials');
  console.log('3. Go to the dashboard page and verify it loads properly');
  console.log('4. Check the network tab in developer tools for refresh token errors');
  console.log('5. Refresh the page after a few minutes to test token refresh\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the auth refresh method name fix:');
  console.error(error.message);
  process.exit(1);
}
