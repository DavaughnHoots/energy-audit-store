/**
 * Heroku Deployment Script for Product Gallery Implementation
 * 
 * This script deploys the Product Gallery component that displays products
 * for selected subcategories with proper fallback images.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const branchName = `feature/product-gallery-${Date.now()}`;
const commitMessage = 'Add product gallery with subcategory-based image fallbacks';

// Required files to check
const requiredFiles = [
  'src/components/products/ProductGallery.tsx',
  'src/pages/Products2Page.tsx',
  'src/services/productImageService.ts',
  'public/data/custom-category-images.json',
  'public/clear_image_cache.js'
];

// Deployment steps
console.log('Verifying files exist...');
const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.resolve(file)));

if (missingFiles.length > 0) {
  console.error('Error: The following required files are missing:');
  missingFiles.forEach(file => console.error(`- ${file}`));
  process.exit(1);
}

console.log('✓ All required files exist');

// Create new branch
console.log(`Creating new git branch: ${branchName}...`);
try {
  execSync(`git checkout -b ${branchName}`);
  console.log('✓ Created new branch');
} catch (error) {
  console.error('Failed to create branch:', error.message);
  process.exit(1);
}

// Add files to git
console.log('Adding files to git...');
try {
  execSync('git add ' + requiredFiles.join(' '));
  console.log('✓ Added files to git');
} catch (error) {
  console.error('Failed to add files:', error.message);
  process.exit(1);
}

// Commit changes
console.log('Committing changes...');
try {
  execSync(`git commit -m "${commitMessage}"`);
  console.log('✓ Committed changes');
} catch (error) {
  console.error('Failed to commit changes:', error.message);
  process.exit(1);
}

// Push to Heroku
console.log('Pushing to Heroku...');
try {
  execSync('git push heroku HEAD:main');
  console.log('✓ Deployed to Heroku successfully!');
} catch (error) {
  console.error('Failed to push to Heroku:', error.message);
  process.exit(1);
}

console.log('\n DEPLOYMENT SUCCESSFUL \n');
console.log(`
Product Gallery Feature has been deployed to Heroku.

Key features:
1. Product Gallery component displays products for each subcategory
2. Fallback images from subcategory/category when product has no image
3. Pagination for browsing multiple pages of products
4. Clean product card design with energy efficiency ratings
5. Cache clearing utility for immediately viewing new images

To test:
1. Visit https://energy-audit-store-e66479ed4f2b.herokuapp.com/products2
2. Navigate through categories > subcategories > product listings
3. Verify product images are displaying with proper fallbacks
4. Test pagination if there are multiple pages of products
`);
