/**
 * Fix the authentication refresh endpoint mismatch
 * - Frontend is calling /auth/refresh but backend expects /auth/refresh-token
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-auth-refresh-endpoint';

try {
  console.log('\n=== FIXING AUTH REFRESH ENDPOINT MISMATCH ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Paths for the files
  const apiClientPath = path.join(currentDir, 'src', 'services', 'apiClient.ts');
  
  // Make a backup of the current file
  const backupPath = path.join(currentDir, 'src', 'services', 'apiClient.ts.refresh-backup');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current apiClient.ts...');
    fs.copyFileSync(apiClientPath, backupPath);
  }
  
  // Read the apiClient.ts file
  console.log('Reading apiClient.ts file...');
  let apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
  
  // Update the refresh endpoint path from /auth/refresh to /auth/refresh-token
  console.log('Updating refresh endpoint path from /auth/refresh to /auth/refresh-token...');
  const updatedContent = apiClientContent.replace(
    `const response = await axios.post(\`\${API_URL}/auth/refresh\`, { `,
    `const response = await axios.post(\`\${API_URL}/auth/refresh-token\`, { `
  );
  
  // Write the updated content back to apiClient.ts
  console.log('Writing changes to apiClient.ts...');
  fs.writeFileSync(apiClientPath, updatedContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${apiClientPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Update auth refresh endpoint path to match backend expectations"', { stdio: 'inherit' });
  
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
    console.log('Auth refresh endpoint fix has been deployed to Heroku.');
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
  console.log('5. Refresh the page after a few minutes to test token refresh\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the auth refresh endpoint fix:');
  console.error(error.message);
  process.exit(1);
}
