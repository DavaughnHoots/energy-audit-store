/**
 * Heroku deployment script for daily usage hours fix
 * Deploys the fix that correctly populates the Daily Usage Hours field in reports
 * based on the selected occupancy pattern.
 */
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting deployment of Daily Usage Hours Population Fix...');

try {
  // Verify current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Current branch: ${branch}`);

  // Check if we have uncommitted changes
  const hasChanges = execSync('git status --porcelain').toString().trim().length > 0;
  if (hasChanges) {
    console.log('Committing changes...');
    execSync('git add src/components/audit/forms/energyDefaults.ts src/components/audit/forms/EnergyUseForm.tsx usage-hours-population-fix-plan.md');
    execSync('git commit -m "Fix: Daily Usage Hours now populated from occupancy pattern defaults"');
    console.log('Changes committed successfully.');
  } else {
    console.log('No changes to commit.');
  }

  // Push to Heroku
  console.log('Pushing to Heroku...');
  execSync('git push heroku HEAD:main', { stdio: 'inherit' });
  
  console.log('\nDeployment completed successfully!');
  console.log('\nChanges deployed:');
  console.log('1. Added durationHours values to each occupancy pattern in energyDefaults.ts');
  console.log('2. Updated EnergyUseForm.tsx to populate durationHours from selected occupancy pattern');
  console.log('\nVerify the fix by checking the Daily Usage Hours field in the interactive reports.');
  console.log('The value should now display properly based on the selected occupancy pattern (e.g., 20.0 hours/day for "Home All Day")');

} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
