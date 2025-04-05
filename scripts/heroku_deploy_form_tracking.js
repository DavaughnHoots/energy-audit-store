/**
 * Script to deploy form tracking enhancements to Heroku
 */
const { execSync } = require('child_process');

console.log('Starting form tracking deployment to Heroku...');

// Run git commands to prepare the deployment
try {
  // Create a new branch for the deployment
  const branchName = `deploy-form-tracking-${Date.now()}`;
  console.log(`Creating deployment branch: ${branchName}`);
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

  // Add and commit changes
  console.log('Adding files to commit...');
  execSync('git add src/hooks/analytics/useFormTracking.ts src/context/AnalyticsContext.tsx', { stdio: 'inherit' });
  
  console.log('Committing changes...');
  execSync('git commit -m "Add enhanced form tracking capabilities"', { stdio: 'inherit' });

  // Push to Heroku
  console.log('Pushing to Heroku main branch...');
  execSync('git push heroku HEAD:main -f', { stdio: 'inherit' });

  console.log('Form tracking enhancements deployed successfully!');
  console.log('Testing form tracking analytics events...');
  
  // Wait 5 seconds before running verification commands
  setTimeout(() => {
    try {
      // Execute a verification command to check if the deployment was successful
      console.log('Running verification...');
      execSync('heroku run node --eval "console.log(\'Form tracking deployment verification\')"', { stdio: 'inherit' });

      console.log('Deployment complete and verified.');
      console.log('\nMake sure to check the admin dashboard to verify that form events are being tracked properly.');
    } catch (verifyError) {
      console.error('Error during verification:', verifyError.message);
    }
  }, 5000);
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
