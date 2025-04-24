/**
 * Deployment script for fixing token naming in auth flow
 * This addresses the mobile authentication issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting deployment of sign-in token fix...');

try {
  // Step 1: Run the fix script
  console.log('🔧 Running token naming fix script...');
  execSync('node scripts/fix_signin_token_response.js', { stdio: 'inherit' });
  
  // Step 2: Check if we're in a git repository
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not in a git repository. Please run this script from the project root.');
    process.exit(1);
  }
  
  // Step 3: Add changes to git
  console.log('📝 Adding changes to git...');
  execSync('git add backend/src/services/userAuthService.ts backend/src/routes/auth.ts', { stdio: 'inherit' });
  
  // Step 4: Commit changes
  console.log('💾 Committing changes...');
  execSync('git commit -m "Fix: Update token naming consistency in auth flow for mobile compatibility"', { stdio: 'inherit' });
  
  // Step 5: Push to Heroku
  console.log('🚀 Deploying to Heroku...');
  execSync('git push heroku HEAD:main --force', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📱 Mobile authentication should now work properly. The fix:');
  console.log('   1. Ensures consistent token naming between login and refresh token flows');
  console.log('   2. Changes "token" to "accessToken" in userAuthService.loginUser return');
  console.log('   3. Adds additional safety checks and logging');
  console.log('\n⏱️ Please allow a few minutes for the changes to propagate.');
} catch (error) {
  console.error(`\n❌ Deployment failed: ${error.message}`);
  process.exit(1);
}
