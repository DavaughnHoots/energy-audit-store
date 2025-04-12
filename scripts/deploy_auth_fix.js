/**
 * Simple direct deployment script for auth fixes
 */

const { execSync } = require('child_process');

// Branch name for this deployment
const branchName = 'fix-profile-data-extraction';

try {
  console.log('\n=== STARTING DIRECT DEPLOYMENT OF AUTH FIXES ===\n');
  
  // Push to GitHub
  console.log('Pushing to GitHub...');
  try {
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
    console.log('Successfully pushed to GitHub');
  } catch (error) {
    console.error('Failed to push to GitHub. You may need to push manually.');
    console.error(`Error: ${error.message}`);
    console.error('Continuing with Heroku deployment anyway...');
  }
  
  // Deploy to Heroku
  console.log('\n=== DEPLOYING TO HEROKU ===\n');
  try {
    execSync(`git push heroku ${branchName}:main -f`, { stdio: 'inherit' });
    console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
    console.log('Auth fixes have been deployed to Heroku.');
    console.log('The authentication process should now work correctly.');
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
  console.log('2. Clear the browser cache and cookies for the site (or use Incognito/Private browsing)');
  console.log('3. Sign in and verify that you can see the dashboard and achievements tab');
  console.log('4. Check browser console logs for profile data extraction success messages\n');
  
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error('An error occurred during deployment:');
  console.error(error.message);
  process.exit(1);
}
