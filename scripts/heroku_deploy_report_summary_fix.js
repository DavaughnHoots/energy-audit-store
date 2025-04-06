/**
 * Heroku deployment script for report summary financial data fix
 * Deploys the fix that integrates accurate financial data for the Total Estimated Annual Savings
 * in the Summary tab of the Reports section.
 */
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting deployment of Report Summary Financial Data Fix...');

try {
  // Verify current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Current branch: ${branch}`);

  // Check if we have uncommitted changes
  const hasChanges = execSync('git status --porcelain').toString().trim().length > 0;
  if (hasChanges) {
    console.log('Committing changes...');
    execSync('git add src/pages/InteractiveReportPage.tsx report-summary-integration-plan.md');
    execSync('git commit -m "Fix: Total Estimated Annual Savings in Summary tab now uses accurate financial data"');
    console.log('Changes committed successfully.');
  } else {
    console.log('No changes to commit.');
  }

  // Push to Heroku
  console.log('Pushing to Heroku...');
  execSync('git push heroku HEAD:main', { stdio: 'inherit' });
  
  console.log('\nDeployment completed successfully!');
  console.log('\nChanges deployed:');
  console.log('1. Enhanced InteractiveReportPage to calculate accurate total estimated savings');
  console.log('2. Updated summary section with correct financial data from recommendations');
  console.log('3. Added detailed logging to trace financial data flow');
  console.log('\nVerify the fix by checking the Total Estimated Annual Savings in the Summary tab.');
  console.log('The value should now match the sum of estimated savings across all recommendations.');

} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
