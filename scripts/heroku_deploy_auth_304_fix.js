/**
 * Deployment script for fixing 304 Not Modified responses from profile endpoint
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-auth-profile-304';

try {
  console.log('\n=== STARTING DEPLOYMENT OF AUTH PROFILE 304 FIX ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Modify the auth.ts file to prevent 304 responses
  const authPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts');
  let authContent = fs.readFileSync(authPath, 'utf8');
  
  // Replace the profile endpoint handler to prevent 304 responses
  const profileEndpointRegex = /(router\.get\(\'\/profile\'.*?\{[\s\S]*?try\s*\{[\s\S]*?)(const result = await pool\.query[\s\S]*?\}\s*catch[\s\S]*?\}\s*\})/;
  
  authContent = authContent.replace(profileEndpointRegex, (match, prefix, existingImplementation) => {
    return `${prefix}
      // Set cache control headers to prevent 304 responses
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      console.log('Processing profile request with no-cache headers');
      
      ${existingImplementation}`;
  });
  
  // Also modify the response handling to add more debugging
  const responseCodeRegex = /(res\.json\(result\.rows\[0\]\);)/;
  authContent = authContent.replace(responseCodeRegex, 
    `// Log the response data for debugging
      console.log('Sending profile data:', JSON.stringify(result.rows[0]));
      
      // Always return a 200 with fresh data
      $1`);
  
  // Write the updated file
  console.log('Writing updated auth.ts...');
  fs.writeFileSync(authPath, authContent);
  
  // Stage the modified file
  console.log('Staging modified files...');
  execSync(`git add ${authPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Prevent 304 responses in profile endpoint to fix data extraction issues"', { stdio: 'inherit' });
  
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
    console.log('The auth profile 304 fix has been deployed to Heroku.');
    console.log('Profile data should now be correctly retrieved for achievements.');
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
