/**
 * Heroku deployment script for ProductGallery component fixes
 * This script will:
 * 1. Run the fix_product_gallery_issues.js script to fix infinite fetching and image issues
 * 2. Create a git branch and commit changes
 * 3. Deploy the changes to Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting deployment for ProductGallery component fixes');

// Ensure we're in the project root
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);
console.log(`Working directory: ${process.cwd()}`);

try {
  // Run the product gallery fix script first
  console.log('\n1. Running fix script...');
  require('./fix_product_gallery_issues.js');
  
  // Create a new branch for the fix
  console.log('\n2. Creating git branch...');
  try {
    execSync('git checkout -b fix/product-gallery-issues', { stdio: 'inherit' });
  } catch (error) {
    console.log('Branch may already exist, continuing...');
  }
  
  // Add the changed files
  console.log('\n3. Adding files to git...');
  execSync('git add src/components/products/ProductGallery.tsx', { stdio: 'inherit' });
  execSync('git add scripts/fix_product_gallery_issues.js', { stdio: 'inherit' });
  execSync('git add .build-trigger', { stdio: 'inherit' });
  
  // Commit the changes
  console.log('\n4. Committing changes...');
  execSync('git commit -m "Fix ProductGallery infinite loading and image display issues"', { stdio: 'inherit' });
  
  // Push to GitHub (optional)
  console.log('\n5. Pushing to GitHub...');
  const pushToGithub = false; // Set to true if you want to push to GitHub
  if (pushToGithub) {
    execSync('git push origin fix/product-gallery-issues', { stdio: 'inherit' });
  } else {
    console.log('Skipping push to GitHub (set pushToGithub = true to enable)');
  }
  
  // Deploy to Heroku
  console.log('\n6. Deploying to Heroku...');
  execSync('git push heroku fix/product-gallery-issues:main --force', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment successful!');
  console.log('\nImportant next steps:');
  console.log('1. Verify product gallery loads correctly without infinite re-fetching');
  console.log('2. Confirm product filtering is working correctly when selecting category > subcategory');
  console.log('3. Check that product images are loading (or displaying proper fallbacks)');
  console.log('4. Monitor Heroku logs for any errors: heroku logs --tail -a energy-audit-store');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\nTo rollback, run:');
  console.log('heroku rollback');
}
