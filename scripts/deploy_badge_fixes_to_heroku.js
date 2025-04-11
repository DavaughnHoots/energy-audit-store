// Deployment script to push badge fixes to Heroku
// This script deploys the fixes for badges implementation with type safety improvements

const { execSync } = require('child_process');

// Configuration
const GIT_BRANCH = 'fix/git-issues';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of badge fixes to Heroku...');

try {
  // First, make sure we're on the correct branch
  console.log(`Checking if we're on the ${GIT_BRANCH} branch...`);
  const currentBranch = execSync('git branch --show-current').toString().trim();
  
  if (currentBranch !== GIT_BRANCH) {
    console.log(`Switching to ${GIT_BRANCH} branch...`);
    execSync(`git checkout ${GIT_BRANCH}`, { stdio: 'inherit' });
  } else {
    console.log(`Already on ${GIT_BRANCH} branch.`);
  }
  
  // Push to Heroku
  console.log(`Deploying ${GIT_BRANCH} to Heroku app: ${HEROKU_APP}...`);
  execSync(`git push https://git.heroku.com/${HEROKU_APP}.git ${GIT_BRANCH}:main -f`, {
    stdio: 'inherit'
  });

  console.log('\n==============================================');
  console.log('🎉 Deployment completed successfully! 🎉');
  console.log('==============================================');
  console.log('Files deployed to Heroku:');
  console.log('1. src/components/badges/BadgesTab.tsx - Using real badge implementation');
  console.log('2. src/pages/BadgesDiagnosticPage.tsx - Enhanced diagnostics page with type safety');
  console.log('3. src/services/tokenInfoService.ts - Fixed JWT token decoding with error handling');
  console.log('4. src/services/apiClient.ts - Improved API client with cookie support');
  console.log('\nDiagnostics page is available at: /diagnostics/badges');
  console.log('Access at: https://energy-audit-store.herokuapp.com/diagnostics/badges');
  
} catch (error) {
  console.error('\n❌ Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
