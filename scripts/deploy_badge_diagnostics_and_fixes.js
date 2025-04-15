/**
 * Comprehensive Badge System Fix Deployment Script
 * 
 * This script deploys all badge-related fixes:
 * 1. Null safety checks for badge operations
 * 2. Cache-busting to prevent 304 responses
 * 3. New admin diagnostic tools
 */

const { execSync } = require('child_process');

console.log('\n=== DEPLOYING COMPREHENSIVE BADGE SYSTEM FIX ===\n');

// Make sure we're on a clean branch
try {
  console.log('Creating branch badge-comprehensive-fix...');
  execSync('git checkout -b badge-comprehensive-fix', { stdio: 'inherit' });
} catch (error) {
  console.log('Branch may already exist, checking it out...');
  execSync('git checkout badge-comprehensive-fix', { stdio: 'inherit' });
}

// Stage all modified files
console.log('\nStaging all badge system related files...');
execSync('git add src/services/badgeService.ts src/hooks/useBadgeProgress.ts src/pages/AdminBadgeDiagnosticsPage.tsx src/App.tsx', { stdio: 'inherit' });
try {
  execSync('git add backend/src/server.ts backend/src/routes/badges.ts src/services/apiClient.ts src/services/badgeApiClient.ts', { stdio: 'inherit' });
} catch (error) {
  console.log('Warning: Some backend files may not have been modified yet. Run fix_badge_cache_304_issue.js first if needed.');
}

// Commit changes
console.log('\nCommitting changes...');
execSync('git commit -m "Fix: Comprehensive badge system improvements and diagnostics"', { stdio: 'inherit' });

// Push to Heroku
console.log('\n=== DEPLOYING TO HEROKU ===\n');

try {
  execSync('git push heroku badge-comprehensive-fix:main -f', { stdio: 'inherit' });
  console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
  
  console.log('Comprehensive badge system fixes have been deployed!');
  console.log('\nVerification steps:');
  console.log('1. Visit https://energy-audit-store-e66479ed4f2b.herokuapp.com/admin/badges to access the new admin diagnostics page');
  console.log('2. Check that badges are properly loading in the dashboard achievements tab');
  console.log('3. Verify that network requests return 200 OK status codes instead of 304 Not Modified');
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error(`Error: ${error.message}`);
  console.log('\nTroubleshooting:');
  console.log('1. Check for syntax errors in modified files');
  console.log('2. Ensure all necessary files are properly staged and committed');
  console.log('3. You may need to run fix_badge_cache_304_issue.js first to modify backend files');
  process.exit(1);
}
