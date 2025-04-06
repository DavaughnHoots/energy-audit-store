/**
 * Heroku deployment script for chart financial data fix
 * Deploys the fixed version of the recommendation charts that shows correct financial values
 * in the Savings Analysis chart of reports.
 */
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting deployment of Chart Financial Data Fix...');

try {
  // Verify current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Current branch: ${branch}`);

  // Check if we have uncommitted changes
  const hasChanges = execSync('git status --porcelain').toString().trim().length > 0;
  if (hasChanges) {
    console.log('Committing changes...');
    execSync('git add backend/src/services/report-generation/ReportGenerationService.ts src/components/reports/ReportCharts.tsx dashboard-chart-financial-data-fix-plan.md');
    execSync('git commit -m "Fix: Chart financial data showing incorrect values in Savings Analysis"');
    console.log('Changes committed successfully.');
  } else {
    console.log('No changes to commit.');
  }

  // Push to Heroku
  console.log('Pushing to Heroku...');
  execSync('git push heroku HEAD:main', { stdio: 'inherit' });
  
  console.log('\nDeployment completed successfully!');
  console.log('\nChanges deployed:');
  console.log('1. Enhanced report generation service to properly extract and log financial data');
  console.log('2. Fixed chart data preparation to handle different types of financial values');
  console.log('3. Improved chart visualization to handle varying scales of financial data');
  console.log('\nVerify the fix by checking the Savings Analysis chart in the Reports section.');

} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
