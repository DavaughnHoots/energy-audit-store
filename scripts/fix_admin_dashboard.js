#!/usr/bin/env node

/**
 * Fix Admin Dashboard Components
 * 
 * This script builds and deploys the application with improvements
 * to error handling in the admin dashboard components.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛠️  Starting Admin Dashboard Fix Process...');

try {
  // Step 1: Build the application
  console.log('\n📦 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

  // Step 2: Prepare for deployment
  console.log('\n🚀 Preparing for Heroku deployment...');
  
  // Add a file to indicate a deployment is coming
  fs.writeFileSync('.build-trigger', new Date().toISOString());
  
  // Step 3: Deploy to Heroku
  console.log('\n☁️  Deploying to Heroku...');
  console.log('📋 Committing changes...');
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Fix admin dashboard navigation analytics components"', { stdio: 'inherit' });
  
  console.log('📤 Pushing to Heroku...');
  execSync('git push heroku HEAD:main -f', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment complete!');
  console.log('\n🌟 Admin dashboard has been updated with improved error handling.');
  console.log('   The User Analytics tab should now work correctly.');
} catch (error) {
  console.error('\n❌ Error during process:', error.message);
  process.exit(1);
}
