/**
 * Heroku deployment script for product category filtering fix (Version 2)
 * This script will:
 * 1. Apply changes to fix the product category filtering functionality with the corrected image handling
 * 2. Deploy to Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting deployment for product category filtering fix (v2)');

// Ensure we're in the project root
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);
console.log(`Working directory: ${process.cwd()}`);

try {
  // Run the product category filtering fix script first
  console.log('\n1. Running fix script (v2)...');
  require('./fix_product_category_filtering_v2.js');
  
  // Create a new branch for the fix
  console.log('\n2. Creating git branch...');
  try {
    execSync('git checkout -b fix/product-category-filtering-v2', { stdio: 'inherit' });
  } catch (error) {
    console.log('Branch may already exist, continuing...');
  }
  
  // Add the changed files
  console.log('\n3. Adding files to git...');
  execSync('git add src/components/products/ProductGallery.tsx', { stdio: 'inherit' });
  execSync('git add src/pages/Products2Page.tsx', { stdio: 'inherit' });
  execSync('git add scripts/fix_product_category_filtering_v2.js', { stdio: 'inherit' });
  execSync('git add .build-trigger', { stdio: 'inherit' });
  
  // Commit the changes
  console.log('\n4. Committing changes...');
  execSync('git commit -m "Fix product category filtering with internal image function implementation"', { stdio: 'inherit' });
  
  // Push to GitHub (optional)
  console.log('\n5. Pushing to GitHub...');
  const pushToGithub = false; // Set to true if you want to push to GitHub
  if (pushToGithub) {
    execSync('git push origin fix/product-category-filtering-v2', { stdio: 'inherit' });
  } else {
    console.log('Skipping push to GitHub (set pushToGithub = true to enable)');
  }
  
  // Deploy to Heroku
  console.log('\n6. Deploying to Heroku...');
  execSync('git push heroku fix/product-category-filtering-v2:main --force', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment successful!');
  console.log('\nImportant next steps:');
  console.log('1. Verify category filtering works in your browser');
  console.log('2. Monitor server logs for proper API request parameters:');
  console.log('   heroku logs --tail -a energy-audit-store');
  console.log('3. Check that the API requests include category and subcategory parameters');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\nTo rollback, run:');
  console.log('heroku rollback');
}
