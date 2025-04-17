/**
 * Heroku deployment script for ProductGallery image display fix
 * This script will:
 * 1. Run the fix_product_image_display.js script to replace external image refs with inline base64
 * 2. Create a git branch and commit changes
 * 3. Deploy the changes to Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting deployment for ProductGallery image display fix');

// Ensure we're in the project root
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);
console.log(`Working directory: ${process.cwd()}`);

try {
  // Run the product image fix script first 
  console.log('\n1. Running fix script...');
  require('./fix_product_image_display.js');
  
  // Create a new branch for the fix
  console.log('\n2. Creating git branch...');
  try {
    execSync('git checkout -b fix/product-image-display', { stdio: 'inherit' });
  } catch (error) {
    console.log('Branch may already exist, continuing...');
  }
  
  // Add the changed files
  console.log('\n3. Adding files to git...');
  execSync('git add src/components/products/ProductGallery.tsx', { stdio: 'inherit' });
  execSync('git add scripts/fix_product_image_display.js', { stdio: 'inherit' });
  execSync('git add .build-trigger', { stdio: 'inherit' });
  
  // Commit the changes
  console.log('\n4. Committing changes...');
  execSync('git commit -m "Fix ProductGallery image display with embedded base64 images"', { stdio: 'inherit' });
  
  // Push to GitHub (optional)
  console.log('\n5. Pushing to GitHub...');
  const pushToGithub = false; // Set to true if you want to push to GitHub
  if (pushToGithub) {
    execSync('git push origin fix/product-image-display', { stdio: 'inherit' });
  } else {
    console.log('Skipping push to GitHub (set pushToGithub = true to enable)');
  }
  
  // Deploy to Heroku
  console.log('\n6. Deploying to Heroku...');
  execSync('git push heroku fix/product-image-display:main --force', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment successful!');
  console.log('\nImportant next steps:');
  console.log('1. Verify product images display correctly on the live site');
  console.log('2. Check Heroku logs to ensure there are no more 404 errors for category-default.jpg');
  console.log('3. Verify infinite loading issue is also fixed');
  console.log('4. Monitor Heroku logs for any errors: heroku logs --tail -a energy-audit-store');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\nTo rollback, run:');
  console.log('heroku rollback');
}
