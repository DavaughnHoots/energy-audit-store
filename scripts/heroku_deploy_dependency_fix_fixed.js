/**
 * heroku_deploy_dependency_fix_fixed.js
 * 
 * Script to deploy fixes for Heroku dependency issues
 * Fixed for Windows compatibility
 */

const { execSync } = require('child_process');

console.log('Starting Heroku dependency fix deployment...');

try {
  // Get current branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`Current branch: ${currentBranch}`);
  
  // Add files to git
  console.log('\nAdding files to git...');
  execSync('git add backend/package.json Procfile Aptfile package.json', { stdio: 'inherit' });
  
  // Commit changes
  console.log('\nCommitting changes...');
  execSync('git commit -m "Fix Heroku dependency issues"', { stdio: 'inherit' });
  
  // Push to Heroku
  console.log('\nPushing to Heroku...');
  execSync(`git push heroku ${currentBranch}:master -f`, { stdio: 'inherit' });
  
  console.log('\nDeployment completed successfully!');
  console.log('Check the app status with: heroku logs -tail -a energy-audit-store');
} catch (error) {
  console.error('\nDeployment failed:', error.message);
  process.exit(1);
}
