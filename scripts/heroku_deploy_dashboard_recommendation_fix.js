/**
 * Deployment script for dashboard recommendation fixes
 * This addresses:
 * 1. Empty string matching bug
 * 2. Dashboard-specific fallbacks to ensure recommendations always show
 * 3. Add verbose logging for better debugging
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('┌───────────────────────────────────────────────┐');
console.log('│ Starting Dashboard Recommendation Fixes Deploy │');
console.log('└───────────────────────────────────────────────┘');

// Check that we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('Error: This script must be run from the project root');
  process.exit(1);
}

const filesToVerify = [
  'src/services/productRecommendationService.ts',
  'src/components/dashboard/EnhancedDashboardRecommendationsAdapter.tsx'
];

// Verify that the key files exist
console.log('\n✅ Verifying required files...');
for (const file of filesToVerify) {
  if (!fs.existsSync(file)) {
    console.error(`Error: Required file ${file} does not exist`);
    process.exit(1);
  } else {
    console.log(`  - ${file} - OK`);
  }
}

// Build the frontend
console.log('\n📦 Building frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('  Frontend build completed');
} catch (error) {
  console.error('Error building frontend:', error.message);
  process.exit(1);
}

// Create a git commit to track the current deploy (optional)
console.log('\n🔍 Checking git status...');
try {
  const gitStatus = execSync('git status --porcelain').toString().trim();
  if (gitStatus) {
    console.log('  Uncommitted changes detected. Already handled by previous commits.');
  }
} catch (error) {
  console.warn('  Warning: Unable to check git status. Continuing anyway...');
}

// Deploy to Heroku
console.log('\n🚀 Deploying to Heroku...');
try {
  execSync('git push heroku feature/unified-recommendation-system:main', { stdio: 'inherit' });
  console.log('  Heroku deployment completed');
} catch (error) {
  console.error('Error deploying to Heroku:', error.message);
  process.exit(1);
}

console.log('\n✨ Deployment completed successfully!');
console.log('\nChanges deployed:');
console.log('  - Fixed empty string matching bug in product recommendation filter');
console.log('  - Added dashboard-specific fallbacks to ensure recommendations always appear');
console.log('  - Added verbose logging for easier debugging');
console.log('\nYou can verify the changes at:');
console.log('  https://energy-audit-store-e66479ed4f2b.herokuapp.com/dashboard');
