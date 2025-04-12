/**
 * Fix the field naming inconsistency between backend and frontend auth profile
 * - Backend returns "userId" but frontend expects "id"
 * - This script modifies the auth profile route to include both field names
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-profile-field-naming';

try {
  console.log('\n=== FIXING PROFILE DATA FIELD NAMING ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Path to auth routes file
  const authRoutesPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts');
  
  // Make a backup of the current file
  const backupPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts.field-naming-backup');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current auth.ts...');
    fs.copyFileSync(authRoutesPath, backupPath);
  }
  
  // Read the auth routes file
  console.log('Reading auth.ts file...');
  let authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Find the profile response in the GET /profile route and modify it
  console.log('Updating profile data format to include "id" field...');
  
  // Look for the user data formatting in the profile route
  const profileDataPattern = /const\s+userData\s*=\s*\{[\s\S]*?userId[\s\S]*?\};/;
  
  // Ensure userData has both id and userId fields
  const updatedProfileData = `const userData = {
        id: result.rows[0].id, // Add id field to match frontend expectations
        userId: result.rows[0].id, // Keep userId for backward compatibility
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        phone: result.rows[0].phone || '',
        address: result.rows[0].address || '',
        role: result.rows[0].role || 'user'
      };`;
  
  // Replace the profile data formatting
  const updatedContent = authRoutesContent.replace(profileDataPattern, updatedProfileData);
  
  // Write the updated content back to the file
  console.log('Writing changes to auth.ts...');
  fs.writeFileSync(authRoutesPath, updatedContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${authRoutesPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Add id field to profile data to match frontend expectations"', { stdio: 'inherit' });
  
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
    console.log('Profile field naming fix has been deployed to Heroku.');
    console.log('The auth system should now correctly provide the "id" field expected by the frontend.');
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
  console.log('2. Clear your browser cache and cookies or use incognito mode');
  console.log('3. Log in with your credentials');
  console.log('4. Go to the dashboard page and verify it loads properly');
  console.log('5. Open browser developer tools (F12) and verify that the console no longer shows:');
  console.log('   "Profile endpoint returned success but no user data"');
  console.log('\nIf you encounter any further issues, check the server logs for details.\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the profile field naming fix:');
  console.error(error.message);
  process.exit(1);
}
