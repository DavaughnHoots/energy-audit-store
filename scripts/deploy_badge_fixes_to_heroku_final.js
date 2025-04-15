/**
 * Deploy badge null checks and fixes to Heroku
 */

const { execSync } = require('child_process');

try {
  console.log('\n=== DEPLOYING BADGE NULL CHECK FIXES TO HEROKU ===\n');
  
  // Create deployment branch
  try {
    console.log('Creating branch badge-null-checks-final...');
    execSync('git checkout -b badge-null-checks-final', { stdio: 'inherit' });
  } catch (error) {
    console.log('Branch may already exist, checking it out...');
    execSync('git checkout badge-null-checks-final', { stdio: 'inherit' });
  }
  
  // Stage modified files
  console.log('Staging modified files...');
  execSync('git add src/services/badgeService.ts src/hooks/useBadgeProgress.ts', { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Add null checks to prevent Object.values errors in badge components"', { stdio: 'inherit' });
  
  // Push to Heroku
  console.log('\nPushing to Heroku...');
  execSync('git push heroku badge-null-checks-final:main -f', { stdio: 'inherit' });
  
  console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
  console.log('Badge null check fixes have been deployed to Heroku.');
  console.log('The dashboard achievements tab should now load properly without errors.');
  console.log('\nTo verify:');
  console.log('1. Open https://energy-audit-store-e66479ed4f2b.herokuapp.com');
  console.log('2. Login and navigate to the dashboard');
  console.log('3. Verify that the achievements tab loads without errors');
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
