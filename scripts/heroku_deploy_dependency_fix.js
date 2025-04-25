/**
 * heroku_deploy_dependency_fix.js
 * 
 * Script to deploy fixes for Heroku dependency issues
 */

const { execSync } = require('child_process');

console.log('Starting Heroku dependency fix deployment...');

try {
  // Add files to git
  console.log('\nAdding files to git...');
  execSync('git add backend/package.json Procfile Aptfile package.json', { stdio: 'inherit' });
  
  // Commit changes
  console.log('\nCommitting changes...');
  execSync('git commit -m "Fix Heroku dependency issues"', { stdio: 'inherit' });
  
  // Push to Heroku
  console.log('\nPushing to Heroku...');
  execSync('git push heroku `git branch --show-current`:master -f', { stdio: 'inherit' });
  
  console.log('\nDeployment completed successfully!');
  console.log('Check the app status with: heroku logs -tail -a energy-audit-store');
} catch (error) {
  console.error('\nDeployment failed:', error.message);
  process.exit(1);
}
