/**
 * Fix the field name mismatch between backend and frontend
 * Change 'id' to 'userId' in auth.ts profile response
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-user-id-field';

try {
  console.log('\n=== FIXING USER ID FIELD NAME MISMATCH ===\n');
  
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
  
  // Make a backup of current auth.ts if not already done
  const backupPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts.id-field-backup');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current auth.ts...');
    fs.copyFileSync(authTsPath, backupPath);
  }
  
  // Read the auth.ts file
  console.log('Reading auth.ts file...');
  let authContent = fs.readFileSync(authTsPath, 'utf8');
  
  // Replace the field name in the profile endpoint
  console.log('Updating field name from "id" to "userId" in profile response...');
  const updatedContent = authContent.replace(
    /const userData = \{\s*id: result\.rows\[0\]\.id,/,
    'const userData = {\n        userId: result.rows[0].id, // Changed from "id" to "userId" to match frontend expectations'
  );
  
  // Write the updated content back to auth.ts
  console.log('Writing changes to auth.ts...');
  fs.writeFileSync(authTsPath, updatedContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${authTsPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Change id to userId in profile endpoint response"', { stdio: 'inherit' });
  
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
    console.log('User ID field fix has been deployed to Heroku.');
    console.log('The achievements tab should now be working correctly.');
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
  console.log('2. Verify you can log in successfully');
  console.log('3. Check that the achievements tab is now loading correctly');
  console.log('4. Confirm there are no "Profile endpoint returned success but no user data" messages in the console\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the user ID field fix:');
  console.error(error.message);
  process.exit(1);
}
