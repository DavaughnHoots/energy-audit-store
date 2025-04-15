/**
 * Heroku deployment script for the gallery-style products page
 * 
 * This script deploys the initial implementation of the Products2Page
 * featuring the new visual gallery interface for browsing products by category.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Files to be deployed
const FILES_TO_DEPLOY = [
  'src/pages/Products2Page.tsx',
  'src/components/products/CategoryGallery.tsx',
  'src/services/productImageService.ts',
  'src/App.tsx'
];

// Documentation files - not needed for deployment but good to track
const DOCUMENTATION_FILES = [
  'energy-audit-vault/operations/enhancements/products2-gallery-implementation-plan.md',
  'energy-audit-vault/frontend/features/gallery-style-products-page.md'
];

// Verify all files exist before deploying
console.log('Verifying files...');
for (const file of FILES_TO_DEPLOY) {
  if (!fs.existsSync(file)) {
    console.error(`Error: ${file} not found. Deployment cancelled.`);
    process.exit(1);
  }
  console.log(`✓ ${file} found`);
}

// Create a new Git branch
const branchName = `feature/products-gallery-${Date.now()}`;
console.log(`Creating new Git branch: ${branchName}`);
try {
  execSync(`git checkout -b ${branchName}`);
} catch (error) {
  console.error('Error creating branch:', error.message);
  process.exit(1);
}

// Stage files for commit
console.log('Staging files for commit...');
try {
  FILES_TO_DEPLOY.forEach(file => {
    execSync(`git add ${file}`);
    console.log(`✓ Added ${file}`);
  });
  
  // Add documentation files if they exist
  DOCUMENTATION_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      execSync(`git add ${file}`);
      console.log(`✓ Added documentation: ${file}`);
    }
  });
} catch (error) {
  console.error('Error staging files:', error.message);
  process.exit(1);
}

// Commit changes
console.log('Committing changes...');
try {
  execSync(`git commit -m "Add gallery-style products page implementation"`);
} catch (error) {
  console.error('Error committing changes:', error.message);
  process.exit(1);
}

// Push to Heroku
console.log('Deploying to Heroku...');
try {
  execSync('git push heroku HEAD:main -f');
  console.log('✓ Successfully deployed to Heroku!');
} catch (error) {
  console.error('Error deploying to Heroku:', error.message);
  console.log('You may need to deploy manually using: git push heroku HEAD:main -f');
  process.exit(1);
}

console.log('\nDeployment Summary:');
console.log('==================');
console.log('✓ Created new branch:', branchName);
console.log(`✓ Deployed ${FILES_TO_DEPLOY.length} files`);
console.log('✓ Included gallery-style product browsing with category images');
console.log('\nNew features available at:');
console.log('- /products2 - New gallery-style products page');
console.log('\nNOTE: This is a phased implementation. The gallery currently shows');
console.log('      categories with images. Subcategories and product listings');
console.log('      will be enhanced in subsequent deployments.');

console.log('\nReminder: After testing, merge this branch to main with:');
console.log(`git checkout main && git merge ${branchName}`);
