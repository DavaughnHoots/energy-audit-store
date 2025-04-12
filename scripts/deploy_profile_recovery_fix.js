/**
 * Deploy the fixed profile recovery to Heroku
 * This script deploys the updated useAuth.ts that can handle different response formats
 */

const { execSync } = require('child_process');

// Branch name to deploy from
const branchName = 'fix-frontend-profile-recovery';

try {
  console.log('\n=== DEPLOYING PROFILE RECOVERY FIX TO HEROKU ===\n');
  
  // Make sure we're on the right branch
  try {
    console.log(`Checking out branch ${branchName}...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error checking out branch ${branchName}:`, error.message);
    process.exit(1);
  }
  
  // Stage any changes if there are unstaged changes
  try {
    const status = execSync('git status --porcelain').toString();
    
    if (status.trim() !== '') {
      console.log('Staging changes...');
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "fix: Update profile recovery to handle different response formats"', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Error staging changes:', error.message);
    // Continue anyway
  }
  
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
  console.log('Deploying to Heroku...');
  try {
    execSync(`git push heroku ${branchName}:main -f`, { stdio: 'inherit' });
    console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
    console.log('Frontend profile recovery fix has been deployed to Heroku.');
    console.log('The application should now correctly handle the profile data format from the backend.');
  } catch (error) {
    console.error('\n=== DEPLOYMENT FAILED ===\n');
    console.error('Failed to deploy to Heroku. Error:');
    console.error(error.message);
    console.error('\nYou may need to deploy manually using:');
    console.error(`git push heroku ${branchName}:main -f`);
    process.exit(1);
  }
  
  // Verification instructions
  console.log('\n=== VERIFICATION STEPS ===\n');
  console.log('1. Open the application in your browser at https://energy-audit-store-e66479ed4f2b.herokuapp.com');
  console.log('2. Clear your browser cache and cookies or use incognito mode');
  console.log('3. Log in with your credentials');
  console.log('4. Go to the dashboard page and verify it loads properly');
  console.log("5. Check the achievements tab to confirm it\'s working");
  console.log('6. Open browser developer tools (F12) and verify that the console no longer shows:');
  console.log('   "Profile endpoint returned success but no user data"');
  
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error('An error occurred during deployment:');
  console.error(error.message);
  process.exit(1);
}
