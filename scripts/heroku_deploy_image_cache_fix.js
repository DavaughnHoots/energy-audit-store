/**
 * Heroku Deployment Script: Product Image Cache Fix
 * 
 * This script deploys a fix for the product category image caching issue.
 * The issue was that custom predefined images were not being displayed because
 * the system was using cached images from localStorage instead of the custom ones.
 * 
 * Changes:
 * 1. Modified productImageService.ts to prioritize custom images regardless of cache status
 * 2. Added a clearImageCache() function to productImageService for programmatic cache clearing
 * 3. Created a clear-images.html utility page for users to manually clear their cache
 * 4. Enhanced the clear_image_cache.js utility to use the service implementation if available
 * 
 * Usage:
 * node scripts/heroku_deploy_image_cache_fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/product-image-cache-issue';
const COMMIT_MESSAGE = 'Fix product category image caching issues';
const BUILD_TRIGGER_FILE = '.build-trigger';

// Files to include in the deployment
const FILES_TO_DEPLOY = [
  'src/services/productImageService.ts',
  'public/clear_image_cache.js',
  'public/clear-images.html'
];

console.log('Starting deployment of product image cache fix...');

try {
  // 0. Update the build trigger file to force Heroku to rebuild
  const timestamp = new Date().toISOString();
  fs.writeFileSync(BUILD_TRIGGER_FILE, `Build triggered: ${timestamp}\nReason: ${COMMIT_MESSAGE}`);
  console.log(`✓ Updated ${BUILD_TRIGGER_FILE} with timestamp ${timestamp}`);

  // 1. Create a new branch if not already on it
  try {
    execSync(`git checkout ${BRANCH_NAME}`);
    console.log(`✓ Switched to existing branch: ${BRANCH_NAME}`);
  } catch (error) {
    execSync(`git checkout -b ${BRANCH_NAME}`);
    console.log(`✓ Created and switched to new branch: ${BRANCH_NAME}`);
  }

  // 2. Add the files to git
  console.log('Adding files to git:');
  FILES_TO_DEPLOY.forEach(file => {
    if (fs.existsSync(file)) {
      execSync(`git add "${file}"`);
      console.log(`  ✓ Added ${file}`);
    } else {
      console.warn(`  ⚠ Warning: ${file} does not exist, skipping`);
    }
  });
  
  // Also add the build trigger file
  execSync(`git add "${BUILD_TRIGGER_FILE}"`);
  console.log(`  ✓ Added ${BUILD_TRIGGER_FILE}`);

  // 3. Commit the changes
  execSync(`git commit -m "${COMMIT_MESSAGE}"`);
  console.log(`✓ Committed changes with message: ${COMMIT_MESSAGE}`);

  // 4. Push to Heroku
  console.log('Pushing to Heroku main branch...');
  execSync('git push heroku HEAD:main');
  console.log('✓ Successfully pushed to Heroku');

  // 5. Provide instructions for users
  console.log('\n========== DEPLOYMENT COMPLETE ==========');
  console.log('The image cache fix has been deployed successfully.');
  console.log('\nIMPORTANT NOTES:');
  console.log('1. Users who are experiencing incorrect images should visit:');
  console.log('   https://energy-audit-store-e66479ed4f2b.herokuapp.com/clear-images.html');
  console.log('2. After clearing their cache, they should reload the product pages');
  console.log('3. The images should now display correctly according to the custom-category-images.json configuration');
  console.log('\nTechnical Details:');
  console.log('- The productImageService now prioritizes custom images over cache');
  console.log('- A new utility page is available to help users clear their image cache');
  console.log('- The changes are non-destructive and should not affect other functionality');

} catch (error) {
  console.error('❌ Deployment failed:');
  console.error(error.message);
  console.error('\nPlease fix the issues and try again.');
  process.exit(1);
}
