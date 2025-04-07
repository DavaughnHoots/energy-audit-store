/**
 * Heroku deployment script for Dashboard Financial Data Field Mapping Fix
 * 
 * This script deploys the fix for financial data mapping issues in the dashboard:
 * - Improved field name detection and mapping
 * - Enhanced type safety in financial value extraction
 * - Better handling of alternate field names and formats
 * - Comprehensive debug logging for financial data flow
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 Starting deployment of Dashboard Financial Data Field Mapping Fix...\n');

try {
  // Ensure we're on the correct branch
  console.log('📋 Checking current branch...');
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Currently on branch: ${currentBranch}`);

  // Create a new branch for this fix
  const deployBranch = 'feature/dashboard-financial-mapping-fix';
  console.log(`\n📝 Creating deployment branch: ${deployBranch}`);
  
  try {
    execSync(`git checkout -b ${deployBranch}`);
  } catch (error) {
    console.log(`Branch ${deployBranch} might already exist, trying to check it out...`);
    execSync(`git checkout ${deployBranch}`);
  }

  // Add all changes 
  console.log('\n📦 Adding changes to git...');
  execSync('git add src/pages/UserDashboardPage.tsx dashboard-financial-data-field-mapping-fix-plan.md');
  
  // Commit the changes
  console.log('\n💾 Committing changes...');
  execSync('git commit -m "Fix dashboard financial data field mapping issues"');
  
  // Push to Heroku
  console.log('\n🚀 Pushing to Heroku...');
  execSync('git push heroku feature/dashboard-financial-mapping-fix:main --force');
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\nVerify that dashboard charts now display correct financial values.');
  
  // Return to original branch
  console.log(`\n🔙 Returning to original branch: ${currentBranch}`);
  execSync(`git checkout ${currentBranch}`);
  
} catch (error) {
  console.error('\n❌ Deployment failed with error:', error.message);
  console.error('\nPlease check the error message and try again.');
  process.exit(1);
}
