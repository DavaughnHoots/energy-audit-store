/**
 * direct_auth_middleware_deploy.js
 * 
 * Direct deployment script for the auth middleware fix that's already been applied
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Run the deployment
try {
  console.log('Starting deployment process...');
  
  // 1. Create build trigger file
  fs.writeFileSync('.build-trigger', `# Force rebuild for auth middleware fix: ${new Date().toISOString()}`);
  
  // 2. Build the project
  console.log('Building the project...');
  execSync('npm run build');
  
  // 3. Commit the changes
  console.log('Committing changes...');
  execSync('git add .');
  execSync('git commit -m "Fix: Auth middleware to handle malformed headers and fall back to cookies"');
  
  // 4. Deploy to Heroku
  console.log('Deploying to Heroku...');
  execSync('git push heroku fix/user-dashboard:master');
  
  console.log('✅ Deployment completed successfully!');
  console.log('\nTo verify the fix is working:');
  console.log('1. Check Heroku logs: heroku logs --tail');
  console.log('2. Look for "[AUTH-FIX-v1.2]" log entries');
  console.log('3. Verify mobile login works');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\nYou can try manual deployment:');
  console.log('1. npm run build');
  console.log('2. git add .');
  console.log('3. git commit -m "Fix: Auth middleware to handle malformed headers and fall back to cookies"');
  console.log('4. git push heroku fix/user-dashboard:master');
}
