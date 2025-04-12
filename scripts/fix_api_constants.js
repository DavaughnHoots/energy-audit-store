/**
 * Comprehensive fix for auth refresh endpoint mismatch
 * - Updates the API_ENDPOINTS constant in api.ts
 * - Forces a clean build to ensure changes take effect
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-api-constants';

try {
  console.log('\n=== FIXING API CONSTANTS FOR AUTH REFRESH ENDPOINT ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Paths for the files
  const apiConfigPath = path.join(currentDir, 'src', 'config', 'api.ts');
  
  // Make a backup of the current file
  const backupPath = path.join(currentDir, 'src', 'config', 'api.ts.backup');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current api.ts...');
    fs.copyFileSync(apiConfigPath, backupPath);
  }
  
  // Read the apiClient.ts file
  console.log('Reading api.ts file...');
  let apiConfigContent = fs.readFileSync(apiConfigPath, 'utf8');
  
  // Update the refresh endpoint path in API_ENDPOINTS constant
  console.log('Updating refresh endpoint path in API_ENDPOINTS constant...');
  const updatedContent = apiConfigContent.replace(
    `REFRESH: '/api/auth/refresh'`,
    `REFRESH: '/api/auth/refresh-token'`
  );
  
  // Write the updated content back to api.ts
  console.log('Writing changes to api.ts...');
  fs.writeFileSync(apiConfigPath, updatedContent);
  
  // Clean dist directory and node_modules/.vite to ensure a full rebuild
  console.log('Cleaning build caches to force full rebuild...');
  try {
    if (fs.existsSync(path.join(currentDir, 'dist'))) {
      execSync('rm -rf dist', { stdio: 'inherit' });
    }
    if (fs.existsSync(path.join(currentDir, 'node_modules', '.vite'))) {
      execSync('rm -rf node_modules/.vite', { stdio: 'inherit' });
    }
    console.log('Build caches cleaned successfully');
  } catch (error) {
    console.warn('Warning: Error while cleaning caches, proceeding anyway:', error.message);
  }
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${apiConfigPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Update refresh endpoint path in API_ENDPOINTS constant"', { stdio: 'inherit' });
  
  // Push to GitHub
  console.log('Pushing to GitHub...');
  try {
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
    console.log('Successfully pushed to GitHub');
  } catch (error) {
    console.error('Failed to push to GitHub. This is non-critical for the Heroku deployment.');
    console.error(`Error: ${error.message}`);
  }
  
  // Deploy to Heroku with a forced clean build
  console.log('\n=== DEPLOYING TO HEROKU WITH CLEAN BUILD ===\n');
  try {
    // Set an environment variable to ensure the build doesn't use any cache
    process.env.HEROKU_SKIP_NPM_CACHE = 'true';
    process.env.VITE_FORCE_CLEAN_BUILD = 'true';
    
    // Deploy to Heroku with the clean build flag
    execSync(`git push heroku ${branchName}:main -f`, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
    console.log('API constants fix has been deployed to Heroku.');
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
  console.log('4. Check the network tab in developer tools for 401 errors');
  console.log('5. Refresh the page after a few minutes to test token refresh');
  console.log('\nNote: You might need to clear your browser cache or use incognito mode for a completely fresh test.\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the API constants fix:');
  console.error(error.message);
  process.exit(1);
}
