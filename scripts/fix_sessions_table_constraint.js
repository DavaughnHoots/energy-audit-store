/**
 * Fix the session table constraint violation in refreshToken method
 * - Currently hitting "duplicate key value violates unique constraint sessions_pkey"
 * - Need to modify backend to delete old sessions before creating new ones
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-sessions-constraint';

try {
  console.log('\n=== FIXING SESSIONS TABLE CONSTRAINT VIOLATION ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Paths for the files
  const userAuthServicePath = path.join(currentDir, 'backend', 'src', 'services', 'userAuthService.ts');
  
  // Make a backup of the current file
  const backupPath = path.join(currentDir, 'backend', 'src', 'services', 'userAuthService.ts.sessions-backup');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current userAuthService.ts...');
    fs.copyFileSync(userAuthServicePath, backupPath);
  }
  
  // Read the UserAuthService file
  console.log('Reading userAuthService.ts file...');
  let userAuthServiceContent = fs.readFileSync(userAuthServicePath, 'utf8');
  
  // Find the refreshToken method and update it to delete old sessions first
  console.log('Updating refreshToken method to handle session table constraint...');
  
  // Look for the part where we add new sessions
  const sessionInsertPattern = /\/\/\s*Store new access token in sessions table[\s\S]*?await client\.query\([^;]*;/m;
  
  // Replace with code that deletes old sessions first
  const updatedSessionCode = `// Delete any existing sessions for this user to avoid primary key conflicts
    await client.query(
      'DELETE FROM sessions WHERE user_id = $1',
      [user.id]
    );

    // Store new access token in sessions table
    await client.query(
      \`INSERT INTO sessions (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')\`,
      [newToken, user.id]
    );`;
  
  // Replace the session insert code
  const updatedContent = userAuthServiceContent.replace(sessionInsertPattern, updatedSessionCode);
  
  // Write the updated content back to the file
  console.log('Writing changes to userAuthService.ts...');
  fs.writeFileSync(userAuthServicePath, updatedContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${userAuthServicePath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Delete existing sessions before insert to prevent constraint violation"', { stdio: 'inherit' });
  
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
    console.log('Sessions table constraint fix has been deployed to Heroku.');
    console.log('The dashboard should now be able to refresh tokens without database errors.');
  } catch (error) {
    console.error('\n=== DEPLOYMENT FAILED ===\n');
    console.error('Failed to deploy to Heroku. Error:');
    console.error(error.message);
    console.error('\nYou may need to deploy manually using:');
    console.error(`git push heroku ${branchName}:main -f`);
  }
  
  // Next steps for checking endpoint discrepancy
  console.log('\n=== NEXT STEPS ===\n');
  console.log('For the login endpoint issue:');
  console.log('1. Check backend/src/routes/auth.ts to determine the correct signin endpoint');
  console.log('2. Either update frontend to match backend or create an additional route in the backend');
  console.log('3. Deploy the login endpoint fix as a separate change');
  
  // Verification instructions
  console.log('\n=== VERIFICATION STEPS ===\n');
  console.log('1. Open the application in your browser at https://energy-audit-store-e66479ed4f2b.herokuapp.com');
  console.log('2. Clear your browser cache or use incognito mode');
  console.log('3. Log in with your credentials');
  console.log('4. Go to the dashboard page and verify it loads properly');
  console.log('5. Check the network tab in developer tools for token refresh success');
  console.log('\nNote: If you still see login endpoint errors, you will need to fix the signin endpoint path next.\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the sessions table constraint fix:');
  console.error(error.message);
  process.exit(1);
}
