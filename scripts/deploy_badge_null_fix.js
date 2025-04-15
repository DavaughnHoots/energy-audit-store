/**
 * Deploy badge null fix to Heroku
 */

const { execSync } = require('child_process');

try {
  // Create or checkout deployment branch
  try {
    console.log('Creating branch fix-badge-null-checks...');
    execSync('git checkout -b fix-badge-null-checks', { stdio: 'inherit' });
  } catch (error) {
    console.log('Branch may already exist, trying to check it out...');
    execSync('git checkout fix-badge-null-checks', { stdio: 'inherit' });
  }

  // Stage and commit changes
  console.log('Staging and committing changes...');
  execSync('git add src/services/badgeService.ts src/hooks/useBadgeProgress.ts', { stdio: 'inherit' });
  execSync('git commit -m "Fix: Add null checks for badge operations to prevent Object.values errors"', { stdio: 'inherit' });

  // Push to Heroku
  console.log('
=== DEPLOYING TO HEROKU ===
');
  execSync('git push heroku fix-badge-null-checks:main -f', { stdio: 'inherit' });
  
  console.log('
=== DEPLOYMENT SUCCESSFUL ===
');
  console.log('Badge null check fix has been deployed to Heroku!');
} catch (error) {
  console.error('
=== DEPLOYMENT FAILED ===
');
  console.error('Error:', error.message);
  process.exit(1);
}
