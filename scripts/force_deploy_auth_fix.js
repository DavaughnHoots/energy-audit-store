/**
 * force_deploy_auth_fix.js
 * 
 * Force deploys the auth middleware fix to Heroku
 * Uses the --force flag to override Heroku's master branch with our local changes
 */

const { execSync } = require('child_process');

try {
  console.log('Starting force deployment process...');
  
  console.log('Deploying to Heroku with force flag...');
  execSync('git push heroku fix/user-dashboard:master --force');
  
  console.log('✅ Deployment completed successfully!');
  console.log('\nTo verify the fix is working:');
  console.log('1. Check Heroku logs: heroku logs --tail');
  console.log('2. Look for "[AUTH-FIX-v1.2]" log entries');
  console.log('3. Verify mobile login works');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\nYou can try manual deployment:');
  console.log('git push heroku fix/user-dashboard:master --force');
}
