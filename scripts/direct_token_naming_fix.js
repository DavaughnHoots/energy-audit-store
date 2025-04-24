/**
 * Direct Token Naming Fix and Deploy
 * 
 * This script:
 * 1. Runs the token naming adapter fix
 * 2. Commits and pushes to Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

console.log('🚀 Starting direct token naming fix and deployment...');

try {
  // Step 1: Run the fix script
  console.log('🔧 Running token naming adapter fix...');
  execSync('node scripts/fix_token_naming_adapter.js', { stdio: 'inherit' });
  
  // Step 2: Add changes to git
  console.log('📝 Adding changes to git...');
  execSync('git add src/context/AuthContext.tsx src/utils/cookieUtils.ts src/services/apiClient.ts', { stdio: 'inherit' });
  
  // Step 3: Commit changes
  console.log('💾 Committing changes...');
  execSync('git commit -m "Fix: Mobile authentication token naming inconsistency"', { stdio: 'inherit' });
  
  // Step 4: Push to Heroku
  console.log('🚀 Deploying to Heroku...');
  execSync('git push heroku HEAD:main --force', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📱 Mobile authentication should now work properly. The fix:');
  console.log('   1. Makes the frontend handle both token naming conventions (token & accessToken)');
  console.log('   2. Adds a getAccessToken() helper that checks all possible storage locations');
  console.log('   3. Updates the API client to use the more robust token retrieval');
  console.log('\n⏱️ Please allow a few minutes for the changes to propagate.');
} catch (error) {
  console.error(`\n❌ Deployment failed: ${error.message}`);
  process.exit(1);
}
